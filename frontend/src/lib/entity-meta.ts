import {
  CircleHelp,
  GitCommitHorizontal,
  Globe,
  Hash,
  KeyRound,
  Mail,
  MapPin,
  Network,
  Plug,
  Server,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export type Severity = "critical" | "high" | "medium" | "low" | "info" | "error" | "unrated";

interface TypeMeta {
  label: string;
  icon: LucideIcon;
  /** İkon rengi — düğüm kartında ve detay panelinde aynı */
  tone: string;
}

const TYPE_META: Record<string, TypeMeta> = {
  domain: { label: "Kök alan adı", icon: Globe, tone: "text-blue-300" },
  subdomain: { label: "Alt alan adı", icon: Network, tone: "text-violet-300" },
  ip: { label: "IP adresi", icon: Server, tone: "text-cyan-300" },
  email: { label: "E-posta", icon: Mail, tone: "text-fuchsia-300" },
  location: { label: "Konum", icon: MapPin, tone: "text-emerald-300" },
  port: { label: "Açık servis", icon: Plug, tone: "text-orange-300" },
  api_key: { label: "API anahtarı", icon: KeyRound, tone: "text-amber-300" },
  hash: { label: "Parola özeti", icon: Hash, tone: "text-rose-300" },
  commit: { label: "Git commit", icon: GitCommitHorizontal, tone: "text-zinc-300" },
  threat: { label: "Bulgu", icon: ShieldAlert, tone: "text-red-300" },
  malicious_record: { label: "Bulgu", icon: ShieldAlert, tone: "text-red-300" },
};

const UNKNOWN: TypeMeta = { label: "Diğer", icon: CircleHelp, tone: "text-zinc-400" };

export function getTypeMeta(group: string): TypeMeta {
  return TYPE_META[group] ?? UNKNOWN;
}

export const isFindingGroup = (group: string) => group === "threat" || group === "malicious_record";

/**
 * Bulgu metninden önem derecesini çıkarır. Worker'lar etiketleri
 * "[HIGH] template: ad", "ZAP ALERT on ... -> [MEDIUM] ad", "CRITICAL: ..." biçiminde yazıyor.
 */
export function getSeverity(label: string): Severity {
  const text = label.toUpperCase();
  if (text.includes("TARGET RESOLUTION FAILED") || text.includes("[ERROR]")) return "error";
  if (/\[CRITICAL\]|\bCRITICAL:/.test(text)) return "critical";
  if (/\[HIGH\]|\bHIGH:/.test(text)) return "high";
  if (/\[MEDIUM\]|\bMEDIUM:/.test(text)) return "medium";
  if (/\[LOW\]|\bLOW:/.test(text)) return "low";
  if (/\[INFO(RMATIONAL)?\]|\bINFO:/.test(text)) return "info";
  return "unrated";
}

interface SeverityMeta {
  label: string;
  /** Rozet: arka plan + metin + kenar */
  badge: string;
  /** Düğüm kartının sol şeridi */
  bar: string;
  rank: number;
}

// Renk eşlemesi .cursorrules ile uyumlu: Info=mavi, Low=sarı, Medium=turuncu, High/Critical=kırmızı
export const SEVERITY_META: Record<Severity, SeverityMeta> = {
  critical: { label: "Kritik", badge: "bg-red-500/15 text-red-300 ring-red-500/40", bar: "bg-red-500", rank: 5 },
  high: { label: "Yüksek", badge: "bg-red-500/10 text-red-300 ring-red-500/30", bar: "bg-red-400", rank: 4 },
  medium: { label: "Orta", badge: "bg-orange-500/10 text-orange-300 ring-orange-500/30", bar: "bg-orange-400", rank: 3 },
  low: { label: "Düşük", badge: "bg-yellow-500/10 text-yellow-200 ring-yellow-500/30", bar: "bg-yellow-400", rank: 2 },
  info: { label: "Bilgi", badge: "bg-sky-500/10 text-sky-300 ring-sky-500/30", bar: "bg-sky-400", rank: 1 },
  unrated: { label: "Derecelendirilmemiş", badge: "bg-zinc-500/10 text-zinc-300 ring-zinc-500/30", bar: "bg-zinc-400", rank: 0 },
  error: { label: "Tarama hatası", badge: "bg-zinc-500/10 text-zinc-300 ring-zinc-500/30", bar: "bg-zinc-500", rank: -1 },
};

export const GROUP_PARENT = "parent_node";
