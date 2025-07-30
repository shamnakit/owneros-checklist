// src/pages/_app.tsx
import "@/styles/globals.css";
import { useRouter } from "next/router";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import dynamic from "next/dynamic";

// ปิด SSR ของ Layout เพื่อหลีกเลี่ยง error ตอน prerender
const MainLayout = dynamic(() => import("@/layouts/MainLayout"), { ssr: false });

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const hideSidebar = router.pathname === "/login";
  const useLayout = router.pathname.startsWith("/checklist") && !hideSidebar;

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
