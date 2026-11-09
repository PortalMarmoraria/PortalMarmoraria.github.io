"use strict";
const idAlvo=new URLSearchParams(location.search).get("id");
const msg=document.getElementById("detailStatus"), painel=document.getElementById("detailSection"), aviso=document.getElementById("detailMessage");
let usuario=null,emOperacao=false;
const nomes={admin:"Administrador",colaborador:"Colaborador",comercial:"Comercial",financeiro:"Financeiro"};
const by=id=>document.getElementById(id);
function informar(texto){aviso.textContent=texto;}
function desenhar(u){
 usuario=u;
 const papel=u.principal?"Administrador principal":(nomes[u.perfil]||u.perfil||"Sem perfil");
 for(const [id,v] of Object.entries({detailName:u.nome,detailEmailTop:u.email,infoName:u.nome,infoEmail:u.email,infoRole:papel,infoStatus:u.ativo?"Ativo":"Inativo",infoMS:(u.empresas||[]).includes("MS")?"Autorizada":"Sem acesso",infoJD:(u.empresas||[]).includes("JD")?"Autorizada":"Sem acesso"}))by(id).textContent=v||"—";
 by("detailAvatar").textContent=((u.nome||"U").trim()[0]||"U").toUpperCase();
 // Apresentação visual dos mesmos dados (sem informações adicionais).
 by("heroRole").textContent=papel;by("heroRole").classList.toggle("is-principal",!!u.principal);
 by("heroStatus").textContent=u.ativo?"Ativo":"Inativo";by("heroStatus").className="state-pill "+(u.ativo?"is-active":"is-inactive");
 for(const id of ["infoMS","infoJD"])by(id).className=by(id).textContent==="Autorizada"?"access-yes":"access-no";
 by("dNome").value=u.nome||"";by("dEmail").value=u.email||"";by("dPerfil").value=u.perfil||"colaborador";
 by("dMS").checked=(u.empresas||[]).includes("MS");by("dJD").checked=(u.empresas||[]).includes("JD");
 for(const el of [by("dPerfil"),by("dMS"),by("dJD")])el.disabled=!!u.principal;
 by("detailDelete").disabled=!!u.principal;
 painel.hidden=false;msg.textContent="";
}
async function obterUsuario(){
 if(!idAlvo || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(idAlvo))throw new Error("Identificador da conta inválido.");
 for(let pagina=1;pagina<=100;pagina++){
   const resposta=await GestaoUsuarios.chamar({acao:"listar",pagina});
   const u=(resposta.usuarios||[]).find(v=>v.id===idAlvo);
   if(u)return u;
   if(!resposta.temProxima)break;
 }
 throw new Error("Conta não encontrada na lista autorizada.");
}
async function atualizar(){desenhar(await obterUsuario());}
async function executar(fn){if(emOperacao)return;emOperacao=true;document.querySelectorAll("button").forEach(b=>b.disabled=true);informar("Processando…");try{await fn();}catch(e){informar(e.message||"Não foi possível concluir.");}finally{emOperacao=false;document.querySelectorAll("button").forEach(b=>b.disabled=false);if(usuario?.principal)by("detailDelete").disabled=true;}}
function alternarCard(mostrar,ocultar,botao,outro){
 by(mostrar).hidden=!by(mostrar).hidden;by(ocultar).hidden=true;
 by(botao).setAttribute("aria-expanded",String(!by(mostrar).hidden));by(outro).setAttribute("aria-expanded","false");
 if(!by(mostrar).hidden)by(mostrar).querySelector("input")?.focus();
}
by("showEdit").addEventListener("click",()=>alternarCard("editCard","passwordCard","showEdit","showPassword"));
by("showPassword").addEventListener("click",()=>alternarCard("passwordCard","editCard","showPassword","showEdit"));
by("detailEdit").addEventListener("submit",e=>{e.preventDefault();executar(async()=>{
 const empresas=[by("dMS"),by("dJD")].filter(el=>el.checked).map(el=>el.value);if(!empresas.length)throw new Error("Selecione pelo menos uma empresa.");
 const r=await GestaoUsuarios.chamar({acao:"editar",id:usuario.id,nome:by("dNome").value.trim(),email:by("dEmail").value.trim(),perfil:by("dPerfil").value,empresas});
 informar("Alterações salvas.");await atualizar();by("editCard").hidden=true;by("showEdit").setAttribute("aria-expanded","false");
 if(r.propriaConta&&r.emailAlterado){await Banco.sair();location.replace("login.html");}
})});
by("detailPassword").addEventListener("submit",e=>{e.preventDefault();executar(async()=>{
 const senha=by("dSenha").value;if(senha!==by("dConfirmar").value)throw new Error("As senhas precisam ser iguais.");
 const r=await GestaoUsuarios.chamar({acao:"redefinir",id:usuario.id,senha});by("detailPassword").reset();by("passwordCard").hidden=true;by("showPassword").setAttribute("aria-expanded","false");informar("Senha redefinida.");
 if(r.propriaConta){await Banco.sair();location.replace("login.html");}
})});
by("detailDelete").addEventListener("click",async()=>{if(!usuario||usuario.principal||emOperacao)return;
 if(!(await UI.confirmar({titulo:"Excluir conta?",mensagem:`Excluir definitivamente a conta ${usuario.email}? Os documentos serão preservados. Esta ação não pode ser desfeita.`,confirmar:"Excluir conta",perigo:true})))return;
 executar(async()=>{await GestaoUsuarios.chamar({acao:"excluir",id:usuario.id,confirmacao:usuario.id});location.replace("usuarios.html")});
});
(async()=>{try{const p=await Banco.sessao();if(!p.principal)throw new Error("Acesso exclusivo do administrador principal.");const a=await GestaoUsuarios.chamar({acao:"verificar"});if(!a.autorizado)throw new Error("Acesso administrativo não autorizado.");await atualizar();}catch(e){msg.textContent=e.message}})();
