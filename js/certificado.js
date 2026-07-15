(function(){
    "use strict";
    const codigo = new URLSearchParams(location.search).get("codigo");
    const loading = document.getElementById("certificadoLoading");
    const errorBox = document.getElementById("certificadoError");
    const content = document.getElementById("certificadoContent");
    document.getElementById("imprimirCertificado")?.addEventListener("click",()=>window.print());
    async function init(){
        if(!codigo || !supabaseClient){ loading.hidden=true; errorBox.hidden=false; return; }
        const {data,error}=await supabaseClient.rpc("validar_certificado",{p_codigo:codigo});
        const item=Array.isArray(data)?data[0]:data;
        loading.hidden=true;
        if(error || !item){ errorBox.hidden=false; return; }
        document.getElementById("certificadoNome").textContent=item.participante;
        document.getElementById("certificadoEvento").textContent=item.evento;
        document.getElementById("certificadoData").textContent=window.BatataCore.formatarData(item.data_evento);
        document.getElementById("certificadoCodigo").textContent=codigo;
        document.getElementById("certificadoEmissao").textContent=new Date(item.emitted_at).toLocaleDateString("pt-BR");
        if(item.carga_horaria){ document.getElementById("certificadoCarga").textContent=`${item.carga_horaria} hora(s)`; }
        else document.getElementById("certificadoCargaWrap").hidden=true;
        content.hidden=false;
        document.title=`Certificado de ${item.participante} | BatataCore`;
    }
    init();
})();
