(function () {
    "use strict";

    const tabs = document.querySelectorAll("[data-auth-tab]");
    const paineis = document.querySelectorAll("[data-auth-panel]");
    const feedback = document.getElementById("authFeedback");
    const params = new URLSearchParams(location.search);

    function mostrarPainel(nome) {
        tabs.forEach((tab) => {
            const ativo = tab.dataset.authTab === nome;
            tab.classList.toggle("ativo", ativo);
            tab.setAttribute("aria-selected", String(ativo));
        });
        paineis.forEach((painel) => {
            painel.hidden = painel.dataset.authPanel !== nome;
        });
        feedback.hidden = true;
    }

    function mensagem(tipo, texto) {
        feedback.className = `bc-alert ${tipo}`;
        feedback.innerHTML = `<i class="bi ${tipo === "error" ? "bi-exclamation-triangle" : "bi-check-circle"}"></i><span></span>`;
        feedback.querySelector("span").textContent = texto;
        feedback.hidden = false;
    }

    function travar(form, travado, texto = "Processando...") {
        const botao = form.querySelector("button[type='submit']");
        if (!botao) return;
        if (!botao.dataset.original) botao.dataset.original = botao.innerHTML;
        botao.disabled = travado;
        botao.innerHTML = travado ? `<i class="bi bi-hourglass-split"></i> ${texto}` : botao.dataset.original;
    }

    tabs.forEach((tab) => tab.addEventListener("click", () => mostrarPainel(tab.dataset.authTab)));

    document.querySelectorAll("[data-toggle-password]").forEach((botao) => {
        botao.addEventListener("click", () => {
            const campo = document.getElementById(botao.dataset.togglePassword);
            if (!campo) return;
            campo.type = campo.type === "password" ? "text" : "password";
            botao.innerHTML = campo.type === "password"
                ? '<i class="bi bi-eye"></i>'
                : '<i class="bi bi-eye-slash"></i>';
        });
    });

    document.getElementById("loginForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!supabaseClient) return mensagem("error", "Configure o Supabase antes de entrar.");

        const form = event.currentTarget;
        const email = form.email.value.trim().toLowerCase();
        const password = form.password.value;
        if (!email || password.length < 6) return mensagem("error", "Informe um e-mail válido e uma senha com pelo menos 6 caracteres.");

        travar(form, true, "Entrando...");
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            travar(form, false);
            return mensagem("error", "Não foi possível entrar. Confira o e-mail, a senha e a confirmação da conta.");
        }

        const perfil = await obterPerfilAtual(data.user.id);
        const next = params.get("next");
        const destino = next && next.startsWith("/") && !next.startsWith("//")
            ? next
            : perfil && ["admin", "organizador"].includes(perfil.role)
                ? "inscritos.html"
                : "minha-conta.html";
        location.replace(destino);
    });

    document.getElementById("cadastroForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!supabaseClient) return mensagem("error", "Configure o Supabase antes de criar uma conta.");

        const form = event.currentTarget;
        const fullName = form.fullName.value.trim();
        const email = form.email.value.trim().toLowerCase();
        const password = form.password.value;
        const confirm = form.confirmPassword.value;
        const accepted = form.terms.checked;

        if (fullName.length < 3) return mensagem("error", "Digite seu nome completo.");
        if (!/^\S+@\S+\.\S+$/.test(email)) return mensagem("error", "Digite um e-mail válido.");
        if (password.length < 8) return mensagem("error", "A senha precisa ter pelo menos 8 caracteres.");
        if (password !== confirm) return mensagem("error", "As senhas não coincidem.");
        if (!accepted) return mensagem("error", "Aceite os Termos de Uso e a Política de Privacidade.");

        travar(form, true, "Criando conta...");
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
                emailRedirectTo: `${location.origin}${location.pathname.replace("login.html", "minha-conta.html")}`
            }
        });
        travar(form, false);

        if (error) return mensagem("error", error.message || "Não foi possível criar sua conta.");
        form.reset();
        if (data.session) {
            mensagem("success", "Conta criada. Você já pode acessar sua área do participante.");
            setTimeout(() => location.replace("minha-conta.html"), 900);
        } else {
            mensagem("success", "Conta criada. Confira seu e-mail para confirmar o cadastro antes de entrar.");
            mostrarPainel("login");
        }
    });

    document.getElementById("recuperarForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!supabaseClient) return mensagem("error", "Configure o Supabase antes de recuperar a senha.");
        const form = event.currentTarget;
        const email = form.email.value.trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) return mensagem("error", "Digite um e-mail válido.");
        travar(form, true, "Enviando...");
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${location.origin}${location.pathname}?mode=nova-senha`
        });
        travar(form, false);
        if (error) return mensagem("error", "Não foi possível enviar o link de recuperação.");
        mensagem("success", "Enviamos as instruções para seu e-mail.");
    });

    document.getElementById("novaSenhaForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const password = form.password.value;
        const confirm = form.confirmPassword.value;
        if (password.length < 8) return mensagem("error", "A senha precisa ter pelo menos 8 caracteres.");
        if (password !== confirm) return mensagem("error", "As senhas não coincidem.");
        travar(form, true, "Atualizando...");
        const { error } = await supabaseClient.auth.updateUser({ password });
        travar(form, false);
        if (error) return mensagem("error", "O link expirou ou a senha não pôde ser alterada.");
        mensagem("success", "Senha atualizada. Você já pode entrar.");
        mostrarPainel("login");
    });

    supabaseClient?.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") mostrarPainel("nova-senha");
    });

    if (params.get("mode") === "nova-senha") mostrarPainel("nova-senha");
    else if (params.get("cadastro") === "1") mostrarPainel("cadastro");
    else mostrarPainel("login");

    if (params.get("erro") === "permissao") mensagem("error", "Sua conta não possui permissão administrativa.");
})();
