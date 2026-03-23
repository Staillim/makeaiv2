"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const supabase = createClient();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Handle case where supabase might be a mock during build
    if (!supabase.auth || !supabase.auth.getUser) {
      setChecking(false);
      return;
    }

    supabase.auth.getUser().then(({ data }: { data: { user: any } }) => {
      if (!data.user) router.replace("/login");
      else setChecking(false);
    }).catch(() => {
      // Handle auth errors gracefully
      setChecking(false);
    });

    if (supabase.auth.onAuthStateChange) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
        if (event === "SIGNED_OUT") router.replace("/login");
      });

      return () => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      };
    }
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050508" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7c5cfc,#f43f8e)" }}>
            <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          </div>
          <div className="text-sm" style={{ color: "#8884aa" }}>Verificando sesión...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
