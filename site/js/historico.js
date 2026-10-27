"use strict";
let paginaAtual = 0, filtrosAtuais = {}, buscando = false, visualizacao = 0, excluindo = false;
const nomesTipos = {contrato:"Contrato",recibo:"Recibo",orcamento:"Orçamento"};
const statusArquivo = document.getElementById("status");
async function carregar() {
  if (buscando) return;
  buscando = true;
  statusArquivo.textContent = "Carregando documentos…";
  const anterior = document.getElementById("anterior"), proxima = document.getElementById("proxima");
  anterior.disabled = proxima.disabled = true;
  try {
    let {documentos, total} = await Banco.listar(filtrosAtuais, paginaAtual);
    if (paginaAtual > 0 && !documentos.length) {
      paginaAtual = Math.max(0, Math.ceil(total / 20) - 1);
      ({documentos, total} = await Banco.listar(filtrosAtuais, paginaAtual));
    }
    const corpo = document.getElementById("documentos");corpo.replaceChildren();
    for (const doc of documentos) {
      const linha = document.createElement("tr");
      const data = doc.data_documento.split("-").reverse().join("/");
      for (const valor of [doc.cliente_nome, doc.empresa, nomesTipos[doc.tipo], data, Number(doc.valor).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})]) {
        const td = document.createElement("td");td.textContent = valor;linha.appendChild(td);
      }
      const acoes = document.createElement("td");
      const ver = document.createElement("button");ver.textContent = "Visualizar";ver.type = "button";
      ver.addEventListener("click",()=>visualizar(doc.id));acoes.appendChild(ver);
      if (Banco.permite("editar",doc)) {
        const editar = document.createElement("a");editar.textContent = "Editar";editar.className = "editar";
        editar.href = `${doc.tipo}.html?editar=${encodeURIComponent(doc.id)}&empresa=${doc.empresa}`;
        acoes.appendChild(editar);
      }
      if(Banco.permite("excluir",doc)){
        const excluir = document.createElement("button");excluir.type = "button";
        excluir.textContent = "Excluir";excluir.className = "excluir";
        excluir.addEventListener("click",()=>excluirDocumento(doc, excluir));acoes.appendChild(excluir);
      }
      linha.appendChild(acoes);corpo.appendChild(linha);
    }
    document.getElementById("quantidade").textContent = `${total} documento(s) encontrado(s)`;
    document.getElementById("pagina").textContent = `Página ${paginaAtual + 1} de ${Math.max(1,Math.ceil(total/20))}`;
    anterior.disabled = paginaAtual === 0;proxima.disabled = (paginaAtual + 1)*20 >= total;
    statusArquivo.textContent = total ? "" : "Nenhum documento encontrado. Salve um documento para ele aparecer aqui.";
  } catch (erro) {statusArquivo.textContent = erro.message;}
  finally {buscando = false;}
}
async function excluirDocumento(doc, botao) {
  if (excluindo || buscando || Banco.perfil?.perfil !== "admin") return;
  const confirmado = window.confirm(`Excluir ${nomesTipos[doc.tipo]} de ${doc.cliente_nome} (${doc.empresa})? Os dados e os PDFs associados serão apagados. Esta ação não pode ser desfeita.`);
  if (!confirmado) return;
  excluindo = true;botao.disabled = true;botao.textContent = "Excluindo…";
  try {
    const {pendente} = await Banco.excluir(doc.id, doc.versao);
    await carregar();
    statusArquivo.textContent = pendente
      ? "Documento excluído do banco. A remoção dos PDFs está pendente; use Tentar remover PDFs pendentes para concluir."
      : "Documento e PDFs associados excluídos.";
  } catch (erro) {statusArquivo.textContent = erro.message;}
  finally {excluindo = false;botao.disabled = false;botao.textContent = "Excluir";}
}
document.getElementById("limparPDFs").addEventListener("click",async()=>{
  const botao = document.getElementById("limparPDFs");
  botao.disabled = true;
  try {
    const quantidade = await Banco.limparPendentes();
    statusArquivo.textContent = quantidade < 0
      ? "Não foi possível consultar as remoções pendentes. Execute banco/atualizar-exclusao-admin.sql no Supabase."
      : quantidade ? "Alguns PDFs ainda não puderam ser removidos. Confira sua conexão e tente novamente."
      : "Lote de PDFs pendentes processado. Se houver mais de 20 tarefas, clique novamente para continuar.";
  }catch(erro){statusArquivo.textContent = erro.message;}
  finally {botao.disabled = false;}
});
async function visualizar(id) {
  const versaoVisual = ++visualizacao;
  const dialog = document.getElementById("visualizador");
  const estado = document.getElementById("pdfStatus"), frame = document.getElementById("pdfFrame"), link = document.getElementById("baixar");
  frame.removeAttribute("src");link.removeAttribute("href");link.hidden = true;
  document.getElementById("detalhes").replaceChildren();
  estado.textContent = "Carregando PDF…";dialog.showModal();
  try {
    const documento = await Banco.obter(id);
    const url = await Banco.linkPDF(documento.pdf_path);
    if (versaoVisual !== visualizacao || !dialog.open) return;
    document.getElementById("tituloPDF").textContent = `${nomesTipos[documento.tipo]} · ${documento.cliente_nome}`;
    frame.src = url;link.href = url;link.hidden = false;
    estado.textContent = `Versão ${documento.versao}. Se o PDF não aparecer abaixo, use o link para abrir ou baixar.`;
    for (const [chave, valor] of Object.entries(documento.dados)) {
      const linha = document.createElement("p");
      // Nunca executar o HTML armazenado no histórico.
      const texto = ["produto","referente"].includes(chave)
        ? new DOMParser().parseFromString(String(valor),"text/html").body.textContent : String(valor);
      linha.textContent = `${chave}: ${texto}`;document.getElementById("detalhes").appendChild(linha);
    }
  } catch (erro) {if (versaoVisual === visualizacao) estado.textContent = erro.message;}
}
document.getElementById("visualizador").addEventListener("close",()=>{visualizacao++;document.getElementById("pdfFrame").removeAttribute("src");});
document.getElementById("fechar").addEventListener("click",()=>document.getElementById("visualizador").close());
document.getElementById("filtros").addEventListener("submit",evento=>{
  evento.preventDefault();if(buscando)return;
  const novos = Object.fromEntries(["nome","empresa","tipo","inicio","fim"].map(id=>[id,document.getElementById(id).value.trim()]));
  if(novos.inicio && novos.fim && novos.inicio > novos.fim){statusArquivo.textContent="A data inicial deve ser anterior ou igual à final.";return;}
  filtrosAtuais=novos;paginaAtual=0;carregar();
});
document.getElementById("anterior").addEventListener("click",()=>{if(!buscando&&paginaAtual>0){paginaAtual--;carregar();}});
document.getElementById("proxima").addEventListener("click",()=>{if(!buscando){paginaAtual++;carregar();}});
document.getElementById("sair").addEventListener("click",async()=>{
  try{await Banco.sair();location.replace("login.html");}catch(erro){statusArquivo.textContent=erro.message;}
});
(async()=>{
  try {
    const perfil=await Banco.sessao();
    document.getElementById("conta").textContent=`${perfil.nome} · ${Banco.nomePerfil()}`;
    document.getElementById("arquivo").hidden=false;
    document.getElementById("limparPDFs").hidden = perfil.perfil !== "admin";
    for(const option of document.getElementById("empresa").options){if(option.value)option.hidden=!perfil.empresas.includes(option.value);}
    await carregar();
  }catch(erro){statusArquivo.textContent=erro.message;const link=document.createElement("a");link.href="login.html";link.textContent=" Entrar na conta";statusArquivo.appendChild(link);}
})();
