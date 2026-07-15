(function () {
    "use strict";
    const id = new URLSearchParams(location.search).get("id");
    let evento = null;

    function meta(icone, titulo, texto) {
        const item = document.createElement("div"); item.className = "event-meta-item";
        const i = document.createElement("i"); i.className = `bi ${icone}`;
        const corpo = document.createElement("div");
        const strong = document.createElement("strong"); strong.textContent = titulo;
        const p = document.createElement("p"); p.style.margin = "3px 0 0"; p.textContent = texto || "A confirmar";
        corpo.append(strong, p); item.append(i, corpo); return item;
    }

    function renderizar() {
        document.getElementById("eventoLoading").hidden = true;
        document.getElementById("eventoContent").hidden = false;
        document.title = `${evento.nome} | BatataCore`;
        const cover = document.getElementById("eventoCover");
        cover.src = evento.imagem_url || (String(evento.categoria).toLowerCase().includes("palestra") ? "../img/palestra.png" : "../img/desenvolvimentoweb.png");
        cover.alt = `Imagem do evento ${evento.nome}`;
        document.getElementById("eventoCategoria").lastChild.textContent = ` ${evento.categoria || "Evento"}`;
        document.getElementById("eventoNome").textContent = evento.nome;
        document.getElementById("eventoDescricao").textContent = evento.descricao || "Confira todos os detalhes e faça sua inscrição.";
        document.getElementById("eventoTextoCompleto").textContent = evento.descricao || "Mais informações serão divulgadas em breve.";
        const metaBox = document.getElementById("eventoMeta");
        metaBox.append(
            meta("bi-calendar-event", "Data", window.BatataCore.formatarData(evento.data_evento, { weekday: "long" })),
            meta("bi-clock", "Horário", evento.hora_inicio ? `${evento.hora_inicio.slice(0,5)}${evento.hora_fim ? ` às ${evento.hora_fim.slice(0,5)}` : ""}` : "A confirmar"),
            meta("bi-geo-alt", "Local", evento.local),
            meta("bi-broadcast", "Formato", evento.formato || "Presencial")
        );
        const total = Number(evento.vagas_total || 0), ocupadas = Number(evento.vagas_ocupadas || 0), restantes = Math.max(0, total - ocupadas);
        document.getElementById("eventoVagasTexto").textContent = total ? (restantes ? `${restantes} de ${total} vagas ainda disponíveis.` : "As vagas foram preenchidas. Novas inscrições entram na lista de espera.") : "Quantidade de vagas a confirmar.";
        document.getElementById("eventoVagasBar").style.width = `${total ? Math.min(100, (ocupadas / total) * 100) : 0}%`;
        document.getElementById("eventoInscrever").href = `formulario.html?evento_id=${encodeURIComponent(evento.id)}`;
    }

    function baixarICS() {
        if (!evento) return;
        const data = String(evento.data_evento || "").replaceAll("-", "");
        const inicio = String(evento.hora_inicio || "09:00").replace(":", "") + "00";
        const fim = String(evento.hora_fim || evento.hora_inicio || "10:00").replace(":", "") + "00";
        const texto = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//BatataCore//Eventos//PT-BR","BEGIN:VEVENT",`UID:batatacore-${evento.id}@batatacore`,`DTSTART:${data}T${inicio}`,`DTEND:${data}T${fim}`,`SUMMARY:${evento.nome}`,`DESCRIPTION:${String(evento.descricao || "").replace(/\n/g,"\\n")}`,`LOCATION:${evento.endereco || evento.local || ""}`,"END:VEVENT","END:VCALENDAR"].join("\r\n");
        const url = URL.createObjectURL(new Blob([texto], { type: "text/calendar;charset=utf-8" }));
        const link = document.createElement("a"); link.href = url; link.download = `${evento.slug || "evento"}.ics`; link.click(); URL.revokeObjectURL(url);
    }

    async function carregar() {
        if (!id || !supabaseClient) {
            document.getElementById("eventoLoading").hidden = true;
            document.getElementById("eventoError").hidden = false;
            return;
        }
        const { data, error } = await supabaseClient.from("eventos").select("*").eq("id", id).maybeSingle();
        if (error || !data) {
            document.getElementById("eventoLoading").hidden = true;
            document.getElementById("eventoError").hidden = false;
            return;
        }
        evento = data; renderizar();
    }

    document.getElementById("eventoCompartilhar")?.addEventListener("click", async () => {
        const texto = `${evento?.nome || "Evento"} no BatataCore`;
        if (navigator.share) return navigator.share({ title: texto, text: evento?.descricao || "", url: location.href });
        window.open(`https://wa.me/?text=${encodeURIComponent(`${texto}\n${location.href}`)}`, "_blank", "noopener");
    });
    document.getElementById("eventoAgenda")?.addEventListener("click", baixarICS);
    carregar();
})();
