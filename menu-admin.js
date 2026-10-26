"use strict";
const scriptMenu=document.currentScript.src;
(async()=>{
  try{
    const perfil=await Banco.sessao();
    if(!perfil.principal)return;
    const acesso=await GestaoUsuarios.chamar({acao:"verificar"});
    if(!acesso.autorizado)return;
    const link=document.createElement("a");link.href=new URL("../usuarios.html",scriptMenu).href;
    link.textContent="Gerenciar usuários";link.className="header-note";
    document.querySelector(".site-header").appendChild(link);
  }catch{}
})();
