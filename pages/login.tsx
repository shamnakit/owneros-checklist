import { supabase } from '../lib/supabase';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');

  const handleLogin = async () => {
    await supabase.auth.signInWithOtp({
      email,
      options: {
        // *** ใช้ redirectTo (v2) ***
        redirectTo: 'https://owneros-checklist.vercel.app/dashboard'
      }
    });
    alert('Check your email for the magic link!');
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <button onClick={handleLogin}>Send Magic Link</button>
    </div>
  );
}
