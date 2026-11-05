"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SEVERITY_META, getTypeMeta, isFindingGroup, type Severity } from "@/lib/entity-meta";
import { NODE_HEIGHT, NODE_WIDTH } from "@/lib/graph-analysis";

export type Emphasis = "normal" | "muted" | "faint" | "highlight";

const emphasisClass: Record<Emphasis, string> = {
  normal: "opacity-100",
  highlight: "opacity-100",
  muted: "opacity-40",
  faint: "opacity-10",
};

export interface EntityNodeData {
  label: string;
  group: string;
  severity: Severity | null;
  emphasis: Emphasis;
}

// Bağlantı noktaları düğüm merkezinde: radyal yerleşimde kenarlar merkezden merkeze düz çizilir
const hiddenHandle =
  "!left-1/2 !top-1/2 !h-px !w-px !min-h-0 !min-w-0 !-translate-x-1/2 !-translate-y-1/2 !border-0 !bg-transparent";

export const EntityNode = memo(function EntityNode({ data, selected }: NodeProps<EntityNodeData>) {
  const meta = getTypeMeta(data.group);
  const Icon = meta.icon;
  const isRoot = data.group === "domain";
  const severity = data.severity && isFindingGroup(data.group) ? SEVERITY_META[data.severity] : null;

  return (
    <div
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
      className={[
        "relative flex items-center gap-2 overflow-hidden rounded-md border px-3 text-[13px] transition-opacity duration-300",
        isRoot ? "border-blue-400/60 bg-zinc-900 font-medium text-zinc-50" : "border-zinc-700 bg-zinc-900 text-zinc-200",
        data.emphasis === "highlight" ? "!border-red-400 bg-red-950/40" : "",
        selected ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-zinc-950" : "",
        emphasisClass[data.emphasis],
      ].join(" ")}
      title={data.label}
    >
      {severity && <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${severity.bar}`} />}
      <Icon aria-hidden className={`h-4 w-4 shrink-0 ${meta.tone}`} strokeWidth={1.75} />
      <span className="truncate">{data.label}</span>
      <Handle type="target" position={Position.Top} isConnectable={false} className={hiddenHandle} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} className={hiddenHandle} />
    </div>
  );
});

export interface GroupNodeData {
  label: string;
  childCount: number;
  width: number;
  height: number;
  collapsed: boolean;
  emphasis: Emphasis;
  onToggle: (id: string) => void;
}

export const GroupNode = memo(function GroupNode({ id, data }: NodeProps<GroupNodeData>) {
  const Chevron = data.collapsed ? ChevronRight : ChevronDown;
  return (
    <div
      style={{ width: data.width, height: data.collapsed ? 44 : data.height }}
      className={[
        "rounded-lg border bg-zinc-900/40 transition-opacity duration-300",
        data.emphasis === "highlight" ? "border-red-400/70" : "border-zinc-800",
        emphasisClass[data.emphasis],
      ].join(" ")}
    >
      {/* nodrag: başlığa tıklamak grubu sürüklemeden aç/kapa yapsın */}
      <button
        type="button"
        onClick={() => data.onToggle(id)}
        aria-expanded={!data.collapsed}
        className="nodrag flex h-11 w-full items-center gap-2 rounded-t-lg px-3 text-left text-[13px] font-medium text-zinc-200 hover:bg-zinc-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
      >
        <Chevron aria-hidden className="h-4 w-4 text-zinc-400" />
        <span>{data.label}</span>
        <span className="ml-auto tabular-nums text-xs text-zinc-400">
          {data.childCount}
          <span className="sr-only"> öğe</span>
        </span>
      </button>
      <Handle type="target" position={Position.Top} isConnectable={false} className={hiddenHandle} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} className={hiddenHandle} />
    </div>
  );
});

export const nodeTypes = { entity: EntityNode, cluster: GroupNode };
