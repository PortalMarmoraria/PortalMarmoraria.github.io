"use strict";
const Portal = {
  opcoesPDF(tipo, empresa) {
    return {
      margin: [8,8,8,8], filename: `${tipo}_${empresa}.pdf`,
      image: {type: "jpeg", quality: 0.98},
      html2canvas: {scale: 2, useCORS: true, scrollY: 0, backgroundColor: "#ffffff", windowWidth: document.documentElement.scrollWidth},
      jsPDF: {unit: "mm", format: "a4", orientation: "portrait"},
      pagebreak: {mode: ["css"], avoid: ["p", "li", "h2", "h3", ".titulo-01", ".assinaturas", "img"]}
    };
  },
  prepararPDF(documento) {
    // Dividir cláusulas com <br> permite continuar entre parágrafos,
    // sem empurrar a seção inteira para a próxima folha.
    const copia = documento.cloneNode(true);
    for (const paragrafo of copia.querySelectorAll("p")) {
      const quebras = [...paragrafo.querySelectorAll("br")];
      if (!quebras.length) continue;
      const bloco = document.createElement("div");
      bloco.className = "pdf-paragrafos";
      let anterior = null;
      for (const quebra of [...quebras, null]) {
        const intervalo = document.createRange();
        if (anterior) intervalo.setStartAfter(anterior);
        else intervalo.setStart(paragrafo, 0);
        if (quebra) intervalo.setEndBefore(quebra);
        else intervalo.setEnd(paragrafo, paragrafo.childNodes.length);
        const trecho = document.createElement("p");
        trecho.appendChild(intervalo.cloneContents());
        if (trecho.textContent.trim()) bloco.appendChild(trecho);
        anterior = quebra;
      }
      paragrafo.replaceWith(bloco);
    }
    return copia;
  },
  mensagem(texto, erro = false) {
    const status = document.getElementById("status");
    status.textContent = texto;
    status.classList.toggle("error", erro);
  },
  protegerDados(dados) {
    for (const chave of Object.keys(dados)) {
      if (!["produto", "referente"].includes(chave) && typeof dados[chave] === "string") {
        dados[chave] = dados[chave].replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
      }
    }
  },
  validar(form, editor) {
    if (!form.reportValidity()) return false;
    if (!editor.getText().trim()) {
      this.mensagem("Descreva o produto ou serviço antes de gerar o documento.", true);
      editor.focus(); return false;
    }
    const campo = document.getElementById("dataano");
    const partes = campo.value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const data = partes && new Date(+partes[3], +partes[2] - 1, +partes[1]);
    if (!partes || data.getFullYear() !== +partes[3] || data.getMonth() !== +partes[2] - 1 || data.getDate() !== +partes[1]) {
      this.mensagem("Informe uma data válida no formato dd/mm/aaaa.", true);
      campo.focus(); return false;
    }
    return true;
  }
};
