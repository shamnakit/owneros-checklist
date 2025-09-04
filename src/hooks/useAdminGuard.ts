// =========================
// src/hooks/useAdminGuard.ts
// =========================
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";


export function useAdminGuard(redirectTo: string = "/admin/login") {
const router = useRouter();
const [ready, setReady] = useState(false);
const [allowed, setAllowed] = useState(false);


useEffect(() => {
const run = async () => {
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
router.replace(redirectTo);
return;
}
const { data: profile } = await supabase
.from("profiles")
.select("role")
.eq("id", user.id)
.single();


if (profile?.role === "admin") {
setAllowed(true);
} else {
router.replace(redirectTo);
return;
}
setReady(true);
};
run();
}, [router, redirectTo]);


return { ready, allowed };
}

