"use strict";
// A proteção dos dados continua nas políticas do Supabase.
// Este guard controla a navegação e evita exibir páginas antes da validação.
const origemGuard = document.currentScript.src;
(async () => {
  try {
    await Banco.sessao();
    for(const card of document.querySelectorAll("a.empresa")){
      const href=new URL(card.href,location.href);
      const empresa=href.searchParams.get("empresa");
      if(empresa){card.hidden=!Banco.perfil.empresas.includes(empresa);continue;}
      const tipo=href.pathname.split("/").pop().replace(".html","");
      if(["contrato","recibo","orcamento"].includes(tipo)){
        const escolhida=new URLSearchParams(location.search).get("empresa") || localStorage.getItem("empresaSelecionada");
        card.hidden=!Banco.permite("criar",{empresa:escolhida,tipo});
        href.searchParams.set("empresa",escolhida);card.href=href.href;
      }
    }
    if(location.pathname.endsWith("/tipo.html")){
      const empresa=new URLSearchParams(location.search).get("empresa") || localStorage.getItem("empresaSelecionada");
      if(!Banco.perfil.empresas.includes(empresa)){location.replace(new URL("../../index.html",origemGuard).href);return;}
    }
    document.documentElement.classList.remove("auth-pending");
  } catch {
    location.replace(new URL("../login.html", origemGuard).href);
  }
})();
