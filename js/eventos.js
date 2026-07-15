(function () {
    "use strict";
    const container = document.querySelector(".lista-eventos .container");
    const pesquisa = document.getElementById("pesquisaEvento");
    let eventos = [];

    function imagemPorCategoria(categoria = "") {
        const cat = categoria.toLowerCase();
        if (cat.includes("hackathon")) return "../img/hackaton.png";
        if (cat.includes("palestra")) return "../img/palestra.png";
        if (cat.includes("workshop") || cat.includes("curso")) return "../img/desenvolvimentoweb.png";
        return "../img/batatalogo2.png";
    }

    function adicionarFiltros() {
        const box = document.querySelector(".pesquisa-eventos");
        if (!box || document.getElementById("filtroCategoriaEvento")) return;
        const select = document.createElement("select");
        select.id = "filtroCategoriaEvento";
        select.setAttribute("aria-label", "Filtrar eventos por categoria");
        select.innerHTML = '<option value="">Todas as categorias</option>';
        box.appendChild(select);
        select.addEventListener("change", renderizar);
    }

    function preencherCategorias() {
        const select = document.getElementById("filtroCategoriaEvento");
        if (!select) return;
        const categorias = [...new Set(eventos.map((evento) => evento.categoria).filter(Boolean))].sort();
        select.innerHTML = '<option value="">Todas as categorias</option>';
        categorias.forEach((categoria) => {
            const option = document.createElement("option");
            option.value = categoria;
            option.textContent = categoria;
            select.appendChild(option);
        });
    }

    function criarCard(evento) {
        const card = document.createElement("article");
        card.className = "evento-card";

        const imagem = document.createElement("img");
        imagem.src = evento.imagem_url?.trim() || imagemPorCategoria(evento.categoria);
        imagem.alt = `Imagem do evento ${evento.nome}`;
        imagem.loading = "lazy";
        imagem.addEventListener("error", () => { imagem.src = imagemPorCategoria(evento.categoria); }, { once: true });

        const info = document.createElement("div");
        info.className = "evento-info";
        const categoria = document.createElement("span");
        categoria.className = "categoria";
        categoria.textContent = evento.categoria || "Evento";
        const titulo = document.createElement("h3");
        titulo.textContent = evento.nome || "Evento BatataCore";
        const descricao = document.createElement("p");
        descricao.textContent = evento.descricao || "Confira os detalhes deste evento no BatataCore.";

        const detalhes = document.createElement("div");
        detalhes.className = "detalhes";
        const data = document.createElement("span");
        data.innerHTML = '<i class="bi bi-calendar-event" aria-hidden="true"></i>';
        data.append(document.createTextNode(` ${window.BatataCore.formatarData(evento.data_evento)}`));
        const local = document.createElement("span");
        local.innerHTML = '<i class="bi bi-geo-alt" aria-hidden="true"></i>';
        local.append(document.createTextNode(` ${evento.local || "Local em breve"}`));
        detalhes.append(data, local);

        const ocupadas = Number(evento.vagas_ocupadas || 0);
        const total = Number(evento.vagas_total || 0);
        const vagas = document.createElement("small");
        vagas.className = "vagas-evento";
        vagas.textContent = total > 0
            ? ocupadas >= total ? "Lista de espera disponível" : `${total - ocupadas} vaga(s) disponível(is)`
            : "Vagas a confirmar";

        const acoes = document.createElement("div");
        acoes.className = "bc-button-row";
        const detalhesLink = document.createElement("a");
        detalhesLink.className = "bc-button ghost small";
        detalhesLink.href = `evento.html?id=${encodeURIComponent(evento.id)}`;
        detalhesLink.innerHTML = '<i class="bi bi-eye"></i> Detalhes';
        const inscricaoLink = document.createElement("a");
        inscricaoLink.className = "bc-button small";
        inscricaoLink.href = `formulario.html?evento_id=${encodeURIComponent(evento.id)}`;
        inscricaoLink.innerHTML = '<i class="bi bi-ticket-perforated"></i> Inscrever-se';
        acoes.append(detalhesLink, inscricaoLink);

        info.append(categoria, titulo, descricao, detalhes, vagas, acoes);
        card.append(imagem, info);
        return card;
    }

    function renderizar() {
        if (!container) return;
        const termo = pesquisa?.value.toLowerCase().trim() || "";
        const categoria = document.getElementById("filtroCategoriaEvento")?.value || "";
        const filtrados = eventos.filter((evento) => {
            const conteudo = `${evento.nome} ${evento.categoria} ${evento.descricao} ${evento.local}`.toLowerCase();
            return conteudo.includes(termo) && (!categoria || evento.categoria === categoria);
        });

        container.innerHTML = "";
        if (!filtrados.length) {
            const vazio = document.createElement("div");
            vazio.className = "bc-empty";
            vazio.innerHTML = '<i class="bi bi-calendar-x"></i><h3>Nenhum evento encontrado</h3><p>Tente outra pesquisa ou volte em breve.</p>';
            container.appendChild(vazio);
            return;
        }
        filtrados.forEach((evento) => container.appendChild(criarCard(evento)));
    }

    async function carregar() {
        adicionarFiltros();
        pesquisa?.addEventListener("input", renderizar);
        if (!container || !supabaseClient) return;

        const original = container.innerHTML;
        container.innerHTML = '<div class="bc-grid bc-grid-3" style="grid-column:1/-1"><div class="bc-skeleton"></div><div class="bc-skeleton"></div><div class="bc-skeleton"></div></div>';
        const { data, error } = await supabaseClient
            .from("eventos")
            .select("*")
            .eq("status", "publicado")
            .is("deleted_at", null)
            .order("data_evento", { ascending: true });

        if (error) {
            console.error("Erro ao carregar eventos:", error);
            container.innerHTML = original;
            return;
        }
        eventos = data || [];
        preencherCategorias();
        renderizar();
    }

    carregar();
})();
