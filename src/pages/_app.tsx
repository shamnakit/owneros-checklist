// src/pages/_app.tsx
import "@/styles/globals.css";
import { useRouter } from "next/router";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import dynamic from "next/dynamic";

// ปิด SSR ของ MainLayout เพื่อหลีกเลี่ยงปัญหาโหลด profile ไม่ทัน
const MainLayout = dynamic(() => import("@/layouts/MainLayout"), { ssr: false });

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // ✅ หน้าที่ไม่ต้องมี Sidebar
  const NO_SIDEBAR_PATHS = ["/login"];

  // ✅ หน้าที่ควรมี Sidebar (ครอบ layout)
  const LAYOUT_PATHS = ["/dashboard", "/checklist", "/summary", "/settings"];

  const hideSidebar = NO_SIDEBAR_PATHS.includes(router.pathname);
  const useLayout =
    LAYOUT_PATHS.some((path) => router.pathname.startsWith(path)) && !hideSidebar;

  const Layout = useLayout
    ? ({ children }) => <MainLayout>{children}</MainLayout>
    : ({ children }) => <>{children}</>;

  return (
    <UserProfileProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </UserProfileProvider>
  );
}

export default MyApp;
