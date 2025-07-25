import { supabase } from '../lib/supabase';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert('Check your email for the login link!');
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" />
      <button onClick={handleLogin}>Send Magic Link</button>
    </div>
  );
}
