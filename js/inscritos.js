(function () {
    "use strict";

    const state = { eventos: [], inscricoes: [], contatos: [], auth: null };
    const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
    const $$ = (seletor, raiz = document) => Array.from(raiz.querySelectorAll(seletor));
    const formatarData = window.BatataCore?.formatarData || ((valor) => valor || "—");

    function feedback(tipo, texto) {
        const box = $("#adminFeedback");
        if (!box) return;
        box.hidden = false;
        box.className = `bc-alert ${tipo}`;
        box.innerHTML = `<i class="bi ${tipo === "error" ? "bi-exclamation-triangle" : "bi-check-circle"}"></i><span></span>`;
        box.querySelector("span").textContent = texto;
        clearTimeout(feedback.timer);
        feedback.timer = setTimeout(() => { box.hidden = true; }, 5500);
    }

    function badge(status) {
        const span = document.createElement("span");
        const valor = String(status || "pendente");
        span.className = `bc-badge ${valor}`;
        span.textContent = valor.replaceAll("_", " ");
        return span;
    }

    function abrirModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.add("ativo");
        modal.setAttribute("aria-hidden", "false");
        modal.querySelector("input,button,select,textarea")?.focus();
    }

    function fecharModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.remove("ativo");
        modal.setAttribute("aria-hidden", "true");
    }

    function configurarNavegacao() {
        const titulos = {
            dashboard: "Visão geral",
            eventos: "Eventos",
            inscricoes: "Inscrições",
            checkin: "Check-in",
            contatos: "Contatos"
        };
        $$("[data-admin-tab]").forEach((botao) => {
            botao.addEventListener("click", () => {
                const tab = botao.dataset.adminTab;
                $$("[data-admin-tab]").forEach((item) => item.classList.toggle("ativo", item === botao));
                $$("[data-admin-panel]").forEach((painel) => { painel.hidden = painel.dataset.adminPanel !== tab; });
                $("#adminPageTitle").textContent = titulos[tab] || "Painel";
                $("#adminSidebar")?.classList.remove("aberta");
            });
        });

        $("#adminMobileToggle")?.addEventListener("click", () => $("#adminSidebar")?.classList.toggle("aberta"));
        $("#sairAdmin")?.addEventListener("click", () => sairDaConta("login.html"));
        $$('[data-close-modal]').forEach((botao) => botao.addEventListener("click", () => fecharModal(botao.dataset.closeModal)));
        $$(".bc-modal").forEach((modal) => modal.addEventListener("click", (event) => {
            if (event.target === modal) fecharModal(modal.id);
        }));
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") $$(".bc-modal.ativo").forEach((modal) => fecharModal(modal.id));
        });
    }

    async function carregarDados() {
        if (!supabaseClient) throw new Error("Supabase não configurado.");
        const [eventosResult, inscricoesResult, contatosResult] = await Promise.all([
            supabaseClient.from("eventos").select("*").order("data_evento", { ascending: false }),
            supabaseClient.from("inscritos").select("*").order("created_at", { ascending: false }),
            supabaseClient.from("contatos").select("*").order("created_at", { ascending: false })
        ]);

        const primeiroErro = eventosResult.error || inscricoesResult.error || contatosResult.error;
        if (primeiroErro) throw primeiroErro;
        state.eventos = eventosResult.data || [];
        state.inscricoes = inscricoesResult.data || [];
        state.contatos = contatosResult.data || [];
        renderizarTudo();
    }

    function renderizarTudo() {
        renderizarDashboard();
        renderizarEventos();
        renderizarInscricoes();
        renderizarContatos();
    }

    function renderizarDashboard() {
        const ativas = state.inscricoes.filter((i) => i.status !== "cancelado");
        const publicados = state.eventos.filter((e) => e.status === "publicado");
        const checkins = state.inscricoes.filter((i) => i.checked_in_at).length;
        const contatosAbertos = state.contatos.filter((c) => ["aberto", "em_atendimento"].includes(c.status)).length;
        $("#statInscricoes").textContent = ativas.length;
        $("#statEventos").textContent = publicados.length;
        $("#statCheckins").textContent = checkins;
        $("#statContatos").textContent = contatosAbertos;

        const chart = $("#eventosChart");
        chart.innerHTML = "";
        const porEvento = new Map();
        ativas.forEach((item) => porEvento.set(item.evento || "Sem evento", (porEvento.get(item.evento || "Sem evento") || 0) + 1));
        const itens = Array.from(porEvento.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
        const max = Math.max(1, ...itens.map(([, valor]) => valor));
        if (!itens.length) chart.appendChild(vazioCompacto("Sem inscrições para exibir."));
        itens.forEach(([nome, quantidade]) => {
            const linha = document.createElement("div");
            linha.className = "admin-bar-row";
            const label = document.createElement("span");
            label.textContent = nome;
            const track = document.createElement("div");
            track.className = "admin-bar-track";
            const barra = document.createElement("span");
            barra.style.width = `${Math.max(6, (quantidade / max) * 100)}%`;
            track.appendChild(barra);
            const total = document.createElement("strong");
            total.textContent = quantidade;
            linha.append(label, track, total);
            chart.appendChild(linha);
        });

        const atividade = $("#atividadeRecente");
        atividade.innerHTML = "";
        const recentes = [
            ...state.inscricoes.slice(0, 4).map((item) => ({ tipo: "inscricao", data: item.created_at, titulo: item.nome, texto: `Inscrição em ${item.evento}` })),
            ...state.contatos.slice(0, 3).map((item) => ({ tipo: "contato", data: item.created_at, titulo: item.nome, texto: item.assunto }))
        ].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 6);
        if (!recentes.length) atividade.appendChild(vazioCompacto("Nenhuma atividade recente."));
        recentes.forEach((item) => {
            const linha = document.createElement("div");
            linha.className = "admin-activity-item";
            const icone = document.createElement("i");
            icone.className = item.tipo === "inscricao" ? "bi bi-person-plus" : "bi bi-envelope";
            const corpo = document.createElement("div");
            const titulo = document.createElement("strong");
            titulo.textContent = item.titulo || "Atividade";
            const texto = document.createElement("p");
            texto.style.margin = "3px 0";
            texto.style.color = "#69758a";
            texto.textContent = item.texto || "";
            const data = document.createElement("small");
            data.textContent = item.data ? new Date(item.data).toLocaleString("pt-BR") : "";
            corpo.append(titulo, texto, data);
            linha.append(icone, corpo);
            atividade.appendChild(linha);
        });
    }

    function vazioCompacto(texto) {
        const p = document.createElement("p");
        p.style.color = "#69758a";
        p.textContent = texto;
        return p;
    }

    function filtrarEventos() {
        const termo = $("#pesquisaEventoAdmin")?.value.toLowerCase().trim() || "";
        const status = $("#filtroStatusEvento")?.value || "";
        return state.eventos.filter((evento) => {
            const conteudo = `${evento.nome} ${evento.categoria} ${evento.local}`.toLowerCase();
            return conteudo.includes(termo) && (!status || evento.status === status);
        });
    }

    function renderizarEventos() {
        const tbody = $("#eventosAdminBody");
        const dados = filtrarEventos();
        tbody.innerHTML = "";
        $("#eventosAdminEmpty").hidden = dados.length > 0;
        dados.forEach((evento) => {
            const tr = document.createElement("tr");
            const nome = document.createElement("td");
            const titulo = document.createElement("strong");
            titulo.textContent = evento.nome;
            const subtitulo = document.createElement("small");
            subtitulo.style.display = "block";
            subtitulo.textContent = `${evento.categoria || "Evento"} · ${evento.local || "Local a definir"}`;
            nome.append(titulo, subtitulo);

            const data = document.createElement("td");
            data.textContent = formatarData(evento.data_evento);
            const vagas = document.createElement("td");
            vagas.textContent = `${evento.vagas_ocupadas || 0}/${evento.vagas_total || 0}`;
            const status = document.createElement("td");
            status.appendChild(badge(evento.status));
            const acoes = document.createElement("td");
            const grupo = document.createElement("div");
            grupo.className = "admin-actions";
            grupo.append(
                botaoIcone("bi-pencil", "Editar", () => abrirEdicaoEvento(evento)),
                botaoIcone("bi-box-arrow-up-right", "Ver página", () => window.open(`evento.html?id=${evento.id}`, "_blank")),
                botaoIcone("bi-archive", "Arquivar", () => arquivarEvento(evento), true)
            );
            acoes.appendChild(grupo);
            tr.append(nome, data, vagas, status, acoes);
            tbody.appendChild(tr);
        });
    }

    function botaoIcone(icone, titulo, acao, danger = false) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = `admin-icon-btn${danger ? " danger" : ""}`;
        botao.title = titulo;
        botao.setAttribute("aria-label", titulo);
        botao.innerHTML = `<i class="bi ${icone}"></i>`;
        botao.addEventListener("click", acao);
        return botao;
    }

    function abrirNovoEvento() {
        const form = $("#eventoForm");
        form.reset();
        form.elements.id.value = "";
        form.status.value = "rascunho";
        $("#eventoModalTitle").textContent = "Novo evento";
        abrirModal("eventoModal");
    }

    function abrirEdicaoEvento(evento) {
        const form = $("#eventoForm");
        form.reset();
        ["id", "nome", "categoria", "data_evento", "hora_inicio", "hora_fim", "local", "formato", "endereco", "vagas_total", "status", "imagem_url", "descricao", "carga_horaria"].forEach((campo) => {
            if (form.elements[campo]) form.elements[campo].value = evento[campo] ?? "";
        });
        form.elements.certificado_disponivel.checked = Boolean(evento.certificado_disponivel);
        $("#eventoModalTitle").textContent = "Editar evento";
        abrirModal("eventoModal");
    }

    function slugify(texto) {
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    async function salvarEvento(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const botao = form.querySelector("button[type='submit']");
        const original = botao.innerHTML;
        botao.disabled = true;
        botao.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';

        const id = form.elements.id.value;
        const payload = {
            nome: form.nome.value.trim(),
            categoria: form.categoria.value,
            data_evento: form.data_evento.value,
            hora_inicio: form.hora_inicio.value || null,
            hora_fim: form.hora_fim.value || null,
            local: form.local.value.trim(),
            formato: form.formato.value,
            endereco: form.endereco.value.trim() || null,
            vagas_total: Number(form.vagas_total.value),
            status: form.status.value,
            imagem_url: form.imagem_url.value.trim() || null,
            descricao: form.descricao.value.trim(),
            carga_horaria: form.carga_horaria.value ? Number(form.carga_horaria.value) : null,
            certificado_disponivel: form.certificado_disponivel.checked,
            owner_id: state.auth.user.id
        };
        if (!id) payload.slug = `${slugify(payload.nome)}-${Date.now()}`;

        const query = id
            ? supabaseClient.from("eventos").update(payload).eq("id", id)
            : supabaseClient.from("eventos").insert(payload);
        const { error } = await query;
        botao.disabled = false;
        botao.innerHTML = original;
        if (error) return feedback("error", `Não foi possível salvar o evento: ${error.message}`);
        fecharModal("eventoModal");
        feedback("success", id ? "Evento atualizado." : "Evento criado.");
        await carregarDados();
    }

    async function arquivarEvento(evento) {
        if (!confirm(`Arquivar o evento “${evento.nome}”? Ele deixará de aparecer no site público.`)) return;
        const { error } = await supabaseClient.from("eventos").update({ status: "arquivado", deleted_at: new Date().toISOString() }).eq("id", evento.id);
        if (error) return feedback("error", error.message);
        feedback("success", "Evento arquivado.");
        await carregarDados();
    }

    function filtrarInscricoes() {
        const termo = $("#pesquisaInscrito")?.value.toLowerCase().trim() || "";
        const status = $("#filtroStatusInscricao")?.value || "";
        return state.inscricoes.filter((item) => {
            const conteudo = `${item.nome} ${item.email} ${item.cidade} ${item.evento} ${item.tipo}`.toLowerCase();
            return conteudo.includes(termo) && (!status || item.status === status);
        });
    }

    function renderizarInscricoes() {
        const tbody = $("#inscricoesAdminBody");
        const dados = filtrarInscricoes();
        tbody.innerHTML = "";
        $("#inscricoesAdminEmpty").hidden = dados.length > 0;
        dados.forEach((item) => {
            const tr = document.createElement("tr");
            const pessoa = document.createElement("td");
            const nome = document.createElement("strong");
            nome.textContent = item.nome;
            const email = document.createElement("small");
            email.style.display = "block";
            email.textContent = item.email;
            pessoa.append(nome, email);
            const evento = document.createElement("td"); evento.textContent = item.evento;
            const tipo = document.createElement("td"); tipo.textContent = item.tipo;
            const status = document.createElement("td"); status.appendChild(badge(item.status));
            const checkin = document.createElement("td"); checkin.textContent = item.checked_in_at ? new Date(item.checked_in_at).toLocaleString("pt-BR") : "Pendente";
            const acoes = document.createElement("td");
            const grupo = document.createElement("div"); grupo.className = "admin-actions";
            grupo.append(
                botaoIcone("bi-eye", "Ver detalhes", () => abrirDetalheInscricao(item)),
                botaoIcone("bi-qr-code-scan", "Realizar check-in", () => checkinComCodigo(item.ticket_code))
            );
            if (item.status !== "cancelado" && !item.checked_in_at) grupo.append(botaoIcone("bi-x-circle", "Cancelar", () => cancelarInscricao(item), true));
            acoes.appendChild(grupo);
            tr.append(pessoa, evento, tipo, status, checkin, acoes);
            tbody.appendChild(tr);
        });
    }

    function abrirDetalheInscricao(item) {
        $("#detalheModalTitle").textContent = "Detalhes da inscrição";
        const body = $("#detalheModalBody");
        body.innerHTML = "";
        const lista = document.createElement("dl");
        lista.style.display = "grid";
        lista.style.gridTemplateColumns = "140px 1fr";
        lista.style.gap = "10px 16px";
        const campos = [
            ["Participante", item.nome], ["E-mail", item.email], ["Telefone", item.telefone], ["Cidade", item.cidade],
            ["Evento", item.evento], ["Tipo", item.tipo], ["Status", item.status], ["Ingresso", item.ticket_code],
            ["Criada em", item.created_at ? new Date(item.created_at).toLocaleString("pt-BR") : "—"], ["Observação", item.observacao || "Sem observação"]
        ];
        campos.forEach(([rotulo, valor]) => {
            const dt = document.createElement("dt"); dt.style.fontWeight = "700"; dt.textContent = rotulo;
            const dd = document.createElement("dd"); dd.style.margin = "0"; dd.textContent = valor || "—";
            lista.append(dt, dd);
        });
        body.appendChild(lista);
        abrirModal("detalheModal");
    }

    async function cancelarInscricao(item) {
        if (!confirm(`Cancelar a inscrição de ${item.nome}?`)) return;
        const { error } = await supabaseClient.rpc("cancelar_inscricao", { p_inscricao_id: item.id });
        if (error) return feedback("error", error.message);
        feedback("success", "Inscrição cancelada e vaga atualizada.");
        await carregarDados();
    }

    async function checkinComCodigo(codigo) {
        if (!codigo) return feedback("error", "Esta inscrição ainda não possui código de ingresso.");
        const result = $("#checkinResult");
        result.innerHTML = '<div class="bc-alert"><i class="bi bi-hourglass-split"></i> Validando ingresso...</div>';
        const { data, error } = await supabaseClient.rpc("realizar_checkin", { p_ticket_code: codigo.trim() });
        if (error) {
            result.innerHTML = "";
            const box = document.createElement("div"); box.className = "bc-alert error"; box.textContent = error.message; result.appendChild(box);
            return;
        }
        const item = Array.isArray(data) ? data[0] : data;
        result.innerHTML = "";
        const box = document.createElement("div"); box.className = "bc-alert success";
        box.innerHTML = '<i class="bi bi-check-circle-fill"></i><div><strong>Check-in confirmado</strong><p style="margin:4px 0 0"></p></div>';
        box.querySelector("p").textContent = `${item?.nome || "Participante"} · ${item?.evento || "Evento"}`;
        result.appendChild(box);
        $("#checkinCode").value = "";
        await carregarDados();
    }

    function exportarCSV() {
        const dados = filtrarInscricoes();
        const colunas = ["Nome", "Email", "Telefone", "Cidade", "Evento", "Tipo", "Status", "Ingresso", "Check-in", "Criado em"];
        const linhas = dados.map((item) => [item.nome, item.email, item.telefone, item.cidade, item.evento, item.tipo, item.status, item.ticket_code, item.checked_in_at || "", item.created_at || ""]);
        const escapar = (valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`;
        const csv = "\ufeff" + [colunas, ...linhas].map((linha) => linha.map(escapar).join(";")).join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a"); link.href = url; link.download = `batatacore-inscricoes-${new Date().toISOString().slice(0,10)}.csv`; link.click();
        URL.revokeObjectURL(url);
    }

    function filtrarContatos() {
        const termo = $("#pesquisaContato")?.value.toLowerCase().trim() || "";
        const status = $("#filtroStatusContato")?.value || "";
        return state.contatos.filter((item) => `${item.nome} ${item.email} ${item.assunto} ${item.mensagem}`.toLowerCase().includes(termo) && (!status || item.status === status));
    }

    function renderizarContatos() {
        const tbody = $("#contatosAdminBody");
        const dados = filtrarContatos();
        tbody.innerHTML = "";
        $("#contatosAdminEmpty").hidden = dados.length > 0;
        dados.forEach((item) => {
            const tr = document.createElement("tr");
            const remetente = document.createElement("td");
            const nome = document.createElement("strong"); nome.textContent = item.nome;
            const email = document.createElement("small"); email.style.display = "block"; email.textContent = item.email;
            remetente.append(nome, email);
            const assunto = document.createElement("td"); assunto.textContent = item.assunto;
            const mensagem = document.createElement("td"); mensagem.className = "admin-contact-message"; mensagem.textContent = item.mensagem;
            const status = document.createElement("td"); status.appendChild(badge(item.status));
            const acoes = document.createElement("td");
            const grupo = document.createElement("div"); grupo.className = "admin-actions";
            grupo.append(botaoIcone("bi-eye", "Ler mensagem", () => abrirDetalheContato(item)));
            if (item.status !== "resolvido") grupo.append(botaoIcone("bi-check2", "Marcar como resolvido", () => atualizarContato(item.id, "resolvido")));
            acoes.appendChild(grupo);
            tr.append(remetente, assunto, mensagem, status, acoes);
            tbody.appendChild(tr);
        });
    }

    function abrirDetalheContato(item) {
        $("#detalheModalTitle").textContent = item.assunto || "Mensagem";
        const body = $("#detalheModalBody");
        body.innerHTML = "";
        const meta = document.createElement("p"); meta.textContent = `${item.nome} · ${item.email} · ${new Date(item.created_at).toLocaleString("pt-BR")}`;
        const mensagem = document.createElement("div"); mensagem.className = "bc-card"; mensagem.style.whiteSpace = "pre-wrap"; mensagem.textContent = item.mensagem;
        const link = document.createElement("a"); link.className = "bc-button"; link.style.marginTop = "16px"; link.href = `mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(`Re: ${item.assunto}`)}`; link.innerHTML = '<i class="bi bi-reply"></i> Responder por e-mail';
        body.append(meta, mensagem, link);
        abrirModal("detalheModal");
    }

    async function atualizarContato(id, status) {
        const { error } = await supabaseClient.from("contatos").update({ status, responded_at: status === "resolvido" ? new Date().toISOString() : null }).eq("id", id);
        if (error) return feedback("error", error.message);
        feedback("success", "Status do contato atualizado.");
        await carregarDados();
    }

    function configurarEventos() {
        $("#novoEvento")?.addEventListener("click", abrirNovoEvento);
        $("#eventoForm")?.addEventListener("submit", salvarEvento);
        $("#atualizarPainel")?.addEventListener("click", async () => {
            try { await carregarDados(); feedback("success", "Painel atualizado."); }
            catch (erro) { feedback("error", erro.message); }
        });
        ["#pesquisaEventoAdmin", "#filtroStatusEvento"].forEach((sel) => $(sel)?.addEventListener("input", renderizarEventos));
        ["#pesquisaInscrito", "#filtroStatusInscricao"].forEach((sel) => $(sel)?.addEventListener("input", renderizarInscricoes));
        ["#pesquisaContato", "#filtroStatusContato"].forEach((sel) => $(sel)?.addEventListener("input", renderizarContatos));
        $("#exportarInscricoes")?.addEventListener("click", exportarCSV);
        $("#processarEmails")?.addEventListener("click", async (event) => {
            const botao = event.currentTarget;
            const original = botao.innerHTML;
            botao.disabled = true;
            botao.innerHTML = '<i class="bi bi-hourglass-split"></i> Processando...';
            const { data, error } = await supabaseClient.functions.invoke("enviar-email");
            botao.disabled = false;
            botao.innerHTML = original;
            if (error) return feedback("error", "A função de e-mail ainda não foi implantada ou configurada.");
            feedback("success", `${data?.processed || 0} e-mail(s) processado(s).`);
        });
        $("#checkinForm")?.addEventListener("submit", (event) => {
            event.preventDefault();
            checkinComCodigo($("#checkinCode").value);
        });
    }

    async function init() {
        configurarNavegacao();
        configurarEventos();
        const auth = await exigirAutenticacao({ role: ["admin", "organizador"], redirect: "login.html" });
        if (!auth) return;
        state.auth = auth;
        const nome = auth.perfil?.full_name || auth.user.email?.split("@")[0] || "Administrador";
        $("#adminName").textContent = nome;
        $("#adminRole").textContent = auth.perfil?.role || "admin";
        $("#adminAvatar").textContent = nome.charAt(0).toUpperCase();
        try {
            await carregarDados();
        } catch (erro) {
            console.error(erro);
            feedback("error", `Não foi possível carregar o painel. Aplique database/setup.sql no Supabase. Detalhes: ${erro.message}`);
            renderizarTudo();
        }
    }

    init();
})();
