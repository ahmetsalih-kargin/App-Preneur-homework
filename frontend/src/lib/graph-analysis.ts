import type { ApiGraphEdge, ApiGraphNode } from "./api";
import { GROUP_PARENT, getSeverity } from "./entity-meta";

export const edgeKey = (source: string, target: string) => `${source}->${target}`;

interface Index {
  byId: Map<string, ApiGraphNode>;
  outgoing: Map<string, ApiGraphEdge[]>;
  incoming: Map<string, ApiGraphEdge[]>;
  children: Map<string, string[]>;
}

/**
 * Komşuluk haritaları. Eski kod her BFS adımında tüm düğüm ve kenar dizisini
 * tarıyordu (O(V·(V+E)), kill-chain'de içteki .find ile O(V²·…)); büyük
 * taramalarda her mod değişiminde arayüz donuyordu. Bu indeks O(V+E).
 */
export function buildIndex(nodes: ApiGraphNode[], edges: ApiGraphEdge[]): Index {
  const byId = new Map<string, ApiGraphNode>();
  const outgoing = new Map<string, ApiGraphEdge[]>();
  const incoming = new Map<string, ApiGraphEdge[]>();
  const children = new Map<string, string[]>();

  for (const n of nodes) {
    byId.set(n.id, n);
    if (n.parentNode) {
      const list = children.get(n.parentNode) ?? [];
      list.push(n.id);
      children.set(n.parentNode, list);
    }
  }
  for (const e of edges) {
    (outgoing.get(e.source) ?? outgoing.set(e.source, []).get(e.source)!).push(e);
    (incoming.get(e.target) ?? incoming.set(e.target, []).get(e.target)!).push(e);
  }
  return { byId, outgoing, incoming, children };
}

// Tarama hatası ve bilgi kayıtları saldırı yolu başlangıcı sayılmaz
const isRiskyFinding = (n: ApiGraphNode) => {
  if (n.group !== "threat") return false;
  const s = getSeverity(n.label);
  return s !== "error" && s !== "info";
};

const isHighRisk = (n: ApiGraphNode) =>
  isRiskyFinding(n) ||
  n.group === "api_key" ||
  n.group === "hash" ||
  (n.group === "port" && !/^(80|443)(\/|$)/.test(n.label));

/**
 * Etki alanı: seçilen düğümden erişilebilen her şey.
 * Kök alan adı seçildiyse yalnızca yüksek riskli düğümlere giden yollar işaretlenir.
 * Dönen küme düğüm id'lerini ve edgeKey() değerlerini birlikte içerir.
 */
export function computeBlastRadius(index: Index, startId: string): Set<string> {
  const start = index.byId.get(startId);
  if (!start) return new Set();

  const visited = new Set<string>([startId]);
  const cameFrom = new Map<string, { from: string; edge?: string }>();
  const reachedEdges = new Set<string>();
  const queue = [startId];

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    for (const e of index.outgoing.get(current) ?? []) {
      const key = edgeKey(e.source, e.target);
      reachedEdges.add(key);
      if (!visited.has(e.target)) {
        visited.add(e.target);
        cameFrom.set(e.target, { from: current, edge: key });
        queue.push(e.target);
      }
    }
    for (const child of index.children.get(current) ?? []) {
      if (!visited.has(child)) {
        visited.add(child);
        cameFrom.set(child, { from: current });
        queue.push(child);
      }
    }
  }

  if (start.group !== "domain") return new Set([...visited, ...reachedEdges]);

  const result = new Set<string>([startId]);
  for (const id of visited) {
    const node = index.byId.get(id);
    if (!node || !isHighRisk(node)) continue;
    let current = id;
    while (current !== startId) {
      result.add(current);
      const step = cameFrom.get(current);
      if (!step) break;
      if (step.edge) result.add(step.edge);
      current = step.from;
    }
  }
  return result;
}

/** Saldırı yolu: her yüksek riskli düğümden köke kadar geriye doğru tüm yollar. */
export function computeAttackPaths(index: Index): Set<string> {
  const result = new Set<string>();
  const queue: string[] = [];
  for (const n of index.byId.values()) {
    if (isRiskyFinding(n) || n.group === "api_key" || n.group === "hash") {
      result.add(n.id);
      queue.push(n.id);
    }
  }
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    for (const e of index.incoming.get(current) ?? []) {
      result.add(edgeKey(e.source, e.target));
      if (!result.has(e.source)) {
        result.add(e.source);
        queue.push(e.source);
      }
    }
    const parent = index.byId.get(current)?.parentNode;
    if (parent && !result.has(parent)) {
      result.add(parent);
      queue.push(parent);
    }
  }
  return result;
}

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>;
  sizes: Map<string, { width: number; height: number }>;
}

export const NODE_WIDTH = 176;
export const NODE_HEIGHT = 44;
const GROUP_PADDING = 16;
const GROUP_HEADER = 44;
const GAP = 12;

/** Kök merkezde, gruplar ve bağımsız düğümler çevresinde bir çember üzerinde. */
export function computeLayout(nodes: ApiGraphNode[], index: Index): LayoutResult {
  const positions = new Map<string, { x: number; y: number }>();
  const sizes = new Map<string, { width: number; height: number }>();
  const center = nodes.find((n) => n.group === "domain") ?? nodes[0];
  if (!center) return { positions, sizes };

  positions.set(center.id, { x: -NODE_WIDTH / 2, y: -NODE_HEIGHT / 2 });

  for (const n of nodes) {
    if (n.group !== GROUP_PARENT) continue;
    const kids = index.children.get(n.id) ?? [];
    const cols = Math.max(1, Math.ceil(Math.sqrt(kids.length)));
    const rows = Math.max(1, Math.ceil(kids.length / cols));
    kids.forEach((kid, i) => {
      positions.set(kid, {
        x: GROUP_PADDING + (i % cols) * (NODE_WIDTH + GAP),
        y: GROUP_HEADER + GROUP_PADDING + Math.floor(i / cols) * (NODE_HEIGHT + GAP),
      });
    });
    sizes.set(n.id, {
      width: Math.max(240, GROUP_PADDING * 2 + cols * NODE_WIDTH + (cols - 1) * GAP),
      height: kids.length === 0 ? 96 : GROUP_HEADER + GROUP_PADDING * 2 + rows * NODE_HEIGHT + (rows - 1) * GAP,
    });
  }

  const outer = nodes.filter((n) => n.id !== center.id && !n.parentNode);
  const largest = Math.max(0, ...outer.map((n) => Math.max(sizes.get(n.id)?.width ?? 0, sizes.get(n.id)?.height ?? 0)));
  const radius = Math.max(320, largest * 0.75 + 220, outer.length * 110);
  outer.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / outer.length - Math.PI / 2;
    const size = sizes.get(n.id) ?? { width: NODE_WIDTH, height: NODE_HEIGHT };
    positions.set(n.id, {
      x: radius * Math.cos(angle) - size.width / 2,
      y: radius * Math.sin(angle) - size.height / 2,
    });
  });

  return { positions, sizes };
}
