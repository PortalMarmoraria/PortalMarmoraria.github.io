"use strict";
const Nuvem = {
  tipo:null, dados:null, existente:null, id:null, pronta:false, ocupada:false, editor:null,
  capturar(dados) {
    if (this.existente) dados.data = this.existente.dados.data;
    this.dados = structuredClone(dados);
  },
  invalidar() {
    this.dados = null;
    document.getElementById("tentarSalvar").hidden = true;
    document.getElementById("downloadPDF").disabled = true;
  },
  async iniciar(tipo, editor) {
    this.tipo=tipo;this.editor=editor;
    document.querySelector(".novo-documento").href = `${location.pathname}?empresa=${encodeURIComponent(empresaKey)}`;
    const form=document.querySelector("form");
    form.inert=true;
    const idEdicao=new URLSearchParams(location.search).get("editar");
    this.id=idEdicao || crypto.randomUUID();
    form.addEventListener("input",()=>this.invalidar());
    form.addEventListener("change",()=>this.invalidar());
    editor.on("text-change",()=>this.invalidar());
    document.getElementById("tentarSalvar").addEventListener("click",()=>this.salvar());
    try {
      await Banco.sessao();
      document.getElementById("contaDocumento").textContent=`${Banco.perfil.nome} · ${Banco.nomePerfil()}`;
      if(idEdicao){
        const doc=await Banco.obter(idEdicao);
        if(!Banco.permite("editar",doc))throw new Error("Sua conta não pode editar este documento salvo.");
        const empresa=new URLSearchParams(location.search).get("empresa") || localStorage.getItem("empresaSelecionada") || "JD";
        if(doc.tipo !== tipo || doc.empresa !== empresa)throw new Error("Abra a edição pelo histórico para carregar o documento correto.");
        this.existente=doc;
        for(const [chave,valor] of Object.entries(doc.dados)){
          if(["produto","referente","data"].includes(chave))continue;
          const campo=document.getElementById(chave);if(campo)campo.value=valor;
        }
        editor.setContents(editor.clipboard.convert(DOMPurify.sanitize(doc.dados.produto || doc.dados.referente || "")));
        Portal.mensagem(`Documento carregado · versão ${doc.versao}. Ao gerar a nova prévia, as alterações serão salvas automaticamente.`);
      }else {
        if(!Banco.permite("criar",{empresa:empresaKey,tipo}))throw new Error("Sua conta não pode criar este tipo de documento nesta empresa.");
        Portal.mensagem("Ao gerar o documento, os dados e o PDF serão salvos automaticamente.");
      }
      this.pronta=true;form.inert=false;
    }catch(erro){Portal.mensagem(erro.message,true);}
  },
  async salvar() {
    if(this.ocupada || document.body.classList.contains("pdf-mode"))return false;
    if(!this.dados || !this.pronta){Portal.mensagem("Entre na conta e gere a prévia antes de salvar.",true);return false;}
    const documento=document.getElementById("contrato");if(!documento)return false;
    const form=document.querySelector("form"), gerar=form.querySelector('[type="submit"]');
    const tentar=document.getElementById("tentarSalvar"), rotulo=gerar.textContent;
    this.ocupada=true;form.inert=true;tentar.hidden=true;tentar.disabled=true;
    gerar.textContent="Gerando e salvando…";
    Portal.mensagem("Gerando o PDF e salvando o documento no banco…");
    try{
      document.body.classList.add("pdf-mode");
      const pdf=await html2pdf().set(Portal.opcoesPDF(this.tipo,this.existente?.empresa || empresaKey))
        .from(Portal.prepararPDF(documento)).outputPdf("blob");
      document.body.classList.remove("pdf-mode");
      this.existente=await Banco.salvar({id:this.id,empresa:empresaKey,tipo:this.tipo,dados:this.dados,pdf,existente:this.existente});
      if(Banco.permite("editar",this.existente))history.replaceState(null,"",`${location.pathname}?${new URLSearchParams({editar:this.id,empresa:empresaKey})}`);
      Portal.mensagem(`Documento gerado e salvo no banco · versão ${this.existente.versao}. Consulte em Meus documentos.`);
      if(!Banco.permite("editar",this.existente)){
        this.pronta=false;
        for(const campo of form.querySelectorAll("input,select"))campo.disabled=true;
        this.editor.disable();gerar.disabled=true;
        Portal.mensagem("Documento gerado e salvo no banco. Para outro documento, clique em Novo documento. Seu perfil não permite editar este documento salvo.");
      }
      return true;
    }catch(erro){
      Portal.mensagem(`A prévia foi gerada, mas o salvamento não foi confirmado. ${erro.message || "Confira sua conexão."} Você pode tentar salvar novamente ou conferir o histórico.`,true);
      tentar.hidden=false;return false;
    }finally{
      document.body.classList.remove("pdf-mode");this.ocupada=false;form.inert=false;
      gerar.textContent=rotulo;tentar.disabled=false;
    }
  }
};
