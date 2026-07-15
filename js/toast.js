// ==========================
// TOAST BATATACORE
// ==========================

const toast = document.getElementById("toast");
const toastMensagem = document.getElementById("toastMensagem");
const toastIcon = document.getElementById("toastIcon");

let tempoToast;

function loaderFinalizado(){

    const loader = document.getElementById("loader");

    if(!loader) return true;

    return loader.classList.contains("esconder") ||
           loader.style.display === "none" ||
           getComputedStyle(loader).visibility === "hidden" ||
           getComputedStyle(loader).opacity === "0";
}

function mostrarToast(tipo,mensagem){

    if(!toast || !toastMensagem || !toastIcon){
        console.warn("Toast não encontrado:", mensagem);
        return;
    }

    if(!loaderFinalizado()){

        setTimeout(() => {
            mostrarToast(tipo,mensagem);
        },300);

        return;
    }

    clearTimeout(tempoToast);

    toast.className="toast";

    switch(tipo){

        case "sucesso":
            toast.classList.add("sucesso");
            toastIcon.className="bi bi-check-circle-fill";
        break;

        case "erro":
            toast.classList.add("erro");
            toastIcon.className="bi bi-x-circle-fill";
        break;

        case "aviso":
            toast.classList.add("aviso");
            toastIcon.className="bi bi-exclamation-triangle-fill";
        break;

        default:
            toast.classList.add("info");
            toastIcon.className="bi bi-info-circle-fill";
    }

    toastMensagem.textContent=mensagem;
    toast.classList.add("ativo");

    tempoToast=setTimeout(()=>{
        toast.classList.remove("ativo");
    },3500);
}
