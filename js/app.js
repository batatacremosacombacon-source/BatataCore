(function () {
    "use strict";

    const emSubpasta = /\/html\//.test(location.pathname);
    const raiz = emSubpasta ? ".." : ".";

    window.BatataCore = window.BatataCore || {};
    window.BatataCore.raiz = raiz;
    window.BatataCore.escapeHTML = function (valor) {
        return String(valor ?? "").replace(/[&<>'"]/g, (caractere) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        })[caractere]);
    };
    window.BatataCore.formatarData = function (data, opcoes = {}) {
        if (!data) return "Data em breve";
        const valor = /^\d{4}-\d{2}-\d{2}$/.test(data) ? `${data}T12:00:00` : data;
        const objeto = new Date(valor);
        if (Number.isNaN(objeto.getTime())) return "Data em breve";
        return objeto.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            ...opcoes
        });
    };

    function adicionarAcessibilidade() {
        if (!document.querySelector(".skip-link")) {
            const link = document.createElement("a");
            link.className = "skip-link";
            link.href = "#conteudo-principal";
            link.textContent = "Pular para o conteúdo principal";
            document.body.prepend(link);
        }

        const main = document.querySelector("main") || document.querySelector("section");
        if (main && !main.id) main.id = "conteudo-principal";

        document.querySelectorAll("button:not([type])").forEach((botao) => {
            botao.type = "button";
        });

        document.querySelectorAll("img:not([loading])").forEach((imagem, indice) => {
            if (indice > 0) imagem.loading = "lazy";
            imagem.decoding = "async";
        });
    }

    function configurarMenuMobile() {
        const headerContainer = document.querySelector("header .container");
        const nav = headerContainer?.querySelector("nav");
        if (!headerContainer || !nav || headerContainer.querySelector(".menu-mobile-toggle")) return;

        const botao = document.createElement("button");
        botao.className = "menu-mobile-toggle";
        botao.type = "button";
        botao.setAttribute("aria-label", "Abrir menu de navegação");
        botao.setAttribute("aria-expanded", "false");
        botao.innerHTML = '<i class="bi bi-list" aria-hidden="true"></i>';
        headerContainer.insertBefore(botao, nav);

        function fechar() {
            nav.classList.remove("menu-aberto");
            botao.setAttribute("aria-expanded", "false");
            botao.innerHTML = '<i class="bi bi-list" aria-hidden="true"></i>';
        }

        botao.addEventListener("click", () => {
            const aberto = nav.classList.toggle("menu-aberto");
            botao.setAttribute("aria-expanded", String(aberto));
            botao.innerHTML = aberto
                ? '<i class="bi bi-x-lg" aria-hidden="true"></i>'
                : '<i class="bi bi-list" aria-hidden="true"></i>';
        });

        nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", fechar));
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") fechar();
        });
    }

    function configurarStatusConexao() {
        let aviso = document.getElementById("statusConexao");
        if (!aviso) {
            aviso = document.createElement("div");
            aviso.id = "statusConexao";
            aviso.className = "status-conexao";
            aviso.setAttribute("role", "status");
            aviso.setAttribute("aria-live", "polite");
            document.body.appendChild(aviso);
        }

        const atualizar = () => {
            const offline = !navigator.onLine;
            aviso.classList.toggle("ativo", offline);
            aviso.innerHTML = offline
                ? '<i class="bi bi-wifi-off"></i> Você está offline. Algumas funções podem ficar indisponíveis.'
                : "";
        };
        addEventListener("online", atualizar);
        addEventListener("offline", atualizar);
        atualizar();
    }

    function registrarPWA() {
        if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
        addEventListener("load", () => {
            navigator.serviceWorker.register(`${raiz}/service-worker.js`).catch((erro) => {
                console.warn("Service Worker não registrado:", erro.message);
            });
        });

        let eventoInstalacao = null;
        addEventListener("beforeinstallprompt", (event) => {
            event.preventDefault();
            eventoInstalacao = event;
            const botao = document.getElementById("instalarApp");
            if (botao) botao.hidden = false;
        });

        document.addEventListener("click", async (event) => {
            const botao = event.target.closest("#instalarApp");
            if (!botao || !eventoInstalacao) return;
            await eventoInstalacao.prompt();
            eventoInstalacao = null;
            botao.hidden = true;
        });
    }

    async function atualizarLinksConta() {
        if (!window.BatataAuth) return;
        const usuario = await window.BatataAuth.obterUsuarioAtual();
        const linksAdmin = document.querySelectorAll(".admin-acesso");

        linksAdmin.forEach((link) => {
            link.title = usuario ? "Abrir minha conta" : "Entrar no BatataCore";
            if (usuario) link.href = `${raiz}/html/minha-conta.html`;
        });
    }

    function configurarErrosGlobais() {
        addEventListener("unhandledrejection", (event) => {
            console.error("Erro assíncrono não tratado:", event.reason);
        });
        addEventListener("error", (event) => {
            if (event.target !== window) {
                console.warn("Recurso não carregado:", event.target?.src || event.target?.href);
            }
        }, true);
    }

    function init() {
        adicionarAcessibilidade();
        configurarMenuMobile();
        configurarStatusConexao();
        registrarPWA();
        atualizarLinksConta();
        configurarErrosGlobais();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
