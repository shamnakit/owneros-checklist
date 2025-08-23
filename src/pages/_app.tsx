// src/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import dynamic from "next/dynamic";

// ✅ ใส่ fallback เวลาโหลด Layout
const MainLayout = dynamic(() => import("@/layouts/MainLayout"), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading layout…</div>,
});

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // ⛑️ แพตช์ fetch ทั้งแอป: เติม Accept ให้ทุกคำขอที่ยิงไป /rest/v1/
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

  // ✅ หน้าที่ไม่ต้องมี Sidebar
  const NO_SIDEBAR_PATHS = ["/login"];

  // ✅ หน้าที่ควรมี Sidebar (ครอบ layout) — รวมหน้าแรก "/"
  const LAYOUT_PATHS = ["/", "/dashboard", "/checklist", "/summary", "/settings"];

  const hideSidebar = NO_SIDEBAR_PATHS.includes(router.pathname);
  const useLayout =
    LAYOUT_PATHS.some((path) => router.pathname === path || router.pathname.startsWith(path)) &&
    !hideSidebar;

  const Layout = useLayout
    ? ({ children }: { children: React.ReactNode }) => <MainLayout>{children}</MainLayout>
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <UserProfileProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </UserProfileProvider>
  );
}

export default MyApp;
