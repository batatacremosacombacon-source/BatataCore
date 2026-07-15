(function () {
    "use strict";
    const $ = (s) => document.querySelector(s);
    const state = { auth: null, inscricoes: [] };

    function feedback(tipo, texto) {
        const box = $("#portalFeedback"); box.hidden = false; box.className = `bc-alert ${tipo}`; box.textContent = texto;
        clearTimeout(feedback.timer); feedback.timer = setTimeout(() => { box.hidden = true; }, 5000);
    }

    function configurarTabs() {
        document.querySelectorAll("[data-portal-tab]").forEach((botao) => botao.addEventListener("click", () => {
            const tab = botao.dataset.portalTab;
            document.querySelectorAll("[data-portal-tab]").forEach((b) => b.classList.toggle("ativo", b === botao));
            document.querySelectorAll("[data-portal-panel]").forEach((p) => { p.hidden = p.dataset.portalPanel !== tab; });
        }));
    }

    function imagemEvento(evento) {
        if (evento?.imagem_url) return evento.imagem_url;
        const cat = String(evento?.categoria || "").toLowerCase();
        if (cat.includes("palestra")) return "../img/palestra.png";
        if (cat.includes("hackathon")) return "../img/hackaton.png";
        return "../img/desenvolvimentoweb.png";
    }

    function criarBotao(texto, icone, classe, onClick) {
        const botao = document.createElement("button"); botao.type = "button"; botao.className = `bc-button small ${classe || ""}`; botao.innerHTML = `<i class="bi ${icone}"></i>`;
        botao.append(document.createTextNode(` ${texto}`)); botao.addEventListener("click", onClick); return botao;
    }

    function renderizar() {
        $("#portalLoading").hidden = true;
        const container = $("#portalInscricoes"); container.innerHTML = "";
        $("#portalEmpty").hidden = state.inscricoes.length > 0;
        state.inscricoes.forEach((item) => {
            const evento = item.evento_detalhes || {};
            const card = document.createElement("article"); card.className = "portal-event-card";
            const img = document.createElement("img"); img.src = imagemEvento(evento); img.alt = `Evento ${item.evento}`;
            const info = document.createElement("div");
            const h3 = document.createElement("h3"); h3.textContent = item.evento || evento.nome || "Evento";
            const data = document.createElement("p"); data.innerHTML = '<i class="bi bi-calendar-event"></i> '; data.append(document.createTextNode(window.BatataCore.formatarData(evento.data_evento)));
            const status = document.createElement("span"); status.className = `bc-badge ${item.status}`; status.textContent = String(item.status || "pendente").replaceAll("_", " ");
            info.append(h3, data, status);
            const acoes = document.createElement("div"); acoes.className = "portal-event-actions bc-button-row";
            acoes.append(criarBotao("Ingresso", "bi-qr-code", "", () => abrirTicket(item)));
            if (item.status !== "cancelado" && !item.checked_in_at) acoes.append(criarBotao("Cancelar", "bi-x-circle", "danger", () => cancelar(item)));
            if (item.checked_in_at && evento.certificado_disponivel) acoes.append(criarBotao("Certificado", "bi-patch-check", "secondary", () => gerarCertificado(item)));
            card.append(img, info, acoes); container.appendChild(card);
        });
    }

    async function carregarInscricoes() {
        const { data, error } = await supabaseClient.from("inscritos").select("*, evento_detalhes:eventos(id,nome,data_evento,categoria,imagem_url,certificado_disponivel,carga_horaria)").eq("user_id", state.auth.user.id).order("created_at", { ascending: false });
        if (error) { feedback("error", `Não foi possível carregar as inscrições: ${error.message}`); state.inscricoes = []; }
        else state.inscricoes = data || [];
        renderizar();
    }

    function abrirTicket(item) {
        $("#portalTicketEvent").textContent = item.evento;
        $("#portalTicketHolder").textContent = item.nome;
        $("#portalTicketCode").textContent = item.ticket_code || "Código indisponível";
        const qr = $("#portalTicketQr"); qr.innerHTML = "";
        if (window.QRCode && item.ticket_code) new QRCode(qr, { text: item.ticket_code, width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M });
        const modal = $("#portalTicketModal"); modal.classList.add("ativo"); modal.setAttribute("aria-hidden", "false");
    }

    async function cancelar(item) {
        if (!confirm(`Cancelar sua inscrição em “${item.evento}”?`)) return;
        const { error } = await supabaseClient.rpc("cancelar_inscricao", { p_inscricao_id: item.id });
        if (error) return feedback("error", error.message);
        feedback("success", "Inscrição cancelada."); await carregarInscricoes();
    }

    async function gerarCertificado(item) {
        const { data, error } = await supabaseClient.rpc("gerar_certificado", { p_inscricao_id: item.id });
        if (error) return feedback("error", error.message);
        const codigo = Array.isArray(data) ? data[0] : data;
        location.href = `certificado.html?codigo=${encodeURIComponent(codigo)}`;
    }

    async function salvarPerfil(event) {
        event.preventDefault(); const form = event.currentTarget; const botao = form.querySelector("button[type='submit']"); const original = botao.innerHTML;
        botao.disabled = true; botao.textContent = "Salvando...";
        const payload = { full_name: form.full_name.value.trim(), phone: form.phone.value.trim() || null, city: form.city.value.trim() || null };
        const { error } = await supabaseClient.from("profiles").update(payload).eq("id", state.auth.user.id);
        botao.disabled = false; botao.innerHTML = original;
        if (error) return feedback("error", error.message);
        state.auth.perfil = { ...state.auth.perfil, ...payload }; preencherCabecalho(); feedback("success", "Perfil atualizado.");
    }

    function preencherCabecalho() {
        const perfil = state.auth.perfil || {}; const nome = perfil.full_name || state.auth.user.email.split("@")[0];
        $("#portalUserName").textContent = nome; $("#portalWelcomeName").textContent = nome.split(" ")[0]; $("#portalUserEmail").textContent = state.auth.user.email; $("#portalAvatar").textContent = nome.charAt(0).toUpperCase();
        $("#perfilNome").value = perfil.full_name || ""; $("#perfilTelefone").value = perfil.phone || ""; $("#perfilCidade").value = perfil.city || ""; $("#perfilEmail").value = state.auth.user.email || "";
        $("#adminPanelLink").hidden = !["admin", "organizador"].includes(perfil.role);
    }

    async function init() {
        configurarTabs();
        $("#portalLogout").addEventListener("click", () => sairDaConta("login.html"));
        $("#perfilForm").addEventListener("submit", salvarPerfil);
        $("#portalTicketClose").addEventListener("click", () => $("#portalTicketModal").classList.remove("ativo"));
        $("#portalTicketPrint").addEventListener("click", () => window.print());
        state.auth = await exigirAutenticacao({ redirect: "login.html" }); if (!state.auth) return;
        preencherCabecalho(); await carregarInscricoes();
    }
    init();
})();
