import { createClient } from "jsr:@supabase/supabase-js@2.110.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function htmlTemplate(template: string, payload: Record<string, unknown>) {
  const nome = String(payload.nome ?? "Participante");
  const evento = String(payload.evento ?? "Evento BatataCore");
  const ticket = String(payload.ticket_code ?? "");
  const status = String(payload.status ?? "confirmado").replaceAll("_", " ");
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#fff9f1;padding:32px;color:#172033"><div style="max-width:620px;margin:auto;background:#fff;border-radius:18px;padding:30px;border:1px solid #eee"><h1 style="color:#12326b">BatataCore</h1><h2 style="color:#f58220">${template === "inscricao_confirmada" ? "Inscrição recebida" : "Atualização do evento"}</h2><p>Olá, <strong>${nome}</strong>.</p><p>Sua inscrição em <strong>${evento}</strong> está com status <strong>${status}</strong>.</p>${ticket ? `<p>Seu código de ingresso:</p><p style="font-family:monospace;background:#f1f3f7;padding:12px;border-radius:8px">${ticket}</p>` : ""}<p>Guarde esta mensagem e acompanhe os detalhes em sua conta BatataCore.</p></div></body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("EMAIL_FROM") || "BatataCore <noreply@example.com>";
    if (!resendKey) throw new Error("RESEND_API_KEY não configurada.");

    const authHeader = req.headers.get("Authorization") || "";
    const client = createClient(supabaseUrl, serviceKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await client.auth.getUser(token);
    if (!userData.user) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await adminClient.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
    if (!profile || !["admin", "organizador"].includes(profile.role)) return new Response(JSON.stringify({ error: "Permissão administrativa necessária" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: jobs, error: queueError } = await adminClient.from("email_queue").select("*").eq("status", "pendente").order("created_at").limit(20);
    if (queueError) throw queueError;

    const results = [];
    for (const job of jobs ?? []) {
      await adminClient.from("email_queue").update({ status: "processando", attempts: (job.attempts ?? 0) + 1 }).eq("id", job.id);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromEmail, to: [job.recipient], subject: "Atualização da sua inscrição no BatataCore", html: htmlTemplate(job.template, job.payload ?? {}) }),
      });
      if (response.ok) {
        await adminClient.from("email_queue").update({ status: "enviado", processed_at: new Date().toISOString(), last_error: null }).eq("id", job.id);
        results.push({ id: job.id, status: "enviado" });
      } else {
        const details = await response.text();
        await adminClient.from("email_queue").update({ status: "erro", last_error: details.slice(0, 1000) }).eq("id", job.id);
        results.push({ id: job.id, status: "erro" });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
