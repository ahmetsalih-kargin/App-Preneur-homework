"use client";

import { useId, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { api, type TargetResponse } from "@/lib/api";

interface ScanLauncherProps {
  onScanStarted: (target: TargetResponse) => void;
}

export function ScanLauncher({ onScanStarted }: ScanLauncherProps) {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const [target, setTarget] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = target.trim();
    if (!value || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const created = await api.createTarget({ target_value: value, is_monitored: false });
      onScanStarted(created);
      setTarget("");
    } catch (err) {
      // fetch ağ hatasında TypeError fırlatır; mesajı kullanıcıya anlamlı hale getir
      setError(
        err instanceof TypeError
          ? "Sunucuya bağlanılamadı. API'nin çalıştığından emin olun."
          : err instanceof Error
            ? err.message
            : "Hedef eklenemedi.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-zinc-200">
          Hedef
        </label>
        <input
          id={inputId}
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={253}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="example.com"
          disabled={isLoading}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          aria-invalid={error ? true : undefined}
          className="block h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-60 aria-[invalid]:border-red-400"
        />
        <p id={hintId} className="text-xs leading-relaxed text-zinc-400">
          Alan adı veya genel IPv4 adresi. Yalnızca test yetkiniz olan sistemleri tarayın.
        </p>
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!target.trim() || isLoading}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-400"
      >
        {isLoading && <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />}
        {isLoading ? "Başlatılıyor…" : "Taramayı başlat"}
      </button>
    </form>
  );
}
