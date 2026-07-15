window.addEventListener("load",()=>{

    const loader = document.getElementById("loader");

    if(loader){

        setTimeout(()=>{
            loader.classList.add("esconder");
        },1000);

    }

});
