const assistente = document.getElementById("assistente");
const fechar = document.getElementById("fecharAssistente");
const mascote = document.getElementById("mascoteAssistente") || document.getElementById("iconeAssistente");
const caixa = document.querySelector(".assistente-box");
const titulo = document.getElementById("tituloAssistente");
const texto = document.getElementById("textoAssistente");

const paginaAtual = window.location.pathname.split("/").pop();

let mensagens = [];

switch(paginaAtual){
    case "index.html":
    case "":
        mensagens = [
            {titulo:"👋 Bem-vindo ao BatataCore!", texto:"Organize seus eventos e gerencie inscrições de forma simples e eficiente."},
            {titulo:"🎉 Vai organizar um evento?", texto:"O BatataCore cuida das inscrições para você."},
            {titulo:"🥔 Nossa equipe está pronta!", texto:"Sempre que precisar, fale com uma de nossas batatas atendentes."}
        ];
    break;

    case "sobre.html":
        mensagens = [
            {titulo:"😊 Quer conhecer nossa história?", texto:"Descubra como surgiu o BatataCore e nossa missão."},
            {titulo:"💙 Nosso objetivo", texto:"Criamos uma plataforma simples para facilitar a organização de eventos."}
        ];
    break;

    case "recursos.html":
        mensagens = [
            {titulo:"🚀 Conheça nossos recursos!", texto:"Veja tudo o que o BatataCore oferece para seus eventos."},
            {titulo:"⚙️ Automação", texto:"Menos trabalho manual, mais organização."}
        ];
    break;

    case "eventos.html":
        mensagens = [
            {titulo:"🎉 Encontrou um evento interessante?", texto:"Faça sua inscrição em poucos minutos."},
            {titulo:"📅 Eventos organizados", texto:"Tudo pensado para facilitar sua participação."}
        ];
    break;

    case "contato.html":
        mensagens = [
            {titulo:"📩 Precisa falar conosco?", texto:"Nossa equipe está pronta para responder suas dúvidas."},
            {titulo:"🥔 Estamos online!", texto:"Entre em contato sempre que precisar."}
        ];
    break;

    case "inscritos.html":
        mensagens = [
            {titulo:"📊 Painel administrativo", texto:"Aqui você acompanha inscrições, eventos e dados importantes."},
            {titulo:"🔎 Dica rápida", texto:"Use a pesquisa para encontrar participantes por nome, evento, cidade ou status."}
        ];
    break;

    default:
        mensagens = [{titulo:"👋 Olá!", texto:"Seja bem-vindo ao BatataCore."}];
}

const mensagensReabertura = [
    {titulo:"😊 Oi novamente!", texto:"Ainda estou por aqui caso precise de alguma ajuda."},
    {titulo:"🥔 Posso ajudar?", texto:"Nossa equipe está pronta para responder suas dúvidas."},
    {titulo:"🎉 Vai organizar um evento?", texto:"Conte com o BatataCore para gerenciar suas inscrições."},
    {titulo:"📩 Ficou com alguma dúvida?", texto:"Clique no botão abaixo e fale com um de nossos atendentes."}
];

let indice = 0;
let indiceReabertura = 0;
let intervaloMensagens = null;
let intervaloDigitacao = null;

function escreverTexto(frase){

    if(!texto) return;

    clearInterval(intervaloDigitacao);
    texto.innerHTML = "";
    let i = 0;

    intervaloDigitacao = setInterval(()=>{
        texto.innerHTML += frase.charAt(i);
        i++;

        if(i >= frase.length){
            clearInterval(intervaloDigitacao);
        }
    },35);
}

function mostrarMensagem(){

    if(!titulo || !texto || mensagens.length === 0) return;

    titulo.innerHTML = mensagens[indice].titulo;
    texto.innerHTML = '<span class="pensando">...</span>';

    setTimeout(()=>{
        escreverTexto(mensagens[indice].texto);
    },900);
}

function iniciarMensagens(){

    clearInterval(intervaloMensagens);

    return setInterval(() => {
        indice++;

        if(indice >= mensagens.length){
            indice = 0;
        }

        mostrarMensagem();
    },7000);
}

if(assistente){
    setTimeout(()=>{
        assistente.classList.add("ativo");
        mostrarMensagem();
        intervaloMensagens = iniciarMensagens();
    },4000);
}

if(fechar && caixa){
    fechar.addEventListener("click",()=>{
        caixa.style.display = "none";
        clearInterval(intervaloMensagens);
        clearInterval(intervaloDigitacao);
    });
}

if(mascote && caixa){
    mascote.addEventListener("click",()=>{
        caixa.style.display = "block";
        clearInterval(intervaloMensagens);
        clearInterval(intervaloDigitacao);

        if(titulo){
            titulo.innerHTML = mensagensReabertura[indiceReabertura].titulo;
        }

        escreverTexto(mensagensReabertura[indiceReabertura].texto);

        indiceReabertura++;
        if(indiceReabertura >= mensagensReabertura.length){
            indiceReabertura = 0;
        }

        intervaloMensagens = iniciarMensagens();
    });
}
