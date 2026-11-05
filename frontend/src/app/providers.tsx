"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

// Uygulamada tek QueryClient var. Eskiden page.tsx kendi istemcisini (gcTime: 0)
// oluşturup bunu gölgeliyordu; iki önbellek birbirinden habersiz çalışıyordu.
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false, // canlı güncellemeler WebSocket'ten geliyor
          },
        },
      }),
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
