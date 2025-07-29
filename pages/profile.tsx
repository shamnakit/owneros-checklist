import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userName, setUserName] = useState('');
  const [userPosition, setUserPosition] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('company_name, company_logo_url, avatar_url, name, position')
          .eq('id', user.id)
          .single();

        if (data) {
          setCompanyName(data.company_name || '');
          setCompanyLogoUrl(data.company_logo_url || '');
          setAvatarUrl(data.avatar_url || '');
          setUserName(data.name || '');
          setUserPosition(data.position || '');
        }
      }
    };
    getProfile();
  }, []);

  const updateProfile = async () => {
    await supabase.from('profiles').upsert({
      id: user.id,
      company_name: companyName,
      company_logo_url: companyLogoUrl,
      avatar_url: avatarUrl,
      name: userName,
      position: userPosition
    });
    alert('อัปเดตสำเร็จ');
  };

  const uploadImage = async (e, type) => {
    try {
      const file = e.target.files[0];
      if (!file || !user) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${type}.${fileExt}`;
      if (type === 'logo') setUploadingLogo(true);
      else setUploadingAvatar(true);

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('company-logos').getPublicUrl(filePath);
      if (type === 'logo') setCompanyLogoUrl(data.publicUrl);
      else setAvatarUrl(data.publicUrl);
    } catch (error) {
      alert('อัปโหลดไม่สำเร็จ');
    } finally {
      setUploadingLogo(false);
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <button onClick={() => router.back()} className="mb-6 text-blue-600 underline">← ย้อนกลับ</button>

      <h1 className="text-2xl font-bold mb-6">โปรไฟล์บริษัท</h1>

      <label className="block text-sm font-medium text-gray-700">ชื่อบริษัท</label>
      <input
        type="text"
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
      />

      <label className="block mt-6 text-sm font-medium text-gray-700">โลโก้บริษัท</label>
      {companyLogoUrl && (
        <div className="mt-2">
          <Image src={companyLogoUrl} alt="Company Logo" width={150} height={150} />
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        className="mt-2"
        onChange={(e) => uploadImage(e, 'logo')}
        disabled={uploadingLogo}
      />

      <label className="block mt-6 text-sm font-medium text-gray-700">ชื่อผู้ใช้</label>
      <input
        type="text"
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />

      <label className="block mt-6 text-sm font-medium text-gray-700">ตำแหน่งผู้ใช้</label>
      <input
        type="text"
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        value={userPosition}
        onChange={(e) => setUserPosition(e.target.value)}
      />

      <label className="block mt-6 text-sm font-medium text-gray-700">Avatar ผู้ใช้</label>
      {avatarUrl && (
        <div className="mt-2">
          <Image src={avatarUrl} alt="User Avatar" width={100} height={100} className="rounded-full" />
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        className="mt-2"
        onChange={(e) => uploadImage(e, 'avatar')}
        disabled={uploadingAvatar}
      />

      <button
        onClick={updateProfile}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        บันทึกโปรไฟล์
      </button>
    </div>
  );
}
