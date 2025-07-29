import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/router";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChangePassword = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage("❌ เปลี่ยนรหัสผ่านไม่สำเร็จ: " + error.message);
    } else {
      setMessage("✅ เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white shadow-md rounded p-6">
      <h1 className="text-xl font-bold mb-4">🔐 เปลี่ยนรหัสผ่าน</h1>
      <input
        type="password"
        placeholder="รหัสผ่านใหม่"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-2 border rounded mb-4"
      />
      <button
        onClick={handleChangePassword}
        disabled={loading || password.length < 6}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
      >
        {loading ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
      </button>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
