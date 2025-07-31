// src/pages/_app.tsx
import "@/styles/globals.css";
import { useRouter } from "next/router";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import dynamic from "next/dynamic";

// ✅ ปิด SSR ของ MainLayout เพื่อหลีกเลี่ยงปัญหา profile ยังโหลดไม่ทันตอน prerender
const MainLayout = dynamic(() => import("@/layouts/MainLayout"), { ssr: false });

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // ✅ หน้าที่ไม่ต้องการแสดง Sidebar
  const hideSidebar = router.pathname === "/login";

  // ✅ หน้าที่ต้องการแสดง Layout พร้อม Sidebar
  const showSidebarPaths = ["/dashboard", "/checklist"];
  const useLayout =
    showSidebarPaths.some((path) => router.pathname.startsWith(path)) && !hideSidebar;

  // ✅ เลือก Layout ตามเงื่อนไข
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
