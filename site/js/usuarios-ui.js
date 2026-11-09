"use strict";
// Busca e filtro locais da página atual + abertura do painel de cadastro.
document.getElementById("buscarUsuarios").addEventListener("input",()=>{if(window.renderizarUsuarios)renderizarUsuarios()});
document.getElementById("filtrarPerfil").addEventListener("change",()=>{if(window.renderizarUsuarios)renderizarUsuarios()});

const painel=document.getElementById("createPanel");
const botaoAbrir=document.getElementById("openCreate");
let fecharTimer=null;
function abrirCadastro(){
  clearTimeout(fecharTimer);
  painel.hidden=false;
  requestAnimationFrame(()=>{
    painel.classList.add("is-open");
    painel.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
  });
  botaoAbrir.setAttribute("aria-expanded","true");
  document.getElementById("nome").focus({preventScroll:true});
}
function fecharCadastro(){
  painel.classList.remove("is-open");
  botaoAbrir.setAttribute("aria-expanded","false");
  const duracao=matchMedia("(prefers-reduced-motion: reduce)").matches?0:260;
  fecharTimer=setTimeout(()=>{painel.hidden=true;},duracao);
  botaoAbrir.focus();
}
botaoAbrir.addEventListener("click",()=>painel.hidden||!painel.classList.contains("is-open")?abrirCadastro():fecharCadastro());
document.getElementById("closeCreate").addEventListener("click",fecharCadastro);
document.querySelector("[data-fechar-cadastro]").addEventListener("click",fecharCadastro);
painel.addEventListener("keydown",evento=>{if(evento.key==="Escape"){evento.preventDefault();fecharCadastro();}});
