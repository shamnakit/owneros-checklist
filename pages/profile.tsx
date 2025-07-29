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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  const uploadFile = async (e, type: "logo" | "avatar") => {
    const file = e.target.files[0];
    if (!file || !user) return;

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${type}.${fileExt}`;
    const bucket = "company-logos"; // ใช้ bucket เดียวกัน

    type === "logo" ? setUploadingLogo(true) : setUploadingAvatar(true);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("อัปโหลดไฟล์ไม่สำเร็จ");
      type === "logo" ? setUploadingLogo(false) : setUploadingAvatar(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    type === "logo" ? setCompanyLogoUrl(data.publicUrl) : setAvatarUrl(data.publicUrl);

    type === "logo" ? setUploadingLogo(false) : setUploadingAvatar(false);
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">โปรไฟล์บริษัท</h1>

      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-blue-600 hover:underline"
      >
        ← ย้อนกลับ
      </button>

      {/* Full Name */}
      <label className="block text-sm font-medium text-gray-700">ชื่อผู้ใช้</label>
      <input
        type="text"
        className="mt-1 mb-4 block w-full border rounded-md p-2"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />

      {/* Role */}
      <label className="block text-sm font-medium text-gray-700">ตำแหน่ง</label>
      <input
        type="text"
        className="mt-1 mb-4 block w-full border rounded-md p-2"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />

      {/* Company Name */}
      <label className="block text-sm font-medium text-gray-700">ชื่อบริษัท</label>
      <input
        type="text"
        className="mt-1 mb-4 block w-full border rounded-md p-2"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
      />

      {/* Company Logo */}
      <label className="block text-sm font-medium text-gray-700">โลโก้บริษัท</label>
      {companyLogoUrl && (
        <Image src={companyLogoUrl} alt="Logo" width={120} height={120} className="mt-2" />
      )}
      <input
        type="file"
        accept="image/*"
        className="mt-2 mb-4"
        onChange={(e) => uploadFile(e, "logo")}
        disabled={uploadingLogo}
      />

      {/* Avatar */}
      <label className="block text-sm font-medium text-gray-700">รูปผู้ใช้ (Avatar)</label>
      {avatarUrl && (
        <Image src={avatarUrl} alt="Avatar" width={100} height={100} className="mt-2 rounded-full" />
      )}
      <input
        type="file"
        accept="image/*"
        className="mt-2 mb-6"
        onChange={(e) => uploadFile(e, "avatar")}
        disabled={uploadingAvatar}
      />

      <button
        onClick={updateProfile}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        บันทึกโปรไฟล์
      </button>
    </div>
  );
}
