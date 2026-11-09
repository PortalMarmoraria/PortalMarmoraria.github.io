"use strict";
// Página inicial: saudação, empresas autorizadas, permissões reais e prévia do histórico.
// Os dados vêm de Banco.sessao() e Banco.listar(); nada é estimado ou inventado.
const TIPOS_DOC = [["contrato", "Contrato"], ["recibo", "Recibo"], ["orcamento", "Orçamento"]];

function inicialAvatar(nome){
  const texto = String(nome || "U").trim();
  return (texto[0] || "U").toUpperCase();
}
function primeiroNome(nome){
  return String(nome || "").trim().split(/\s+/)[0] || "";
}
function listarTexto(itens){
  if(itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

(async()=>{
  try{
    const perfil = await Banco.sessao();
    carregarPreviaHistorico();
    const nome = perfil.nome || "Usuário";
    const avatar = inicialAvatar(nome);
    const primeiro = primeiroNome(nome);
    document.getElementById("welcomeName").textContent = primeiro ? `Olá, ${primeiro}` : "Olá";
    document.getElementById("profileName").textContent = nome;
    document.getElementById("profileRoleCard").textContent = Banco.nomePerfil();
    document.getElementById("profileAvatar").textContent = avatar;

    const empresas = Array.isArray(perfil.empresas) ? perfil.empresas.filter(e => ["MS","JD"].includes(e)) : [];

    // Empresas liberadas (chips)
    const liberadas = document.getElementById("empresasLiberadas");
    liberadas.replaceChildren();
    if(empresas.length){
      for(const empresa of empresas){
        const chip = document.createElement("span");
        chip.className = `company-badge ${empresa.toLowerCase()}`;
        chip.textContent = empresa;
        liberadas.append(chip);
      }
    }else liberadas.textContent = "Nenhuma";

    // Tipos de documento que o perfil pode criar (mesma regra usada no salvamento)
    const podeCriar = empresa => TIPOS_DOC.filter(([tipo]) => Banco.permite("criar", {empresa, tipo})).map(([, rotulo]) => rotulo);
    const tiposGerais = empresas.length ? podeCriar(empresas[0]) : [];
    document.getElementById("podeCriar").textContent = tiposGerais.length ? listarTexto(tiposGerais) : "Nenhum documento";

    for(const empresa of ["MS","JD"]){
      const alvo = document.getElementById(`docs${empresa}`);
      if(!alvo) continue;
      const tipos = empresas.includes(empresa) ? podeCriar(empresa) : [];
      alvo.textContent = tipos.length ? `Disponível: ${listarTexto(tipos)}` : "Seu perfil não cria documentos nesta empresa";
    }

    const visiveis = ["MS","JD"].filter(e => empresas.includes(e)).length;
    document.getElementById("companyCount").textContent = visiveis === 1 ? "1 empresa liberada" : `${visiveis} empresas liberadas`;
    document.getElementById("semEmpresas").hidden = visiveis > 0;

    if(perfil.principal) document.getElementById("atalhoUsuarios").hidden = false;
  }catch{}
})();

// Mostra somente uma prévia dos documentos que o usuário pode ler.
// A página completa de histórico continua responsável pelas ações e filtros.
async function carregarPreviaHistorico(){
  const area = document.getElementById("previewDocuments");
  const resumo = document.getElementById("previewTotal");
  if(!area || !resumo) return;
  const mostrarEstado = (titulo, texto) => {
    const box = document.createElement("div"); box.className = "empty-state";
    const forte = document.createElement("strong"); forte.textContent = titulo;
    const p = document.createElement("p"); p.textContent = texto;
    box.append(forte, p);
    area.replaceChildren(box);
    area.setAttribute("aria-busy", "false");
  };
  try{
    const {documentos} = await Banco.listar({}, 0);
    // Respeitar o filtro de leitura já implementado no portal.
    const visiveis = (documentos || []).filter(doc => Banco.permite("ler", doc)).slice(0, 5);
    if(!visiveis.length){
      mostrarEstado("Nenhum documento recente", "Os documentos que você salvar aparecerão aqui. Escolha uma empresa acima para começar.");
      resumo.textContent = "Nenhum registro disponível para seu perfil";
      return;
    }
    const nomes = {contrato:"Contrato", recibo:"Recibo", orcamento:"Orçamento"};
    const formatarMoeda = valor => Number(valor).toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
    const frag = document.createDocumentFragment();
    for(const doc of visiveis){
      const item = document.createElement("div"); item.className = "recent-row";
      const principal = document.createElement("div"); principal.className = "recent-main";
      const cliente = document.createElement("strong"); cliente.className = "recent-client";
      cliente.textContent = doc.cliente_nome || "Documento sem cliente";
      const meta = document.createElement("span"); meta.className = "recent-meta";
      const tipo = document.createElement("span");
      tipo.className = `type-badge ${["contrato","recibo","orcamento"].includes(doc.tipo) ? doc.tipo : ""}`;
      tipo.textContent = nomes[doc.tipo] || "Documento";
      const empresa = document.createElement("span");
      empresa.className = `company-badge ${["MS","JD"].includes(doc.empresa) ? doc.empresa.toLowerCase() : ""}`;
      empresa.textContent = doc.empresa || "—";
      const data = document.createElement("span"); data.className = "num";
      data.textContent = doc.data_documento ? doc.data_documento.split("-").reverse().join("/") : "Sem data";
      meta.append(tipo, empresa, data);
      principal.append(cliente, meta);
      const valor = document.createElement("span"); valor.className = "recent-value num";
      valor.textContent = formatarMoeda(doc.valor);
      item.append(principal, valor);
      frag.append(item);
    }
    area.replaceChildren(frag);
    area.setAttribute("aria-busy", "false");
    resumo.textContent = visiveis.length === 1 ? "1 registro recente" : `${visiveis.length} registros recentes`;
  }catch(erro){
    mostrarEstado("Não foi possível carregar os documentos", "Verifique sua conexão e abra o histórico para tentar novamente.");
    resumo.textContent = "Prévia indisponível no momento";
  }
}
