const contadores = document.querySelectorAll(".contador");
let iniciou = false;

function animarContadores() {
    contadores.forEach((contador) => {
        const objetivo = Number(contador.dataset.numero);
        const prefixo = contador.dataset.prefixo || "";
        const sufixo = contador.dataset.sufixo || "";
        let atual = 0;
        const incremento = Math.max(1, Math.ceil(objetivo / 80));

        function atualizar() {
            atual += incremento;
            if (atual > objetivo) atual = objetivo;
            contador.textContent = `${prefixo}${atual}${sufixo}`;
            if (atual < objetivo) requestAnimationFrame(atualizar);
        }

        atualizar();
    });
}

window.addEventListener("scroll", () => {
    if (iniciou) return;

    const secao = document.querySelector(".contadores");
    if(!secao) return;

    const topo = secao.getBoundingClientRect().top;

    if (topo < window.innerHeight - 100) {
        iniciou = true;
        animarContadores();
    }
});
