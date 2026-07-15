(function () {
    "use strict";
    const perguntas = document.querySelectorAll(".faq-item");
    perguntas.forEach((item) => {
        const botao = item.querySelector(".faq-pergunta");
        botao?.addEventListener("click", () => {
            perguntas.forEach((outro) => { if (outro !== item) outro.classList.remove("ativo"); });
            const ativo = item.classList.toggle("ativo");
            botao.setAttribute("aria-expanded", String(ativo));
        });
    });

    const form = document.getElementById("formEvento");
    if (!form) return;
    const campos = {
        nome: document.getElementById("nome"), email: document.getElementById("email"), telefone: document.getElementById("telefone"),
        cidade: document.getElementById("cidade"), evento: document.getElementById("evento"), tipo: document.getElementById("tipo"), observacao: document.getElementById("observacao")
    };
    let eventos = [];
    const toast = (tipo, texto) => { if (typeof window.mostrarToast === "function") window.mostrarToast(tipo, texto); };

    function erro(campo, mensagem) {
        const grupo = campo?.closest(".grupo");
        if (!grupo) return;
        grupo.classList.add("erro"); grupo.classList.remove("sucesso");
        let box = grupo.querySelector(".mensagem-erro");
        if (!box) { box = document.createElement("small"); box.className = "mensagem-erro"; grupo.appendChild(box); }
        box.textContent = mensagem;
        campo.setAttribute("aria-invalid", "true");
    }
    function sucesso(campo) {
        const grupo = campo?.closest(".grupo"); if (!grupo) return;
        grupo.classList.remove("erro"); grupo.classList.add("sucesso"); grupo.querySelector(".mensagem-erro")?.remove(); campo.removeAttribute("aria-invalid");
    }
    const emailValido = (valor) => /^\S+@\S+\.\S+$/.test(valor);
    const telefoneValido = (valor) => valor.replace(/\D/g, "").length >= 10;

    function mascaraTelefone(campo) {
        const valor = campo.value.replace(/\D/g, "").slice(0, 11);
        if (valor.length > 10) campo.value = valor.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        else if (valor.length > 6) campo.value = valor.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
        else if (valor.length > 2) campo.value = valor.replace(/(\d{2})(\d{0,5})/, "($1) $2");
        else campo.value = valor;
    }

    function garantirConsentimento() {
        if (document.getElementById("consentimentoLgpd")) return;
        const botao = form.querySelector("button[type='submit']");
        const grupo = document.createElement("div");
        grupo.className = "grupo bc-field inline";
        grupo.innerHTML = '<input id="consentimentoLgpd" type="checkbox" required><label for="consentimentoLgpd">Autorizo o uso dos meus dados para processar esta inscrição, conforme a <a href="privacidade.html">Política de Privacidade</a>.</label>';
        form.insertBefore(grupo, botao);
    }

    function garantirModalTicket() {
        if (document.getElementById("ticketModal")) return;
        const modal = document.createElement("div"); modal.id = "ticketModal"; modal.className = "bc-modal"; modal.setAttribute("aria-hidden", "true");
        modal.innerHTML = `<div class="bc-modal-dialog"><div class="bc-modal-header"><h2>Inscrição concluída</h2><button class="bc-modal-close" type="button" id="fecharTicket" aria-label="Fechar"><i class="bi bi-x-lg"></i></button></div><div class="bc-ticket"><img src="../img/batatalogo2.png" alt="BatataCore" style="width:90px"><h3 id="ticketEvento">Evento</h3><p id="ticketStatus"></p><div id="ticketQr" class="bc-qr"></div><code id="ticketCodigo" class="bc-ticket-code"></code><p>Guarde este código. Ele será usado no check-in.</p><div class="bc-button-row"><button class="bc-button" type="button" id="imprimirTicket"><i class="bi bi-printer"></i> Imprimir</button><a class="bc-button secondary" href="minha-conta.html"><i class="bi bi-person-circle"></i> Minha conta</a></div></div></div>`;
        document.body.appendChild(modal);
        const fechar = () => { modal.classList.remove("ativo"); modal.setAttribute("aria-hidden", "true"); };
        modal.querySelector("#fecharTicket").addEventListener("click", fechar);
        modal.addEventListener("click", (event) => { if (event.target === modal) fechar(); });
        modal.querySelector("#imprimirTicket").addEventListener("click", () => window.print());
    }

    function validar() {
        let valido = true;
        if (campos.nome.value.trim().length < 3) { erro(campos.nome, "Digite seu nome completo."); valido = false; } else sucesso(campos.nome);
        if (!emailValido(campos.email.value.trim())) { erro(campos.email, "Digite um e-mail válido."); valido = false; } else sucesso(campos.email);
        if (!telefoneValido(campos.telefone.value)) { erro(campos.telefone, "Digite um telefone válido."); valido = false; } else sucesso(campos.telefone);
        if (!campos.cidade.value.trim()) { erro(campos.cidade, "Informe sua cidade."); valido = false; } else sucesso(campos.cidade);
        if (!campos.evento.value) { erro(campos.evento, "Selecione um evento."); valido = false; } else sucesso(campos.evento);
        if (!campos.tipo.value) { erro(campos.tipo, "Selecione o tipo de inscrição."); valido = false; } else sucesso(campos.tipo);
        const consentimento = document.getElementById("consentimentoLgpd");
        if (!consentimento?.checked) { erro(consentimento, "É necessário aceitar a Política de Privacidade."); valido = false; } else sucesso(consentimento);
        return valido;
    }

    async function carregarEventos() {
        if (!supabaseClient || !campos.evento) return;
        campos.evento.innerHTML = '<option value="">Carregando eventos...</option>';
        const { data, error } = await supabaseClient.from("eventos").select("id,nome,data_evento,vagas_total,vagas_ocupadas,status").eq("status", "publicado").is("deleted_at", null).order("data_evento");
        if (error) {
            campos.evento.innerHTML = '<option value="">Não foi possível carregar os eventos</option>';
            return;
        }
        eventos = data || [];
        campos.evento.innerHTML = '<option value="">Selecione um evento</option>';
        eventos.forEach((evento) => {
            const option = document.createElement("option");
            option.value = evento.id;
            const lotado = Number(evento.vagas_ocupadas || 0) >= Number(evento.vagas_total || 0);
            option.textContent = `${evento.nome}${lotado ? " — lista de espera" : ""}`;
            option.dataset.nome = evento.nome;
            campos.evento.appendChild(option);
        });
        const params = new URLSearchParams(location.search);
        const eventoId = params.get("evento_id");
        const eventoNome = params.get("evento");
        if (eventoId && campos.evento.querySelector(`option[value="${CSS.escape(eventoId)}"]`)) campos.evento.value = eventoId;
        else if (eventoNome) {
            const alvo = Array.from(campos.evento.options).find((option) => option.dataset.nome?.toLowerCase() === eventoNome.toLowerCase());
            if (alvo) campos.evento.value = alvo.value;
        }
    }

    async function preencherUsuario() {
        if (!window.BatataAuth) return;
        const user = await obterUsuarioAtual();
        if (!user) return;
        const perfil = await obterPerfilAtual(user.id);
        if (!campos.email.value) campos.email.value = user.email || "";
        if (!campos.nome.value) campos.nome.value = perfil?.full_name || "";
        if (!campos.telefone.value) campos.telefone.value = perfil?.phone || "";
        if (!campos.cidade.value) campos.cidade.value = perfil?.city || "";
    }

    function mostrarTicket(resultado, eventoNome) {
        garantirModalTicket();
        const modal = document.getElementById("ticketModal");
        document.getElementById("ticketEvento").textContent = eventoNome;
        document.getElementById("ticketStatus").textContent = resultado.status === "lista_espera" ? "Você entrou na lista de espera." : "Sua vaga está confirmada.";
        document.getElementById("ticketCodigo").textContent = resultado.ticket_code;
        const qr = document.getElementById("ticketQr"); qr.innerHTML = "";
        if (window.QRCode) new QRCode(qr, { text: resultado.ticket_code, width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M });
        else qr.textContent = "QR Code indisponível. Use o código abaixo.";
        modal.classList.add("ativo"); modal.setAttribute("aria-hidden", "false");
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!validar()) {
            document.querySelector(".grupo.erro")?.scrollIntoView({ behavior: "smooth", block: "center" });
            if (typeof mostrarToast === "function") mostrarToast("erro", "Revise os campos destacados.");
            return;
        }
        if (!supabaseClient) return toast("erro", "Supabase não configurado.");
        const botao = form.querySelector("button[type='submit']"); const original = botao.innerHTML;
        botao.disabled = true; botao.innerHTML = '<i class="bi bi-hourglass-split"></i> Confirmando inscrição...';
        const option = campos.evento.selectedOptions[0];
        const payload = {
            p_evento_id: Number(campos.evento.value), p_nome: campos.nome.value.trim(), p_email: campos.email.value.trim().toLowerCase(),
            p_telefone: campos.telefone.value.trim(), p_cidade: campos.cidade.value.trim(), p_tipo: campos.tipo.value,
            p_observacao: campos.observacao.value.trim(), p_consentimento_lgpd: true
        };
        const { data, error } = await supabaseClient.rpc("criar_inscricao", payload);
        botao.disabled = false; botao.innerHTML = original;
        if (error) {
            console.error(error);
            toast("erro", error.message || "Não foi possível concluir a inscrição.");
            return;
        }
        const resultado = Array.isArray(data) ? data[0] : data;
        toast("sucesso", resultado.status === "lista_espera" ? "Você entrou na lista de espera." : "Inscrição confirmada!");
        mostrarTicket(resultado, option?.dataset.nome || option?.textContent || "Evento");
        form.reset();
        document.querySelectorAll(".grupo").forEach((grupo) => grupo.classList.remove("erro", "sucesso"));
        await carregarEventos();
    });

    Object.values(campos).forEach((campo) => campo?.addEventListener("blur", validar));
    campos.telefone?.addEventListener("input", () => mascaraTelefone(campos.telefone));
    garantirConsentimento(); garantirModalTicket(); carregarEventos(); preencherUsuario();
})();
