"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import type { ApiGraphPayload } from "@/lib/api";
import { GROUP_PARENT, getSeverity, getTypeMeta, isFindingGroup } from "@/lib/entity-meta";
import { buildIndex, computeAttackPaths, computeBlastRadius, computeLayout, edgeKey } from "@/lib/graph-analysis";
import { nodeTypes, type Emphasis, type EntityNodeData, type GroupNodeData } from "./graph/nodes";

export type ViewMode = "all" | "focus" | "attack";

interface InvestigationGraphProps {
  payload: ApiGraphPayload;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  viewMode: ViewMode;
  blastRadiusNode: string | null;
  /** null = canlı görünüm (tüm düğümler) */
  timelineDate: number | null;
}

const EDGE_DEFAULT = "#52525b"; // zinc-600
const EDGE_HIGHLIGHT = "#f87171"; // red-400

const minimapColor = (n: Node) => {
  if (n.type === "cluster") return "#27272a";
  const group = (n.data as EntityNodeData).group;
  if (group === "domain") return "#60a5fa";
  if (isFindingGroup(group)) return "#f87171";
  return "#71717a";
};

function GraphCanvas({ payload, selectedNodeId, onSelectNode, viewMode, blastRadiusNode, timelineDate }: InvestigationGraphProps) {
  const { fitView } = useReactFlow();
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const draggedPositions = useRef(new Map<string, { x: number; y: number }>());
  const userMovedViewport = useRef(false);

  const index = useMemo(() => buildIndex(payload.nodes, payload.links), [payload]);
  const layout = useMemo(() => computeLayout(payload.nodes, index), [payload.nodes, index]);

  const highlight = useMemo(() => {
    if (viewMode === "attack") return computeAttackPaths(index);
    if (blastRadiusNode) return computeBlastRadius(index, blastRadiusNode);
    return null;
  }, [index, viewMode, blastRadiusNode]);

  const toggleGroup = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const hiddenIds = useMemo(() => {
    const hidden = new Set<string>();
    for (const n of payload.nodes) {
      const time = n.discovery_date ? Date.parse(n.discovery_date) : NaN;
      const isFuture = timelineDate !== null && !Number.isNaN(time) && time > timelineDate;
      if (isFuture || (n.parentNode && collapsed.has(n.parentNode))) hidden.add(n.id);
    }
    return hidden;
  }, [payload.nodes, timelineDate, collapsed]);

  const builtNodes = useMemo<Node[]>(() => {
    const emphasisFor = (id: string, group: string, parent?: string | null): Emphasis => {
      if (highlight) return highlight.has(id) ? "highlight" : "faint";
      if (viewMode === "focus") {
        const critical = group === "domain" || isFindingGroup(group) || id === "group_threats" || parent === "group_threats";
        return critical ? "normal" : "muted";
      }
      return "normal";
    };

    return payload.nodes.map((n): Node => {
      const position = draggedPositions.current.get(n.id) ?? layout.positions.get(n.id) ?? { x: 0, y: 0 };
      const emphasis = emphasisFor(n.id, n.group, n.parentNode);
      const base = {
        id: n.id,
        position,
        hidden: hiddenIds.has(n.id),
        ...(n.parentNode ? { parentNode: n.parentNode } : {}),
      };

      if (n.group === GROUP_PARENT) {
        const size = layout.sizes.get(n.id) ?? { width: 240, height: 96 };
        const data: GroupNodeData = {
          label: n.label,
          childCount: index.children.get(n.id)?.length ?? 0,
          width: size.width,
          height: size.height,
          collapsed: collapsed.has(n.id),
          emphasis,
          onToggle: toggleGroup,
        };
        return { ...base, type: "cluster", data, selectable: false, zIndex: -1, ariaLabel: `Grup: ${n.label}` };
      }

      const data: EntityNodeData = {
        label: n.label,
        group: n.group,
        severity: isFindingGroup(n.group) ? getSeverity(n.label) : null,
        emphasis,
      };
      return {
        ...base,
        type: "entity",
        data,
        selected: n.id === selectedNodeId,
        ariaLabel: `${getTypeMeta(n.group).label}: ${n.label}`,
      };
    });
  }, [payload.nodes, layout, index, hiddenIds, highlight, viewMode, collapsed, toggleGroup, selectedNodeId]);

  const edges = useMemo<Edge[]>(() => {
    const seen = new Set<string>();
    const result: Edge[] = [];
    for (const e of payload.links) {
      const id = edgeKey(e.source, e.target);
      if (seen.has(id)) continue;
      seen.add(id);
      const isHighlighted = highlight?.has(id) ?? false;
      const isFaint = highlight !== null && !isHighlighted;
      const isMuted = !highlight && viewMode === "focus";
      result.push({
        id,
        source: e.source,
        target: e.target,
        type: "straight",
        hidden: hiddenIds.has(e.source) || hiddenIds.has(e.target),
        // Etiketler yalnızca vurgulanan yollarda: geri kalanı görsel gürültüydü
        label: isHighlighted ? e.label : undefined,
        animated: isHighlighted,
        style: {
          stroke: isHighlighted ? EDGE_HIGHLIGHT : EDGE_DEFAULT,
          strokeWidth: isHighlighted ? 2 : 1.25,
          opacity: isFaint ? 0.12 : isMuted ? 0.4 : 1,
        },
        labelStyle: { fill: "#fecaca", fontSize: 10 },
        labelBgStyle: { fill: "#18181b" },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 3,
      });
    }
    return result;
  }, [payload.links, highlight, viewMode, hiddenIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  useEffect(() => setNodes(builtNodes), [builtNodes, setNodes]);

  // Yeni düğümler geldikçe görünümü sığdır; kullanıcı kaydırıp yakınlaştırdıysa dokunma.
  // (Eski sürüm yalnızca ilk render'da, yani boş yer tutucu düğüme fitView yapıyordu.)
  // fitView yalnızca DOM'da ölçülmüş düğümleri hesaba katar; ölçüm bitmeden çağrılırsa boşa gider.
  const nodesMeasured = useNodesInitialized();
  const visibleCount = payload.nodes.length - hiddenIds.size;
  useEffect(() => {
    if (!nodesMeasured || userMovedViewport.current || visibleCount === 0) return;
    const frame = requestAnimationFrame(() => fitView({ padding: 0.15, duration: 250 }));
    return () => cancelAnimationFrame(frame);
  }, [nodesMeasured, visibleCount, fitView]);

  // Seçim tek yönlü akar: selectedNodeId prop'u → düğümlerin `selected` alanı.
  // (onSelectionChange ile çift yönlü senkron, bayat seçimle sonsuz güncelleme döngüsü üretiyordu.)
  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (node.type === "entity") onSelectNode(node.id);
    },
    [onSelectNode],
  );

  // React Flow düğümleri Tab ile odaklanabilir ama Enter yalnızca seçim yapar, onNodeClick'i
  // tetiklemez. Klavye kullanıcıları için Enter/Space ile detay panelini aç.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = (e.target as HTMLElement).closest<HTMLElement>(".react-flow__node-entity");
      const id = el?.dataset.id;
      if (id) {
        e.preventDefault();
        onSelectNode(id);
      }
    },
    [onSelectNode],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onNodeClick={handleNodeClick}
      onPaneClick={() => onSelectNode(null)}
      onKeyDown={handleKeyDown}
      onNodeDragStop={(_, node) => draggedPositions.current.set(node.id, node.position)}
      onMoveStart={(event) => {
        if (event) userMovedViewport.current = true;
      }}
      nodesConnectable={false}
      onlyRenderVisibleElements={payload.nodes.length > 200}
      minZoom={0.1}
      attributionPosition="top-right"
      aria-label="Keşif grafiği"
      className="nexus-flow"
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
      <Controls showInteractive={false} position="top-left" />
      <MiniMap
        nodeColor={minimapColor}
        maskColor="rgba(9, 9, 11, 0.7)"
        pannable
        zoomable
        ariaLabel="Grafik mini haritası"
        position="bottom-left"
        className="max-md:!hidden"
      />
    </ReactFlow>
  );
}

export function InvestigationGraph(props: InvestigationGraphProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvas {...props} />
    </ReactFlowProvider>
  );
}
