// src/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { initPostHog, track } from "@/lib/analytics/posthog.client";

// ── Layouts (ปิด SSR + มี fallback ตอนโหลด)
const MainLayout = dynamic(() => import("@/components/layouts/MainLayout"), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading layout…</div>,
});
const AdminLayout = dynamic(() => import("@/layouts/AdminLayout"), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading admin…</div>,
});

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { pathname } = router;

  /** ✅ Init PostHog ครั้งเดียวตอนโหลดแอป */
  useEffect(() => {
    initPostHog();
  }, []);

  /** ✅ Track pageview เมื่อเส้นทางเปลี่ยน */
  useEffect(() => {
    const cb = () => track("$pageview", { path: router.asPath });
    router.events.on("routeChangeComplete", cb);
    return () => router.events.off("routeChangeComplete", cb);
  }, [router]);

  // ── Routing rules for layouts
  const isAdmin = pathname.startsWith("/admin");
  const isAdminLogin = pathname === "/admin/login";

  /** ระบุเส้นทางที่ "ไม่" ใช้ MainLayout (ไม่มี Sidebar ผู้ใช้ทั่วไป) */
  const NO_LAYOUT_PATHS = ["/", "/landing", "/login", "/admin/login"];

  /** ใช้ MainLayout เมื่อไม่ใช่หน้า no-layout และไม่ใช่ฝั่ง admin */
  const useMainLayout =
    !NO_LAYOUT_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) &&
    !isAdmin; // ป้องกัน admin โดน MainLayout

  let Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

  if (isAdmin && !isAdminLogin) {
    // ✅ ทุกหน้า /admin/* (ยกเว้น /admin/login) ใช้ AdminLayout
    Layout = ({ children }) => <AdminLayout>{children}</AdminLayout>;
  } else if (useMainLayout) {
    // ✅ เพจผู้ใช้ทั่วไป ใช้ MainLayout
    Layout = ({ children }) => <MainLayout>{children}</MainLayout>;
  } else {
    // ✅ หน้า public หรือ /admin/login → ไม่มี layout
    Layout = ({ children }) => <>{children}</>;
  }

  return (
    <UserProfileProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </UserProfileProvider>
  );
}
