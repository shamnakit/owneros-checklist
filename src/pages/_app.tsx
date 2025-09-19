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

  useEffect(() => { initPostHog(); }, []);
  useEffect(() => {
    const cb = () => track("$pageview", { path: router.asPath });
    router.events.on("routeChangeComplete", cb);
    return () => router.events.off("routeChangeComplete", cb);
  }, [router]);

  const isAdmin = pathname.startsWith("/admin");
  const isAdminLogin = pathname === "/admin/login";
  const NO_LAYOUT_PATHS = ["/", "/landing", "/login", "/admin/login"];
  const useMainLayout =
    !NO_LAYOUT_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) && !isAdmin;

  let Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
  if (isAdmin && !isAdminLogin)       Layout = ({ children }) => <AdminLayout>{children}</AdminLayout>;
  else if (useMainLayout)             Layout = ({ children }) => <MainLayout>{children}</MainLayout>;

  return (
    <UserProfileProvider>
      {/* ธีม: executive + green (เพิ่ม high-contrast ได้ถ้าพรีเซนต์) */}
      <div className="theme-exec theme-green min-h-screen">
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </div>
    </UserProfileProvider>
  );
}
