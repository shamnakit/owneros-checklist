// pages/_app.tsx
import MainLayout from "@/components/MainLayout";
import "@/styles/globals.css";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const useLayout = router.pathname.startsWith("/checklist");

  const Layout = useLayout ? MainLayout : ({ children }) => <>{children}</>;

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
