// 📁 /src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import Dashboard from "./pages/Dashboard";
import GroupChecklist from "./pages/GroupChecklist";
import Summary from "./pages/Summary";
import Login from "./pages/Login";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://YOUR_PROJECT.supabase.co", "YOUR_PUBLIC_ANON_KEY");

export const SupabaseContext = React.createContext();

function App() {
  return (
    <SupabaseContext.Provider value={supabase}>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/group/:id" element={<GroupChecklist />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SupabaseContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
