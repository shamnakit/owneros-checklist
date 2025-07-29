import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import Image from 'next/image';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('company_name, company_logo_url, avatar_url')
          .eq('id', user.id)
          .single();

        if (data) {
          setCompanyName(data.company_name || '');
          setCompanyLogoUrl(data.company_logo_url || '');
          setAvatarUrl(data.avatar_url || '');
        }
      }
    };
    getProfile();
  }, []);

  const updateProfile = async () => {
    if (!user) return;
    await supabase.from('profiles').upsert({
      id: user.id,
      company_name: companyName,
      company_logo_url: companyLogoUrl,
      avatar_url: avatarUrl
    });
    alert('อัปเดตสำเร็จ');
  };

  const uploadImage = async (e, type) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file || !user) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${type}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('company-logos').getPublicUrl(filePath);

      if (type === 'logo') setCompanyLogoUrl(data.publicUrl);
      if (type === 'avatar') setAvatarUrl(data.publicUrl);
    } catch (error) {
      alert('อัปโหลดไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
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
        disabled={uploading}
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
        disabled={uploading}
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
