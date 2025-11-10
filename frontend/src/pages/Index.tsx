import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { healthcheck } from "@/lib/api";
import { AuthForm } from "@/components/AuthForm";
import { Dashboard } from "@/components/Dashboard";

const Index = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Non-blocking health check to verify backend is reachable in dev
    healthcheck().then((ok) => {
      if (!ok) {
        console.warn("Backend not reachable at /api. Run backend or ignore in demo.");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return session ? <Dashboard /> : <AuthForm />;
};

export default Index;
