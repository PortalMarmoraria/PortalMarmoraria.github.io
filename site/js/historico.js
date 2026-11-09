"use strict";
let paginaAtual = 0, filtrosAtuais = {}, buscando = false, visualizacao = 0, excluindo = false;
let docsPagina = [], documentoSelecionadoId = null, documentoSelecionado = null, previewUrlAtual = "";
const nomesTipos = {contrato:"Contrato",recibo:"Recibo",orcamento:"Orçamento"};
const statusArquivo = document.getElementById("status");

// Rótulos legíveis para os campos salvos em documentos.dados.
// Campos sem rótulo conhecido continuam visíveis com o nome original.
const rotulosCampos = {
  nome:"Cliente", tipoId:"Tipo de documento", cpfCnpj:"CPF/CNPJ", endereco:"Endereço", cep:"CEP",
  produto:"Produto/serviço", referente:"Referente a", valor:"Valor", valorextenso:"Valor por extenso",
  pagamento:"Forma de pagamento", formaPagamento:"Forma de pagamento", statusPagamento:"Status do pagamento",
  prazo:"Prazo de entrega", validade:"Validade", dataano:"Data do documento", data:"Data de emissão"
};
function rotuloCampo(chave){return rotulosCampos[chave] || chave.replaceAll("_"," ");}
function textoCampo(chave, valorRaw){
  return ["produto","referente"].includes(chave)
    ? (new DOMParser().parseFromString(String(valorRaw ?? ""),"text/html").body.textContent || "").trim()
    : String(valorRaw ?? "").trim();
}

function formatarData(valor){return valor ? valor.split("-").reverse().join("/") : "—";}
function formatarMoeda(valor){return Number(valor || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}

// ---------- Painel de detalhes em telas menores ----------
const telaCompacta = window.matchMedia("(max-width: 1279px)");
const painel = document.getElementById("painelDetalhes");
let origemFoco = null;
function sincronizarPainel(){painel.inert = telaCompacta.matches && !document.body.classList.contains("detail-open");}
function abrirPainelCompacto(){
  if(!telaCompacta.matches) return;
  origemFoco = document.activeElement;
  document.body.classList.add("detail-open");
  sincronizarPainel();
  requestAnimationFrame(()=>document.getElementById("fecharDetalhes").focus());
}
function fecharPainelCompacto(){
  if(!document.body.classList.contains("detail-open")) return;
  document.body.classList.remove("detail-open");
  sincronizarPainel();
  origemFoco?.focus?.();
}
document.getElementById("fecharDetalhes").addEventListener("click", fecharPainelCompacto);
document.getElementById("detailBackdrop").addEventListener("click", fecharPainelCompacto);
document.addEventListener("keydown", evento=>{
  if(evento.key === "Escape" && document.body.classList.contains("detail-open") && !document.getElementById("visualizador").open){
    evento.preventDefault(); fecharPainelCompacto();
  }
});
telaCompacta.addEventListener?.("change", ()=>{ if(!telaCompacta.matches) document.body.classList.remove("detail-open"); sincronizarPainel(); });
sincronizarPainel();

function limparPreview(){
  previewUrlAtual = "";
  const frame = document.getElementById("previewFrame");
  frame.removeAttribute("src");
  frame.classList.add("hidden");
  const linkNovaAba=document.getElementById("abrirNovaAba");
  linkNovaAba.removeAttribute("href");
  linkNovaAba.setAttribute("aria-disabled","true");
}
function preencherCampos(dados, carregando = true){
  const lista = document.getElementById("detailList");
  lista.replaceChildren();
  for(const [chave, valorRaw] of Object.entries(dados || {})){
    const texto = textoCampo(chave, valorRaw);
    if(!texto) continue; // Campos vazios não são exibidos como se fossem dados.
    const item = document.createElement("div");
    item.className = "detail-item";
    const nome = document.createElement("span");
    nome.textContent = rotuloCampo(chave);
    const valor = document.createElement("span");
    valor.textContent = texto.length > 160 ? `${texto.slice(0,157)}...` : texto;
    if(texto.length > 160) valor.title = texto;
    item.append(nome, valor);
    lista.appendChild(item);
  }
  if(!lista.children.length){
    const vazio = document.createElement("p");
    vazio.className = "muted"; vazio.style.margin = "0"; vazio.style.fontSize = "13px";
    vazio.textContent = carregando ? "Carregando os dados do documento…" : "Nenhum dado adicional registrado.";
    lista.append(vazio);
  }
}
function atualizarPainelDetalhes(doc){
  const mudou = !documentoSelecionado || !doc || documentoSelecionado.id !== doc.id;
  documentoSelecionado = doc || null;
  const empty = document.getElementById("detailEmpty");
  const content = document.getElementById("detailContent");
  const pill = document.getElementById("pillSelecionado");
  const editar = document.getElementById("editarSelecionado");
  const excluir = document.getElementById("excluirSelecionado");
  limparPreview();

  if(!doc){
    empty.classList.remove("hidden");
    content.classList.add("hidden");
    pill.classList.add("hidden");
    editar.classList.add("hidden");
    excluir.classList.add("hidden");
    return;
  }
  empty.classList.add("hidden");
  content.classList.remove("hidden");
  if(mudou){content.classList.remove("is-entering");void content.offsetWidth;content.classList.add("is-entering");}
  pill.classList.remove("hidden");
  document.getElementById("detailCliente").textContent = doc.cliente_nome || "Documento sem cliente";
  document.getElementById("detailSub").textContent = `${nomesTipos[doc.tipo] || "Documento"} · ${doc.empresa} Marmoraria`;
  document.getElementById("detailTipo").textContent = nomesTipos[doc.tipo] || doc.tipo;
  document.getElementById("detailEmpresa").textContent = doc.empresa;
  document.getElementById("detailData").textContent = formatarData(doc.data_documento);
  document.getElementById("detailVersao").textContent = `v${doc.versao}`;
  document.getElementById("detailValor").textContent = formatarMoeda(doc.valor);

  preencherCampos(doc.dados);

  const podeEditar = Banco.permite("editar", doc);
  const podeExcluir = Banco.permite("excluir", doc);
  editar.classList.toggle("hidden", !podeEditar);
  excluir.classList.toggle("hidden", !podeExcluir);
  editar.href = `${doc.tipo}.html?editar=${encodeURIComponent(doc.id)}&empresa=${doc.empresa}`;

  carregarDetalhes(doc).catch(()=>{});
}
async function carregarDetalhes(doc){
  try {
    const detalhe = await Banco.obter(doc.id);
    if(documentoSelecionadoId !== doc.id) return;
    // O endpoint de listagem não contém dados e pdf_path.
    // Busca o documento completo apenas quando for selecionado.
    atualizarPainelDetalhesCompleto(detalhe);
    await carregarPreview(detalhe);
  }catch(erro){
    if(documentoSelecionadoId === doc.id){
      statusArquivo.textContent = erro.message || "Não foi possível carregar os detalhes do documento.";
    }
  }
}
function atualizarPainelDetalhesCompleto(detalhe){
  documentoSelecionado = detalhe;
  preencherCampos(detalhe.dados, false);
}
async function carregarPreview(doc){
  try{
    const url = await Banco.linkPDF(doc.pdf_path);
    if(documentoSelecionadoId !== doc.id) return;
    previewUrlAtual = url;
    const frame = document.getElementById("previewFrame");
    frame.src = url;
    frame.classList.remove("hidden");
    document.getElementById("abrirNovaAba").href = url;
    document.getElementById("abrirNovaAba").removeAttribute("aria-disabled");
  }catch(erro){
    if(documentoSelecionado && documentoSelecionado.id === doc.id){
      statusArquivo.textContent = erro.message;
    }
  }
}
function marcarSelecionadoNaTabela(){
  document.querySelectorAll("#documentos .history-row").forEach(row=>{
    const ativo = row.dataset.id === documentoSelecionadoId;
    row.classList.toggle("active", ativo);
    if(ativo) row.setAttribute("aria-current","true"); else row.removeAttribute("aria-current");
  });
}
function selecionarDocumento(id){
  documentoSelecionadoId = id;
  const doc = docsPagina.find(item => item.id === id) || null;
  atualizarPainelDetalhes(doc);
  marcarSelecionadoNaTabela();
}
function linhaVazia(titulo, texto){
  const linha = document.createElement("tr");
  linha.className = "table-empty";
  const td = document.createElement("td");
  td.colSpan = 6;
  const box = document.createElement("div"); box.className = "empty-state";
  const forte = document.createElement("strong"); forte.textContent = titulo;
  const p = document.createElement("p"); p.textContent = texto;
  box.append(forte, p); td.append(box); linha.append(td);
  return linha;
}

async function carregar() {
  if (buscando) return;
  buscando = true;
  const painelTabela = document.querySelector(".table-panel");
  painelTabela.setAttribute("aria-busy","true");
  statusArquivo.textContent = "Carregando documentos…";
  const anterior = document.getElementById("anterior"), proxima = document.getElementById("proxima");
  anterior.disabled = proxima.disabled = true;
  try {
    let {documentos, total} = await Banco.listar(filtrosAtuais, paginaAtual);
    if (paginaAtual > 0 && !documentos.length) {
      paginaAtual = Math.max(0, Math.ceil(total / 20) - 1);
      ({documentos, total} = await Banco.listar(filtrosAtuais, paginaAtual));
    }
    docsPagina = documentos;
    const corpo = document.getElementById("documentos");
    corpo.replaceChildren();
    if(!documentos.length){
      const filtrando = Object.values(filtrosAtuais).some(Boolean);
      corpo.appendChild(filtrando
        ? linhaVazia("Nenhum documento encontrado", "Nenhum registro corresponde aos filtros. Ajuste a busca ou limpe os campos e tente novamente.")
        : linhaVazia("Nenhum documento salvo ainda", "Crie um contrato, recibo ou orçamento. Ao gerar o documento, ele é salvo e aparece aqui."));
      documentoSelecionadoId = null;
      atualizarPainelDetalhes(null);
    }
    for (const doc of documentos) {
      const linha = document.createElement("tr");
      linha.className = "history-row";
      linha.dataset.id = doc.id;
      linha.tabIndex = 0;
      linha.setAttribute("aria-label", `${nomesTipos[doc.tipo] || "Documento"} de ${doc.cliente_nome || "cliente sem nome"}, ${doc.empresa}, ${formatarMoeda(doc.valor)}`);

      const tdCliente = document.createElement("td");
      tdCliente.className = "cell-strong"; tdCliente.dataset.label = "Cliente";
      tdCliente.textContent = doc.cliente_nome || "—";

      const tdTipo = document.createElement("td"); tdTipo.dataset.label = "Documento";
      const tipo = document.createElement("span");
      tipo.className = `type-badge ${["contrato","recibo","orcamento"].includes(doc.tipo)?doc.tipo:""}`;
      tipo.textContent = nomesTipos[doc.tipo] || doc.tipo || "—";
      tdTipo.append(tipo);

      const tdEmpresa = document.createElement("td"); tdEmpresa.dataset.label = "Empresa";
      const empresa = document.createElement("span");
      empresa.className = `company-badge ${["MS","JD"].includes(doc.empresa)?doc.empresa.toLowerCase():""}`;
      empresa.textContent = doc.empresa || "—";
      tdEmpresa.append(empresa);

      const tdData = document.createElement("td"); tdData.dataset.label = "Data"; tdData.className = "num";
      tdData.textContent = formatarData(doc.data_documento);

      const tdValor = document.createElement("td"); tdValor.dataset.label = "Valor"; tdValor.className = "is-num";
      tdValor.textContent = formatarMoeda(doc.valor);

      const tdVersao = document.createElement("td"); tdVersao.dataset.label = "Versão"; tdVersao.className = "is-num small-muted";
      tdVersao.textContent = `v${doc.versao}`;

      linha.append(tdCliente, tdTipo, tdEmpresa, tdData, tdValor, tdVersao);
      const escolher = ()=>{selecionarDocumento(doc.id);abrirPainelCompacto();};
      linha.addEventListener("click", escolher);
      linha.addEventListener("keydown", evento=>{
        if(evento.key === "Enter" || evento.key === " "){evento.preventDefault();escolher();}
        else if(evento.key === "ArrowDown"){evento.preventDefault();linha.nextElementSibling?.focus();}
        else if(evento.key === "ArrowUp"){evento.preventDefault();linha.previousElementSibling?.focus();}
      });
      corpo.appendChild(linha);
    }
    document.getElementById("quantidade").textContent = total === 1 ? "1 documento encontrado" : `${total} documentos encontrados`;
    document.getElementById("pagina").textContent = `Página ${paginaAtual + 1} de ${Math.max(1,Math.ceil(total/20))}`;
    anterior.disabled = paginaAtual === 0;proxima.disabled = (paginaAtual + 1)*20 >= total;
    statusArquivo.textContent = "";

    const existeSelecionado = documentos.some(doc => doc.id === documentoSelecionadoId);
    if(documentos.length){
      selecionarDocumento(existeSelecionado ? documentoSelecionadoId : documentos[0].id);
    }
  } catch (erro) {statusArquivo.textContent = erro.message;}
  finally {buscando = false;painelTabela.setAttribute("aria-busy","false");}
}
async function excluirDocumento(doc, botao) {
  if (excluindo || buscando || Banco.perfil?.perfil !== "admin") return;
  const confirmado = await UI.confirmar({
    titulo: "Excluir documento?",
    mensagem: `Excluir ${nomesTipos[doc.tipo]} de ${doc.cliente_nome} (${doc.empresa})? Os dados e os PDFs associados serão apagados. Esta ação não pode ser desfeita.`,
    confirmar: "Excluir documento", perigo: true
  });
  if (!confirmado) return;
  excluindo = true;botao.disabled = true;botao.textContent = "Excluindo…";
  try {
    const {pendente} = await Banco.excluir(doc.id, doc.versao);
    await carregar();
    statusArquivo.textContent = pendente
      ? "Documento excluído do banco. A remoção dos PDFs está pendente; use Tentar remover PDFs pendentes para concluir."
      : "Documento e PDFs associados excluídos.";
  } catch (erro) {statusArquivo.textContent = erro.message;}
  finally {excluindo = false;botao.disabled = false;botao.textContent = "Excluir documento";}
}
document.getElementById("limparPDFs").addEventListener("click",async()=>{
  const botao = document.getElementById("limparPDFs");
  botao.disabled = true;botao.classList.add("is-loading");
  try {
    const quantidade = await Banco.limparPendentes();
    statusArquivo.textContent = quantidade < 0
      ? "Não foi possível consultar as remoções pendentes. Execute banco/atualizar-exclusao-admin.sql no Supabase."
      : quantidade ? "Alguns PDFs ainda não puderam ser removidos. Confira sua conexão e tente novamente."
      : "Lote de PDFs pendentes processado. Se houver mais de 20 tarefas, clique novamente para continuar.";
  }catch(erro){statusArquivo.textContent = erro.message;}
  finally {botao.disabled = false;botao.classList.remove("is-loading");}
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
    const url = previewUrlAtual && documentoSelecionado && documentoSelecionado.id === id ? previewUrlAtual : await Banco.linkPDF(documento.pdf_path);
    if (versaoVisual !== visualizacao || !dialog.open) return;
    document.getElementById("tituloPDF").textContent = `${nomesTipos[documento.tipo]} · ${documento.cliente_nome}`;
    frame.src = url;link.href = url;link.hidden = false;
    estado.textContent = `Versão ${documento.versao}. Se o PDF não aparecer abaixo, use o botão para abrir ou baixar.`;
    for (const [chave, valor] of Object.entries(documento.dados || {})) {
      const texto = textoCampo(chave, valor);
      if (!texto) continue;
      const linha = document.createElement("p");
      const rotulo = document.createElement("strong");
      rotulo.textContent = `${rotuloCampo(chave)}: `;
      linha.append(rotulo, document.createTextNode(texto));
      document.getElementById("detalhes").appendChild(linha);
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
document.getElementById("abrirVisualizacao").addEventListener("click",()=>{
  if(documentoSelecionado) visualizar(documentoSelecionado.id);
});
document.getElementById("excluirSelecionado").addEventListener("click",()=>{
  if(documentoSelecionado) excluirDocumento(documentoSelecionado, document.getElementById("excluirSelecionado"));
});
(async()=>{
  try {
    const perfil=await Banco.sessao();
    document.getElementById("conta").textContent=`${perfil.nome} · ${Banco.nomePerfil()}`;
    document.getElementById("arquivo").hidden=false;
    document.getElementById("limparPDFs").hidden = perfil.perfil !== "admin";
    document.getElementById("navUsuarios").hidden = !perfil.principal;
    for(const option of document.getElementById("empresa").options){if(option.value)option.hidden=!perfil.empresas.includes(option.value);}
    await carregar();
  }catch(erro){
    document.getElementById("conta").textContent="Entre na sua conta para consultar os documentos.";
    statusArquivo.textContent=erro.message;
    const link=document.createElement("a");link.href="login.html";link.textContent=" Entrar na conta";statusArquivo.appendChild(link);
  }
})();
