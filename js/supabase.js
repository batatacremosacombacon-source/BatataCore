// BatataCore 2.0 - cliente Supabase compartilhado.
// A chave publishable/anon pode ficar no navegador. A segurança depende das políticas RLS.
const SUPABASE_URL = "https://csdscqlidxcxyjelnmet.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzZHNjcWxpZHhjeHlqZWxubWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NTc3MjMsImV4cCI6MjA5OTAzMzcyM30.PEknu-YpL1zcUCwvCENDh7ZtAEszZqMlZ727HkPL0Gg";

var supabaseClient = null;

const supabaseConfigurado = Boolean(
    typeof supabase !== "undefined" &&
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("COLE_AQUI") &&
    !SUPABASE_ANON_KEY.includes("COLE_AQUI")
);

if (supabaseConfigurado) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });
} else {
    console.warn("Supabase não configurado. Algumas funções funcionarão apenas em modo demonstração.");
}

async function obterUsuarioAtual() {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) return null;
    return data.user || null;
}

async function obterPerfilAtual(userId) {
    if (!supabaseClient) return null;
    const id = userId || (await obterUsuarioAtual())?.id;
    if (!id) return null;

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, full_name, email, phone, city, role, avatar_url")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        console.warn("Não foi possível carregar o perfil:", error.message);
        return null;
    }
    return data;
}

async function exigirAutenticacao(opcoes = {}) {
    const { role, redirect = "login.html" } = opcoes;
    if (!supabaseClient) {
        window.location.replace(redirect + "?erro=supabase");
        return null;
    }

    const user = await obterUsuarioAtual();
    if (!user) {
        const next = encodeURIComponent(location.pathname + location.search);
        window.location.replace(`${redirect}?next=${next}`);
        return null;
    }

    const perfil = await obterPerfilAtual(user.id);
    if (role) {
        const permitidos = Array.isArray(role) ? role : [role];
        if (!perfil || !permitidos.includes(perfil.role)) {
            window.location.replace("minha-conta.html?erro=permissao");
            return null;
        }
    }

    return { user, perfil };
}

async function sairDaConta(destino = "login.html") {
    if (supabaseClient) await supabaseClient.auth.signOut();
    localStorage.removeItem("batata_admin_logado");
    localStorage.removeItem("batata_admin_nivel");
    window.location.replace(destino);
}

window.BatataAuth = {
    obterUsuarioAtual,
    obterPerfilAtual,
    exigirAutenticacao,
    sairDaConta
};
