import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');

  const handleLogin = async () => {
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'https://owneros-checklist.vercel.app/dashboard'
      }
    });
    alert('Check your email for the magic link!');
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>
      <input value={email} onChange={e => setEmail(e.target.value)}
             placeholder="Enter your email" />
      <button onClick={handleLogin}>Send Magic Link</button>
    </div>
  );
}
