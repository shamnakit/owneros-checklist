// src/components/checklist/LoginForm.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push("/dashboard");
      }
    };

    getSession();
  }, [router]);

  const handleMagicLink = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://owneros-checklist.vercel.app/dashboard",
      },
    });

    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } else {
      alert("เช็คอีเมลเพื่อเข้าสู่ระบบ");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://owneros-checklist.vercel.app/dashboard",
      },
    });

    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-10 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">🔐 OwnerOS Login</h1>
        <input
          type="email"
          placeholder="อีเมลของคุณ"
          className="border border-gray-300 px-4 py-2 w-full mb-4 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleMagicLink}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded w-full mb-4"
        >
          ส่งลิงก์เข้าใช้งานทางอีเมล
        </button>
        <div className="text-center text-gray-400 mb-4">หรือ</div>
        <button
          onClick={handleGoogleLogin}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded w-full"
        >
          เข้าสู่ระบบด้วย Google
        </button>
      </div>
    </div>
  );
}
