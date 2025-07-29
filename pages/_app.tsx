// pages/_app.tsx
import MainLayout from "@/components/MainLayout";
import "@/styles/globals.css";
import { useRouter } from "next/router";
import { UserProfileProvider } from "@/contexts/UserProfileContext";

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const useLayout = router.pathname.startsWith("/checklist");

  const Layout = useLayout ? MainLayout : ({ children }) => <>{children}</>;

  return (
    <UserProfileProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </UserProfileProvider>
  );
}
