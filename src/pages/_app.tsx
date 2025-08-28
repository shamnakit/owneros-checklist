// src/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { UserProfileProvider } from "@/contexts/UserProfileContext";

// ปิด SSR ของ Layout + มี fallback ตอนโหลด
const MainLayout = dynamic(() => import("@/components/layouts/MainLayout"), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading layout…</div>,
});

export default function MyApp({ Component, pageProps }: AppProps) {
  const { pathname } = useRouter();

  // ⛑️ แพตช์ fetch: ใส่ Accept ให้ทุกคำขอไป /rest/v1/
  useEffect(() => {
    if (typeof window === "undefined") return;
    const orig = window.fetch;
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("/rest/v1/")) {
          const h = new Headers(init?.headers || {});
          if (!h.has("Accept")) h.set("Accept", "application/json");
          return orig(input, { ...init, headers: h });
        }
        return orig(input, init);
      } catch {
        return orig(input, init);
      }
    };
    return () => {
      window.fetch = orig;
    };
  }, []);

  // ✅ ใช้ MainLayout ทุกหน้ายกเว้น /login
  const isLogin = pathname === "/login";
  const Layout = isLogin
    ? ({ children }: { children: React.ReactNode }) => <>{children}</>
    : ({ children }: { children: React.ReactNode }) => <MainLayout>{children}</MainLayout>;

  return (
    <UserProfileProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </UserProfileProvider>
  );
}
