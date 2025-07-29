import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import Image from 'next/image';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('company_name, company_logo_url')
          .eq('id', user.id)
          .single();

        if (data) {
          setCompanyName(data.company_name || '');
          setCompanyLogoUrl(data.company_logo_url || '');
        }
      }
    };
    getProfile();
  }, []);

  const updateProfile = async () => {
    await supabase.from('profiles').upsert({
      id: user.id,
      company_name: companyName,
      company_logo_url: companyLogoUrl
    });
    alert('อัปเดตสำเร็จ');
  };

  const uploadLogo = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file || !user) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      setCompanyLogoUrl(data.publicUrl);
    } catch (error) {
      alert('อัปโหลดโลโก้ไม่สำเร็จ');
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
        onChange={uploadLogo}
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
