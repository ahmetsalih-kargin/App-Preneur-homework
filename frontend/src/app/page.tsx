"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, FileText, LoaderCircle, Menu, X } from "lucide-react";
import { ScanLauncher } from "@/components/scan-launcher";
import { NodeContextPanel } from "@/components/node-context-panel";
import { ChatCopilot } from "@/components/chat-copilot";
import { Timeline } from "@/components/timeline";
import type { ViewMode } from "@/components/investigation-graph";
import { api, toGraphPayload, type ApiGraphPayload, type TargetResponse } from "@/lib/api";
import { WS_ORIGIN } from "@/lib/config";
import { GROUP_PARENT, SEVERITY_META, getSeverity, isFindingGroup, type Severity } from "@/lib/entity-meta";

const InvestigationGraph = dynamic(
  () => import("@/components/investigation-graph").then((m) => m.InvestigationGraph),
  { ssr: false, loading: () => <CenteredNote>Grafik yükleniyor…</CenteredNote> },
);

type ScanState = "running" | "done" | "failed";

const EMPTY_GRAPH: ApiGraphPayload = { nodes: [], links: [] };
const SUMMARY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info", "unrated"];

function CenteredNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-zinc-400">
      {children}
    </div>
  );
}

export default function WorkspacePage() {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<TargetResponse | null>(null);
  const [scanState, setScanState] = useState<ScanState>("done");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [blastRadiusNode, setBlastRadiusNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [timelineDate, setTimelineDate] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const targetId = target?.id ?? null;

  const graphQuery = useQuery({
    queryKey: ["graph", targetId],
    queryFn: () => api.fetchTargetGraph(targetId!),
    enabled: !!targetId,
  });
  const graph = graphQuery.data ?? null;

  // ── Gerçek zamanlı güncellemeler (WebSocket) ────────────────────────────
  useEffect(() => {
    if (!targetId) return;
    const ws = new WebSocket(`${WS_ORIGIN}/api/targets/ws/${encodeURIComponent(targetId)}`);
    ws.onmessage = (event) => {
      let data: unknown;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data && typeof data === "object" && "is_scan_completed" in data) {
        const failed = (data as { has_error?: boolean }).has_error === true;
        // Geç gelen "başarılı" sinyali önceki hatayı ezmesin
        setScanState((prev) => (prev === "failed" || failed ? "failed" : "done"));
        return;
      }
      const payload = toGraphPayload(data);
      if (payload) queryClient.setQueryData(["graph", targetId], payload);
    };
    return () => {
      ws.onmessage = null;
      ws.close();
    };
  }, [targetId, queryClient]);

  // ── Yedek: WebSocket sinyali kaçarsa durum uç noktasını yokla ─────────
  useEffect(() => {
    if (!targetId || scanState !== "running") return;
    let cancelled = false;
    const tick = async () => {
      try {
        const { status } = await api.fetchTargetStatus(targetId);
        if (!cancelled && status === "COMPLETED") {
          setScanState((prev) => (prev === "running" ? "done" : prev));
          queryClient.invalidateQueries({ queryKey: ["graph", targetId] });
        }
      } catch {
        /* geçici ağ hatası: bir sonraki turda tekrar dene */
      }
    };
    const timer = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [targetId, scanState, queryClient]);

  // DNS hatası WS bağlanmadan önce yayınlanırsa sinyal kaçar; grafikteki hata düğümünden yakala
  useEffect(() => {
    if (graph?.nodes.some((n) => n.label.includes("Target Resolution Failed"))) setScanState("failed");
  }, [graph]);

  const timelineBounds = useMemo(() => {
    if (!graph) return null;
    let min = Infinity;
    let max = -Infinity;
    for (const n of graph.nodes) {
      const t = n.discovery_date ? Date.parse(n.discovery_date) : NaN;
      if (Number.isNaN(t)) continue;
      if (t < min) min = t;
      if (t > max) max = t;
    }
    return Number.isFinite(min) && max > min ? { min, max } : null;
  }, [graph]);

  const summary = useMemo(() => {
    const counts = new Map<Severity, number>();
    let entities = 0;
    if (graph) {
      for (const n of graph.nodes) {
        if (n.group === GROUP_PARENT) continue;
        entities += 1;
        if (!isFindingGroup(n.group)) continue;
        const s = getSeverity(n.label);
        if (s !== "error") counts.set(s, (counts.get(s) ?? 0) + 1);
      }
    }
    return { entities, counts };
  }, [graph]);

  const selectedNode = useMemo(
    () => graph?.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [graph, selectedNodeId],
  );

  const handleScanStarted = useCallback((created: TargetResponse) => {
    setTarget(created);
    setScanState("running");
    setTimelineDate(null);
    setBlastRadiusNode(null);
    setSelectedNodeId(null);
    setViewMode("all");
    setIsMenuOpen(false);
  }, []);

  const handleSelectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
    if (id === null) setBlastRadiusNode(null);
  }, []);

  const closePanel = useCallback(() => handleSelectNode(null), [handleSelectNode]);

  // Mobil menü: Escape ile kapanır, odak menü düğmesine döner
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

  const statusText =
    scanState === "running"
      ? "Tarama sürüyor. Bulgular geldikçe grafiğe eklenecek."
      : scanState === "failed"
        ? "Tarama tamamlanamadı. Hedefin çözümlenebildiğini kontrol edin."
        : "Tarama tamamlandı.";

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100 md:flex-row">
      <a
        href="#workspace"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-zinc-800 focus:px-3 focus:py-2 focus:text-sm"
      >
        Grafiğe atla
      </a>

      {/* Mobil üst çubuk */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 px-4 md:hidden">
        <span className="text-[15px] font-semibold tracking-tight">NexusOSINT</span>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-expanded={isMenuOpen}
          aria-controls="sidebar"
          aria-label={isMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
          className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-zinc-300 hover:bg-zinc-800"
        >
          {isMenuOpen ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
        </button>
      </header>

      {isMenuOpen && (
        <div aria-hidden className="fixed inset-0 z-[45] bg-black/60 md:hidden" onClick={() => setIsMenuOpen(false)} />
      )}

      <aside
        id="sidebar"
        aria-label="Tarama"
        className={`fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col border-r border-zinc-800 bg-zinc-900 transition-transform duration-200 md:static md:z-auto md:max-w-none md:translate-x-0 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full max-md:invisible"
        }`}
      >
        <div className="hidden h-14 shrink-0 items-center border-b border-zinc-800 px-5 md:flex">
          <span className="text-[15px] font-semibold tracking-tight">NexusOSINT</span>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6">
          <section aria-labelledby="new-scan">
            <h1 id="new-scan" className="mb-4 text-base font-semibold text-zinc-50">
              Yeni tarama
            </h1>
            <ScanLauncher onScanStarted={handleScanStarted} />
          </section>

          {target && (
            <section aria-labelledby="current-scan" className="space-y-4">
              <div>
                <h2 id="current-scan" className="text-sm font-medium text-zinc-400">
                  Etkin hedef
                </h2>
                <p className="mt-1 break-all font-mono text-sm text-zinc-100">{target.target_value}</p>
              </div>

              <div role="status" className="flex items-start gap-2.5 text-sm leading-relaxed">
                {scanState === "running" ? (
                  <LoaderCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-blue-400" />
                ) : (
                  <span
                    aria-hidden
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${scanState === "failed" ? "bg-red-400" : "bg-emerald-400"}`}
                  />
                )}
                <span className="text-zinc-300">{statusText}</span>
              </div>

              {graphQuery.isError && (
                <p role="alert" className="text-sm text-red-300">
                  Graf verisi alınamadı. API&apos;nin çalıştığını kontrol edin.
                </p>
              )}

              {graph && (
                <dl className="divide-y divide-zinc-800 rounded-md border border-zinc-800 text-sm">
                  <div className="flex justify-between px-3 py-2">
                    <dt className="text-zinc-400">Kayıt</dt>
                    <dd className="tabular-nums text-zinc-100">{summary.entities}</dd>
                  </div>
                  {SUMMARY_ORDER.filter((s) => summary.counts.get(s)).map((s) => (
                    <div key={s} className="flex items-center justify-between px-3 py-2">
                      <dt className="flex items-center gap-2 text-zinc-400">
                        <span aria-hidden className={`h-2 w-2 rounded-full ${SEVERITY_META[s].bar}`} />
                        {SEVERITY_META[s].label}
                      </dt>
                      <dd className="tabular-nums text-zinc-100">{summary.counts.get(s)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          )}

          {graph && (
            <section aria-labelledby="view-options">
              <h2 id="view-options" className="mb-2 text-sm font-medium text-zinc-400">
                Görünüm
              </h2>
              <div role="group" aria-labelledby="view-options" className="grid grid-cols-3 gap-1 rounded-md bg-zinc-950 p-1">
                {(
                  [
                    ["all", "Tümü"],
                    ["focus", "Odak"],
                    ["attack", "Saldırı yolu"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={viewMode === mode}
                    onClick={() => {
                      setViewMode(mode);
                      setBlastRadiusNode(null);
                    }}
                    className={`h-9 rounded px-2 text-[13px] transition-colors ${
                      viewMode === mode ? "bg-zinc-800 font-medium text-zinc-50" : "text-zinc-400 hover:text-zinc-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                {viewMode === "focus"
                  ? "Kök alan adı ve bulgular öne çıkarılır."
                  : viewMode === "attack"
                    ? "Bulgu, sızan anahtar ve parola özetlerinden köke giden yollar."
                    : "Tüm kayıtlar."}
              </p>
            </section>
          )}

          {target && graph && (
            <section aria-labelledby="export">
              <h2 id="export" className="mb-2 text-sm font-medium text-zinc-400">
                Dışa aktar
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={api.exportUrl(target.id, "pdf")}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-700 text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  <FileText aria-hidden className="h-4 w-4 text-zinc-400" />
                  PDF raporu
                </a>
                <a
                  href={api.exportUrl(target.id, "csv")}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-700 text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  <FileSpreadsheet aria-hidden className="h-4 w-4 text-zinc-400" />
                  CSV
                </a>
              </div>
            </section>
          )}
        </div>

        <p className="border-t border-zinc-800 px-5 py-3 text-xs text-zinc-400">v0.1.0</p>
      </aside>

      <main id="workspace" tabIndex={-1} className="relative min-h-0 flex-1 overflow-hidden focus:outline-none">
        {!target && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="max-w-sm text-center">
              <h2 className="text-base font-medium text-zinc-100">Henüz tarama yok</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Bir alan adı girin. DNS, alt alan adları, açık servisler ve zafiyet bulguları burada ilişkileriyle
                birlikte görünür.
              </p>
            </div>
          </div>
        )}

        {target && graphQuery.isPending && <CenteredNote>Grafik hazırlanıyor…</CenteredNote>}

        {target && graph && (
          <InvestigationGraph
            key={target.id}
            payload={graph ?? EMPTY_GRAPH}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
            viewMode={viewMode}
            blastRadiusNode={blastRadiusNode}
            timelineDate={timelineDate}
          />
        )}

        {target && timelineBounds && (
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-4 sm:bottom-6 ${
              selectedNode ? "sm:pr-[384px]" : "sm:pr-40"
            }`}
          >
            <div className="pointer-events-auto w-full max-w-xl">
              <Timeline
                min={timelineBounds.min}
                max={timelineBounds.max}
                value={timelineDate}
                onChange={setTimelineDate}
              />
            </div>
          </div>
        )}

        {selectedNode && (
          <aside aria-label="Kayıt ayrıntıları" className="absolute inset-y-0 right-0 z-30 w-full sm:w-[360px]">
            <NodeContextPanel
              node={selectedNode}
              isBlastRadiusActive={blastRadiusNode === selectedNode.id}
              onToggleBlastRadius={(id) => {
                setBlastRadiusNode((prev) => (prev === id ? null : id));
                setViewMode("all");
              }}
              onClose={closePanel}
            />
          </aside>
        )}
      </main>

      <ChatCopilot activeScanId={targetId} isPanelOpen={!!selectedNode} />
    </div>
  );
}
