"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const queryClient = new QueryClient();

function useShutdownHook() {
    useEffect(() => {
        // Only in standalone mode: frontend served from the same origin as the API (port 8000)
        if (window.location.port !== "8000") return;

        const handleUnload = () => {
            navigator.sendBeacon("http://127.0.0.1:8000/api/v1/system/shutdown");
        };

        window.addEventListener("beforeunload", handleUnload);
        return () => window.removeEventListener("beforeunload", handleUnload);
    }, []);
}

export function Providers({ children }: { children: ReactNode }) {
    useShutdownHook();

    return (
        <QueryClientProvider client={queryClient}>
            <NextThemesProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
            </NextThemesProvider>
        </QueryClientProvider>
    );
}
