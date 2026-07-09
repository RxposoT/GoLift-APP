import { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../styles/theme";
import { supabase } from "../../lib/supabase";

export default function AdminLayout() {
  const { user, isLoading } = useAuth();
  const theme = useTheme();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;

    supabase
      .from("profiles")
      .select("tipo")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        const admin = data?.tipo === 1;
        setIsAdmin(admin);
        if (!admin) router.replace("/account");
      });
  }, [user, isLoading]);

  if (isLoading || !user || isAdmin === null) return null;
  if (!isAdmin) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  );
}
