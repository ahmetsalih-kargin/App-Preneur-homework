"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, X } from "lucide-react";
import { api, type ApiGraphNode } from "@/lib/api";
import { SEVERITY_META, getSeverity, getTypeMeta, isFindingGroup } from "@/lib/entity-meta";

interface NodeContextPanelProps {
  node: ApiGraphNode;
  isBlastRadiusActive: boolean;
  onToggleBlastRadius: (nodeId: string) => void;
  onClose: () => void;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function describe(node: ApiGraphNode): string {
  if (isFindingGroup(node.group)) {
    const severity = getSeverity(node.label);
    if (severity === "error") return "Tarama motoru bu hedefte çalışamadı; bu bir zafiyet kaydı değildir.";
    if (severity === "info") return "Bilgi amaçlı kayıt; tek başına bir zafiyet değildir.";
    return "Otomatik tarama araçlarının ürettiği bir bulgu. Doğrulanmadan raporlanmamalıdır.";
  }
  switch (node.group) {
    case "port":
      return "Hedefte açık olduğu bildirilen bir port/servis (Shodan InternetDB).";
    case "location":
      return "IP adresinin coğrafi konum tahmini (ip-api.com).";
    case "subdomain":
      return "Sertifika şeffaflık kayıtları veya pasif keşif ile bulunan alt alan adı.";
    case "ip":
      return "Alan adının DNS A kaydından çözümlenen adres.";
    default:
      return "OSINT kaynaklarından toplanan kayıt.";
  }
}

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });

export function NodeContextPanel({ node, isBlastRadiusActive, onToggleBlastRadius, onClose }: NodeContextPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);
  const meta = getTypeMeta(node.group);
  const Icon = meta.icon;
  const severity = isFindingGroup(node.group) ? SEVERITY_META[getSeverity(node.label)] : null;

  // Seçim değişince odağı panel başlığına taşı (ekran okuyucu bağlamı kaybetmesin)
  useEffect(() => {
    headingRef.current?.focus();
    setCopied(false);
  }, [node.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Önbellekli: aynı düğüme tekrar tıklamak yeni (ücretli) LLM çağrısı yapmaz,
  // panel kapanınca istek AbortSignal ile iptal edilir.
  const canAskAi = UUID_RE.test(node.id) && node.group !== "domain";
  const rationale = useQuery({
    queryKey: ["ai-rationale", node.id],
    queryFn: ({ signal }) => api.fetchAiRationale(node.id, signal),
    enabled: canAskAi,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });

  let portNumber: string | null = null;
  let portService: string | null = null;
  if (node.group === "port" && node.label.includes("/")) {
    const [num, ...rest] = node.label.split("/");
    portNumber = num;
    portService = rest.join("/");
  }

  const copyValue = async () => {
    try {
      await navigator.clipboard.writeText(node.label);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* pano izni yoksa sessizce geç */
    }
  };

  const discovered = node.discovery_date ? new Date(node.discovery_date) : null;

  return (
    <div className="flex h-full flex-col border-l border-zinc-800 bg-zinc-900">
      <div className="flex items-start gap-3 border-b border-zinc-800 px-5 py-4">
        <Icon aria-hidden className={`mt-0.5 h-5 w-5 shrink-0 ${meta.tone}`} strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-400">{meta.label}</p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mt-0.5 break-words font-mono text-sm leading-snug text-zinc-50 focus:outline-none"
          >
            {portNumber ? (
              <>
                {portNumber} <span className="font-sans text-zinc-300">{portService}</span>
              </>
            ) : (
              node.label
            )}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Detay panelini kapat"
          className="-mr-2 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2.5 text-sm">
          {severity && (
            <>
              <dt className="text-zinc-400">Önem</dt>
              <dd>
                <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${severity.badge}`}>
                  {severity.label}
                </span>
              </dd>
            </>
          )}
          <dt className="text-zinc-400">Keşif</dt>
          <dd className="text-zinc-200">
            {discovered && !Number.isNaN(discovered.getTime()) ? (
              <time dateTime={node.discovery_date!}>{dateFormatter.format(discovered)}</time>
            ) : (
              "—"
            )}
          </dd>
          <dt className="text-zinc-400">Kimlik</dt>
          <dd className="truncate font-mono text-xs leading-5 text-zinc-400" title={node.id}>
            {node.id}
          </dd>
        </dl>

        <section aria-labelledby="node-about">
          <h3 id="node-about" className="text-sm font-medium text-zinc-200">
            Açıklama
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{describe(node)}</p>
        </section>

        {canAskAi && (
          <section aria-labelledby="node-ai" aria-busy={rationale.isFetching}>
            <h3 id="node-ai" className="text-sm font-medium text-zinc-200">
              Yapay zekâ yorumu
            </h3>
            <div className="mt-1.5 text-sm leading-relaxed text-zinc-300" aria-live="polite">
              {rationale.isFetching ? (
                <p className="text-zinc-400">Yorum hazırlanıyor…</p>
              ) : rationale.isError ? (
                <p className="text-zinc-400">Yorum alınamadı.</p>
              ) : (
                <p className="whitespace-pre-line">{rationale.data?.rationale}</p>
              )}
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Model çıktısıdır; doğrulamadan karar vermeyin.
            </p>
          </section>
        )}

        <section aria-labelledby="node-raw">
          <div className="flex items-center justify-between">
            <h3 id="node-raw" className="text-sm font-medium text-zinc-200">
              Ham değer
            </h3>
            <button
              type="button"
              onClick={copyValue}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              {copied ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
              {copied ? "Kopyalandı" : "Kopyala"}
            </button>
          </div>
          <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-200">
            {node.label}
          </pre>
        </section>
      </div>

      {/* Mobilde Asistan düğmesi alt köşede durduğu için alt boşluk bırakılır */}
      <div className="border-t border-zinc-800 px-5 py-4 max-sm:pb-20">
        <button
          type="button"
          onClick={() => onToggleBlastRadius(node.id)}
          aria-pressed={isBlastRadiusActive}
          className={`inline-flex h-10 w-full items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors ${
            isBlastRadiusActive
              ? "border-red-400/60 bg-red-500/10 text-red-200 hover:bg-red-500/20"
              : "border-zinc-700 text-zinc-200 hover:bg-zinc-800"
          }`}
        >
          {isBlastRadiusActive ? "Etki alanını gizle" : "Etki alanını göster"}
        </button>
      </div>
    </div>
  );
}
