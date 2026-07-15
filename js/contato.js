(function(){
    "use strict";
    const form=document.getElementById("contatoForm");
    if(!form) return;
    const toast=(tipo,texto)=>{if(typeof window.mostrarToast==="function") window.mostrarToast(tipo,texto);};
    const campos={nome:document.getElementById("nome"),email:document.getElementById("email"),assunto:document.getElementById("assunto"),mensagem:document.getElementById("mensagem")};

    const honeypot=document.createElement("input");
    honeypot.type="text"; honeypot.name="website"; honeypot.tabIndex=-1; honeypot.autocomplete="off"; honeypot.setAttribute("aria-hidden","true"); honeypot.style.position="absolute"; honeypot.style.left="-9999px";
    form.appendChild(honeypot);

    function marcar(campo,mensagem){
        const box=campo?.closest(".campo"); if(!box) return;
        box.classList.toggle("erro",Boolean(mensagem)); box.classList.toggle("sucesso",!mensagem);
        let small=box.querySelector(".mensagem-erro");
        if(mensagem){ if(!small){small=document.createElement("small");small.className="mensagem-erro";box.appendChild(small);} small.textContent=mensagem; campo.setAttribute("aria-invalid","true"); }
        else { small?.remove(); campo.removeAttribute("aria-invalid"); }
    }
    function validar(){
        let ok=true;
        if(campos.nome.value.trim().length<3){marcar(campos.nome,"Digite seu nome completo.");ok=false}else marcar(campos.nome,"");
        if(!/^\S+@\S+\.\S+$/.test(campos.email.value.trim())){marcar(campos.email,"Digite um e-mail válido.");ok=false}else marcar(campos.email,"");
        if(campos.assunto.value.trim().length<4){marcar(campos.assunto,"Digite um assunto mais claro.");ok=false}else marcar(campos.assunto,"");
        if(campos.mensagem.value.trim().length<10){marcar(campos.mensagem,"Escreva uma mensagem com pelo menos 10 caracteres.");ok=false}else if(campos.mensagem.value.length>3000){marcar(campos.mensagem,"A mensagem deve ter no máximo 3.000 caracteres.");ok=false}else marcar(campos.mensagem,"");
        return ok;
    }
    async function prefill(){
        if(!window.BatataAuth) return;
        const user=await obterUsuarioAtual(); if(!user) return;
        const perfil=await obterPerfilAtual(user.id);
        if(!campos.nome.value) campos.nome.value=perfil?.full_name||"";
        if(!campos.email.value) campos.email.value=user.email||"";
    }
    form.addEventListener("submit",async event=>{
        event.preventDefault();
        if(honeypot.value) return;
        if(!validar()){toast("erro","Revise os campos destacados.");document.querySelector(".campo.erro")?.scrollIntoView({behavior:"smooth",block:"center"});return;}
        if(!supabaseClient){toast("erro","Supabase não configurado.");return;}
        const botao=form.querySelector("button[type='submit']"),original=botao.innerHTML; botao.disabled=true; botao.innerHTML='<i class="bi bi-hourglass-split"></i> Enviando...';
        const user=await obterUsuarioAtual();
        const payload={nome:campos.nome.value.trim(),email:campos.email.value.trim().toLowerCase(),assunto:campos.assunto.value.trim(),mensagem:campos.mensagem.value.trim(),status:"aberto"};
        if(user) payload.user_id=user.id;
        let {error}=await supabaseClient.from("contatos").insert(payload);
        if(error && payload.user_id && /user_id/i.test(error.message||"")){delete payload.user_id;({error}=await supabaseClient.from("contatos").insert(payload));}
        botao.disabled=false;botao.innerHTML=original;
        if(error){console.error(error);toast("erro","Não foi possível enviar sua mensagem.");return;}
        toast("sucesso","Mensagem enviada. Responderemos assim que possível.");form.reset();document.querySelectorAll(".campo").forEach(box=>box.classList.remove("erro","sucesso"));document.querySelectorAll(".mensagem-erro").forEach(e=>e.remove());
    });
    Object.values(campos).forEach(campo=>campo?.addEventListener("blur",validar));
    prefill();
})();
