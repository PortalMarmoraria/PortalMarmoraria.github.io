"use strict";
let paginaUsuarios=1,ocupado=false,alvo=null,pronto=false,alterandoSenha=false;
const statusUsuarios=document.getElementById("status");
const dialogSenha=document.getElementById("redefinir");
const erroSenha=document.getElementById("statusSenha");
function bloquear(valor){
  ocupado=valor;
  document.getElementById("gestao").inert=valor;
}
async function carregarUsuarios(){
  const resposta=await GestaoUsuarios.chamar({acao:"listar",pagina:paginaUsuarios});
  const corpo=document.getElementById("usuarios");corpo.replaceChildren();
  for(const usuario of resposta.usuarios){
    const linha=document.createElement("tr");
    for(const valor of [usuario.nome,usuario.email,usuario.principal?"Admin principal":Banco.nomesPerfis[usuario.perfil] || "Sem acesso ao portal",usuario.empresas?.join(" / ") || "Sem empresa",usuario.ativo?"Ativo":"Sem acesso"]){
      const celula=document.createElement("td");celula.textContent=valor;linha.appendChild(celula);
    }
    const celula=document.createElement("td"),botao=document.createElement("button");
    botao.type="button";botao.textContent="Redefinir senha";
    botao.addEventListener("click",()=>{
      if(ocupado)return;
      alvo=usuario;document.getElementById("formRedefinir").reset();erroSenha.textContent="";
      document.getElementById("usuarioAlvo").textContent=`Conta: ${usuario.email}. Informe a nova senha e confirme para substituir a atual.`;
      dialogSenha.showModal();document.getElementById("novaSenha").focus();
    });celula.appendChild(botao);
    const editar=document.createElement("button");editar.type="button";editar.textContent="Editar";
    editar.addEventListener("click",()=>abrirEdicao(usuario));celula.appendChild(editar);
    const excluir=document.createElement("button");excluir.type="button";excluir.textContent="Excluir";excluir.disabled=usuario.principal;
    excluir.title=usuario.principal?"A conta principal não pode ser excluída":"Excluir conta";
    excluir.addEventListener("click",()=>excluirUsuario(usuario));celula.appendChild(excluir);
    linha.appendChild(celula);corpo.appendChild(linha);
  }
  document.getElementById("pagina").textContent=`Página ${paginaUsuarios}`;
  document.getElementById("anterior").disabled=paginaUsuarios===1;
  document.getElementById("proxima").disabled=!resposta.temProxima;
}
async function atualizar(){
  if(ocupado || !pronto)return;
  bloquear(true);statusUsuarios.textContent="Carregando usuários…";
  try{await carregarUsuarios();statusUsuarios.textContent="";}
  catch(erro){statusUsuarios.textContent=erro.message;}
  finally{bloquear(false);}
}
document.getElementById("criarUsuario").addEventListener("submit",async evento=>{
  evento.preventDefault();if(ocupado || !pronto)return;
  const senha=document.getElementById("senha"),confirmacao=document.getElementById("confirmarSenha");
  if(senha.value!==confirmacao.value){statusUsuarios.textContent="As senhas precisam ser iguais.";return;}
  if(!empresasSelecionadas("criarEmpresas").length){statusUsuarios.textContent="Selecione pelo menos uma empresa.";return;}
  bloquear(true);statusUsuarios.textContent="Criando usuário…";
  try{
    await GestaoUsuarios.chamar({acao:"criar",nome:document.getElementById("nome").value.trim(),email:document.getElementById("email").value.trim(),senha:senha.value,perfil:document.getElementById("perfilNovo").value,empresas:empresasSelecionadas("criarEmpresas")});
    document.getElementById("criarUsuario").reset();paginaUsuarios=1;
    statusUsuarios.textContent="Usuário criado com o perfil escolhido. Ele já pode entrar com o e-mail e a senha definidos.";
    try{await carregarUsuarios();}catch{statusUsuarios.textContent+=" A lista não atualizou. Use Atualizar lista antes de repetir o cadastro.";}
  }catch(erro){statusUsuarios.textContent=erro.message;}
  finally{senha.value="";confirmacao.value="";bloquear(false);}
});
document.getElementById("formRedefinir").addEventListener("submit",async evento=>{
  evento.preventDefault();if(ocupado || !pronto || !alvo)return;
  const senha=document.getElementById("novaSenha"),confirmacao=document.getElementById("confirmarNova");
  if(senha.value!==confirmacao.value){erroSenha.textContent="As senhas precisam ser iguais.";return;}
  const id=alvo.id;bloquear(true);alterandoSenha=true;
  document.getElementById("salvarSenha").disabled=true;document.getElementById("cancelar").disabled=true;
  erroSenha.textContent="Redefinindo senha…";
  try{
    const resultado=await GestaoUsuarios.chamar({acao:"redefinir",id,senha:senha.value});
    dialogSenha.close();statusUsuarios.textContent="Senha redefinida. A conta, o perfil e os documentos foram preservados.";
    if(resultado.propriaConta){
      statusUsuarios.textContent="Sua senha foi redefinida. Entre novamente com a nova senha.";
      try{await Banco.sair();location.replace("login.html");}catch{statusUsuarios.textContent+=" Abra o login para entrar novamente.";}
    }
  }catch(erro){erroSenha.textContent=erro.message;}
  finally{senha.value="";confirmacao.value="";alterandoSenha=false;document.getElementById("salvarSenha").disabled=false;document.getElementById("cancelar").disabled=false;bloquear(false);}
});
dialogSenha.addEventListener("cancel",evento=>{if(alterandoSenha)evento.preventDefault();});
dialogSenha.addEventListener("close",()=>{document.getElementById("formRedefinir").reset();alvo=null;});
document.getElementById("cancelar").addEventListener("click",()=>dialogSenha.close());
document.getElementById("atualizar").addEventListener("click",atualizar);
document.getElementById("anterior").addEventListener("click",()=>{if(!ocupado&&paginaUsuarios>1){paginaUsuarios--;atualizar();}});
document.getElementById("proxima").addEventListener("click",()=>{if(!ocupado){paginaUsuarios++;atualizar();}});
(async()=>{
  try{
    const perfil=await Banco.sessao();
    if(!perfil.principal)throw new Error("Esta página é exclusiva do administrador principal.");
    const acesso=await GestaoUsuarios.chamar({acao:"verificar"});
    if(!acesso.autorizado)throw new Error("Acesso não autorizado.");
    pronto=true;document.getElementById("gestao").hidden=false;await atualizar();
  }catch(erro){statusUsuarios.textContent=erro.message;}
})();

let alvoEdicao=null;
const dialogEditar=document.getElementById("editarUsuario");
function abrirEdicao(usuario){
  if(ocupado)return;alvoEdicao=usuario;
  document.getElementById("editarNome").value=usuario.nome;
  document.getElementById("editarEmail").value=usuario.email;
  document.getElementById("editarPerfil").value=Banco.nomesPerfis[usuario.perfil]?usuario.perfil:"colaborador";
  document.getElementById("editarPerfil").disabled=usuario.principal;
  for(const campo of document.querySelectorAll('#editarEmpresas input')){campo.checked=(usuario.empresas || []).includes(campo.value);campo.disabled=usuario.principal;}
  document.getElementById("erroEditar").textContent="";dialogEditar.showModal();
}
dialogEditar.addEventListener("cancel",e=>{if(ocupado)e.preventDefault();});
document.getElementById("cancelarEdicao").addEventListener("click",()=>{if(!ocupado)dialogEditar.close();});
document.getElementById("formEditar").addEventListener("submit",async e=>{
  e.preventDefault();if(ocupado||!alvoEdicao)return;
  if(!empresasSelecionadas("editarEmpresas").length){document.getElementById("erroEditar").textContent="Selecione pelo menos uma empresa.";return;}
  bloquear(true);for(const b of dialogEditar.querySelectorAll("button"))b.disabled=true;
  const mensagem=document.getElementById("erroEditar");mensagem.textContent="Salvando…";
  try{
    const r=await GestaoUsuarios.chamar({acao:"editar",id:alvoEdicao.id,nome:document.getElementById("editarNome").value,email:document.getElementById("editarEmail").value,perfil:document.getElementById("editarPerfil").value,empresas:empresasSelecionadas("editarEmpresas")});
    dialogEditar.close();statusUsuarios.textContent="Usuário atualizado.";
    if(r.propriaConta&&r.emailAlterado){statusUsuarios.textContent="Seu e-mail mudou. Entre novamente com o novo endereço.";await Banco.sair();location.replace("login.html");return;}
    try{await carregarUsuarios();}catch{statusUsuarios.textContent+=" Clique em Atualizar lista para conferir.";}
  }catch(erro){mensagem.textContent=erro.message;}
  finally{bloquear(false);for(const b of dialogEditar.querySelectorAll("button"))b.disabled=false;}
});
async function excluirUsuario(usuario){
  if(ocupado||usuario.principal)return;
  if(!confirm(`Excluir definitivamente a conta ${usuario.email}? Os documentos serão preservados. Esta ação não pode ser desfeita.`))return;
  bloquear(true);statusUsuarios.textContent="Excluindo usuário…";
  try{await GestaoUsuarios.chamar({acao:"excluir",id:usuario.id,confirmacao:usuario.id});statusUsuarios.textContent="Conta excluída. Documentos preservados.";
    try{await carregarUsuarios();}catch{statusUsuarios.textContent+=" Clique em Atualizar lista para conferir.";}
  }catch(erro){statusUsuarios.textContent=erro.message;}
  finally{bloquear(false);}
}

function empresasSelecionadas(id){return Array.from(document.querySelectorAll(`#${id} input:checked`),campo=>campo.value);}
