import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

serve(async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No auth" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { user_id, title, body, data } = (await req.json()) as PushPayload;

    // Buscar tokens do utilizador
    const { data: tokens, error } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", user_id);

    if (error || !tokens?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    }

    const expoTokens = tokens.map((t) => t.token).filter(Boolean);

    // Enviar via Expo Push API
    const results = await Promise.allSettled(
      expoTokens.map(async (token) => {
        const res = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: token,
            title,
            body,
            data: data || {},
            priority: "high",
          }),
        });
        return res.json();
      })
    );

    // Remover tokens expirados/inválidos
    const tokensToRemove: string[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value?.data?.status === "error") {
        tokensToRemove.push(expoTokens[i]);
      }
    });

    if (tokensToRemove.length > 0) {
      await supabase
        .from("push_tokens")
        .delete()
        .in("token", tokensToRemove);
    }

    return new Response(
      JSON.stringify({
        sent: expoTokens.length,
        failed: tokensToRemove.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
