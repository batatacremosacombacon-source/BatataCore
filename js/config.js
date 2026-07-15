const abrirConfig = document.getElementById("abrirConfig");
const fecharConfig = document.getElementById("fecharConfig");
const painelConfig = document.getElementById("painelConfig");
const tema = document.getElementById("tema");

function aplicarPreferencias() {
    document.body.classList.toggle("dark", localStorage.getItem("tema") === "dark");
    document.documentElement.classList.toggle("sem-animacoes", localStorage.getItem("animacoes") === "off");
    document.documentElement.dataset.fontSize = localStorage.getItem("fontSize") || "normal";
    if (tema) tema.checked = document.body.classList.contains("dark");
}

function criarSwitch(id, marcado, rotulo) {
    const label = document.createElement("label");
    label.className = "switch";
    label.setAttribute("aria-label", rotulo);
    label.innerHTML = `<input type="checkbox" id="${id}" ${marcado ? "checked" : ""}><span class="slider"></span>`;
    return label;
}

function ativarOpcoesExtras() {
    if (!painelConfig) return;
    const opcoes = Array.from(painelConfig.querySelectorAll(".opcao-config.desabilitada"));

    opcoes.forEach((opcao) => {
        const texto = opcao.textContent.toLowerCase();
        opcao.classList.remove("desabilitada");
        opcao.querySelector("small")?.remove();

        if (texto.includes("sons")) {
            const marcado = localStorage.getItem("sons") !== "off";
            const controle = criarSwitch("sonsInterface", marcado, "Ativar sons de interface");
            opcao.appendChild(controle);
            controle.querySelector("input").addEventListener("change", (event) => {
                localStorage.setItem("sons", event.target.checked ? "on" : "off");
            });
        }

        if (texto.includes("anima")) {
            const marcado = localStorage.getItem("animacoes") !== "off";
            const controle = criarSwitch("animacoesInterface", marcado, "Ativar animações");
            opcao.appendChild(controle);
            controle.querySelector("input").addEventListener("change", (event) => {
                localStorage.setItem("animacoes", event.target.checked ? "on" : "off");
                document.documentElement.classList.toggle("sem-animacoes", !event.target.checked);
            });
        }

        if (texto.includes("fonte")) {
            const grupo = document.createElement("div");
            grupo.className = "font-controls";
            grupo.innerHTML = `
                <button type="button" data-font="small" aria-label="Diminuir fonte">A−</button>
                <button type="button" data-font="normal" aria-label="Tamanho padrão">A</button>
                <button type="button" data-font="large" aria-label="Aumentar fonte">A+</button>`;
            grupo.addEventListener("click", (event) => {
                const botao = event.target.closest("[data-font]");
                if (!botao) return;
                const tamanho = botao.dataset.font;
                localStorage.setItem("fontSize", tamanho);
                document.documentElement.dataset.fontSize = tamanho;
            });
            opcao.appendChild(grupo);
        }
    });
}

aplicarPreferencias();
ativarOpcoesExtras();

abrirConfig?.addEventListener("click", () => painelConfig?.classList.add("ativo"));
fecharConfig?.addEventListener("click", () => painelConfig?.classList.remove("ativo"));

document.addEventListener("click", (event) => {
    if (
        painelConfig?.classList.contains("ativo") &&
        !painelConfig.contains(event.target) &&
        !abrirConfig?.contains(event.target)
    ) painelConfig.classList.remove("ativo");
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") painelConfig?.classList.remove("ativo");
});

tema?.addEventListener("change", () => {
    document.body.classList.toggle("dark", tema.checked);
    localStorage.setItem("tema", tema.checked ? "dark" : "light");
});
