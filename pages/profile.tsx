import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";
import { useRouter } from "next/router";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const getProfile = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setFullName(data.full_name || "");
          setRole(data.role || "");
          setCompanyName(data.company_name || "");
          setCompanyLogoUrl(data.company_logo_url || "");
          setAvatarUrl(data.avatar_url || "");
        }
      }

      setLoading(false);
    };

    getProfile();
  }, []);

  const updateProfile = async () => {
    if (!user) return;

    const updates = {
      id: user.id,
      full_name: fullName,
      role,
      company_name: companyName,
      company_logo_url: companyLogoUrl,
      avatar_url: avatarUrl,
    };

    const { error } = await supabase.from("profiles").upsert(updates);

    if (error) {
      alert("บันทึกไม่สำเร็จ");
    } else {
      alert("บันทึกสำเร็จ");
    }
  };

  const uploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 2MB");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/logo.${fileExt}`;
    const bucket = "company-logos";

    setUploadingLogo(true);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("อัปโหลดโลโก้ไม่สำเร็จ");
    } else {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      setCompanyLogoUrl(data.publicUrl);
    }

    setUploadingLogo(false);
  };

  if (loading) return <p className="text-center mt-10">กำลังโหลด...</p>;

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">โปรไฟล์บริษัท</h1>

      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-blue-600 hover:underline"
      >
        ← ย้อนกลับ
      </button>

      <label className="block text-sm font-medium text-gray-700">ชื่อผู้ใช้</label>
      <input
        type="text"
        className="mt-1 mb-4 block w-full border rounded-md p-2"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />

      <label className="block text-sm font-medium text-gray-700">ตำแหน่ง</label>
      <input
        type="text"
        className="mt-1 mb-4 block w-full border rounded-md p-2"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />

      <label className="block text-sm font-medium text-gray-700">ชื่อบริษัท</label>
      <input
        type="text"
        className="mt-1 mb-4 block w-full border rounded-md p-2"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
      />

      <label className="block text-sm font-medium text-gray-700">โลโก้บริษัท</label>
      {companyLogoUrl && (
        <Image src={companyLogoUrl} alt="Logo" width={120} height={120} className="mt-2" />
      )}
      <input
        type="file"
        accept="image/*"
        className="mt-2 mb-4"
        onChange={uploadLogo}
        disabled={uploadingLogo}
      />

      <label className="block text-sm font-medium text-gray-700 mb-2">รูปผู้ใช้ (Avatar)</label>
      <div className="flex gap-4 mb-6">
        <button
          type="button"
          className={`border rounded p-2 ${
            avatarUrl.includes("male.png") ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => setAvatarUrl("/avatars/male.png")}
        >
          <Image src="/avatars/male.png" alt="ชาย" width={60} height={60} />
        </button>
        <button
          type="button"
          className={`border rounded p-2 ${
            avatarUrl.includes("female.png") ? "ring-2 ring-pink-500" : ""
          }`}
          onClick={() => setAvatarUrl("/avatars/female.png")}
        >
          <Image src="/avatars/female.png" alt="หญิง" width={60} height={60} />
        </button>
      </div>

      <button
        onClick={updateProfile}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        บันทึกโปรไฟล์
      </button>
    </div>
  );
}
