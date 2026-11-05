import { API_BASE_URL, API_ORIGIN } from "./config";

export interface TargetCreate {
  target_value: string;
  is_monitored: boolean;
}

export interface TargetResponse {
  id: string;
  target_value: string;
  is_monitored: boolean;
  created_at: string;
  updated_at: string;
}

// Backend GraphPayloadResponse ile birebir aynı şekil
export interface ApiGraphNode {
  id: string;
  label: string;
  group: string;
  parentNode?: string | null;
  discovery_date?: string | null;
}

export interface ApiGraphEdge {
  source: string;
  target: string;
  label: string;
}

export interface ApiGraphPayload {
  nodes: ApiGraphNode[];
  links: ApiGraphEdge[];
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Sunucudan gelen veriyi beklenen şekle zorlar; bozuk mesaj grafiği çökertmesin. */
export function toGraphPayload(raw: unknown): ApiGraphPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const { nodes, links } = raw as { nodes?: unknown; links?: unknown };
  if (!Array.isArray(nodes) || !Array.isArray(links)) return null;
  return {
    nodes: nodes.filter(
      (n): n is ApiGraphNode =>
        !!n && typeof n.id === "string" && typeof n.label === "string" && typeof n.group === "string",
    ),
    links: links.filter(
      (l): l is ApiGraphEdge => !!l && typeof l.source === "string" && typeof l.target === "string",
    ),
  };
}

async function readError(response: Response, fallback: string): Promise<string> {
  const data = await response.json().catch(() => null);
  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && typeof detail[0]?.msg === "string") {
    // Pydantic "Value error, ..." önekini kullanıcıya göstermeye gerek yok
    return detail[0].msg.replace(/^Value error,\s*/i, "");
  }
  return fallback;
}

const id = (value: string) => encodeURIComponent(value);

export const api = {
  createTarget: async (data: TargetCreate): Promise<TargetResponse> => {
    const response = await fetch(`${API_BASE_URL}/targets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await readError(response, "Hedef eklenemedi."));
    return response.json();
  },

  fetchTargetGraph: async (targetId: string): Promise<ApiGraphPayload> => {
    const response = await fetch(`${API_BASE_URL}/targets/${id(targetId)}/graph`, { cache: "no-store" });
    if (!response.ok) throw new Error("Graf verisi alınamadı.");
    const payload = toGraphPayload(await response.json());
    if (!payload) throw new Error("Sunucu beklenmeyen bir graf yanıtı döndürdü.");
    return payload;
  },

  fetchTargetStatus: async (targetId: string): Promise<{ status: string }> => {
    const response = await fetch(`${API_BASE_URL}/targets/${id(targetId)}/status`, { cache: "no-store" });
    if (!response.ok) throw new Error("Tarama durumu alınamadı.");
    return response.json();
  },

  fetchAiRationale: async (nodeId: string, signal?: AbortSignal): Promise<{ rationale: string }> => {
    const response = await fetch(`${API_BASE_URL}/nodes/${id(nodeId)}/ai-rationale`, { cache: "no-store", signal });
    if (!response.ok) throw new Error("Yapay zekâ yorumu alınamadı.");
    return response.json();
  },

  chatWithCopilot: async (targetId: string | null, messages: ChatTurn[]): Promise<{ reply: string }> => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_id: targetId, messages }),
    });
    if (!response.ok) throw new Error(await readError(response, "Asistana ulaşılamadı."));
    return response.json();
  },

  exportUrl: (targetId: string, format: "pdf" | "csv") => `${API_ORIGIN}/api/export/${id(targetId)}/${format}`,
};
