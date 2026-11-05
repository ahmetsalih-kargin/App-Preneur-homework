"use client";

import { useId } from "react";

interface TimelineProps {
  min: number;
  max: number;
  /** null = canlı (en güncel, yeni gelen düğümler de görünür) */
  value: number | null;
  onChange: (value: number | null) => void;
}

const fmt = new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "medium" });

export function Timeline({ min, max, value, onChange }: TimelineProps) {
  const id = useId();
  const current = value ?? max;
  const isLive = value === null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-zinc-800 bg-zinc-900/95 px-4 py-3 shadow-lg shadow-black/30 backdrop-blur">
      <label htmlFor={id} className="text-sm font-medium text-zinc-200">
        Zaman
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1000}
        value={current}
        aria-valuetext={fmt.format(current)}
        onChange={(e) => {
          const v = Number(e.target.value);
          // Sağ uca çekilince canlı moda dön: sonradan gelen düğümler gizli kalmasın
          onChange(v >= max ? null : v);
        }}
        className="h-1.5 min-w-[10rem] flex-1 cursor-pointer accent-blue-500"
      />
      <output htmlFor={id} className="min-w-[9.5rem] text-right font-mono text-xs tabular-nums text-zinc-300">
        {isLive ? "Canlı" : fmt.format(current)}
      </output>
      {!isLive && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex h-8 items-center rounded-md border border-zinc-700 px-2.5 text-xs text-zinc-200 hover:bg-zinc-800"
        >
          Canlıya dön
        </button>
      )}
    </div>
  );
}
