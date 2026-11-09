"use strict";
// Melhorias de interface dos formulários de documento.
// Não altera dados, validações, geração de PDF nem salvamento: apenas observa
// os estados que portal.js / nuvem.js já produzem e os torna visíveis.
(() => {
  // Rótulo acessível para a área editável do Quill.
  const editor = document.querySelector("#produtoEditor .ql-editor");
  if (editor) {
    editor.setAttribute("aria-labelledby", "produtoLabel");
    editor.setAttribute("role", "textbox");
    editor.setAttribute("aria-multiline", "true");
  }
  document.querySelectorAll(".ql-toolbar button").forEach(botao => {
    const formato = [...botao.classList].find(c => c.startsWith("ql-"))?.slice(3);
    const nomes = {bold: "Negrito", italic: "Itálico", underline: "Sublinhado", clean: "Limpar formatação", list: botao.value === "ordered" ? "Lista numerada" : "Lista com marcadores"};
    if (formato && nomes[formato] && !botao.hasAttribute("aria-label")) botao.setAttribute("aria-label", nomes[formato]);
  });

  // Seletores de fonte e tamanho do Quill recebem nome acessível.
  const pickers = {"ql-font": "Fonte", "ql-size": "Tamanho do texto"};
  for (const [classe, nome] of Object.entries(pickers)) {
    document.querySelector(`.ql-toolbar .${classe} .ql-picker-label`)?.setAttribute("aria-label", nome);
  }

  // Botões mostram carregamento enquanto o texto indica uma operação em andamento
  // ("Gerando e salvando…", "Gerando PDF…").
  const form = document.querySelector("form.doc-form");
  const botoes = [form?.querySelector('[type="submit"]'), document.getElementById("downloadPDF")].filter(Boolean);
  for (const botao of botoes) {
    const sincronizar = () => {
      const carregando = /…$/.test(botao.textContent.trim());
      botao.classList.toggle("is-loading", carregando);
      if (carregando) botao.setAttribute("aria-busy", "true"); else botao.removeAttribute("aria-busy");
    };
    new MutationObserver(sincronizar).observe(botao, {childList: true, characterData: true, subtree: true});
  }

  // Prévia: animação curta somente no contêiner quando uma nova versão é gerada.
  // (O documento #contrato em si não é animado, para não interferir na captura do PDF.)
  const previa = document.getElementById("previewContainer");
  if (previa) {
    new MutationObserver(() => {
      previa.classList.remove("is-fresh");
      void previa.offsetWidth;
      previa.classList.add("is-fresh");
    }).observe(previa, {childList: true});
  }
})();
