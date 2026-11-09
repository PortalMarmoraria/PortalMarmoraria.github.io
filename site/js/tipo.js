"use strict";
const escolha = new URLSearchParams(location.search).get("empresa");
if (["MS", "JD"].includes(escolha)) localStorage.setItem("empresaSelecionada", escolha);
const selecionada = localStorage.getItem("empresaSelecionada");
if (!["MS", "JD"].includes(selecionada)) location.replace("../index.html");
else {
  document.getElementById("empresaNome").textContent = selecionada + " Marmoraria";
  // Identidade visual da empresa escolhida (somente apresentação).
  document.body.dataset.empresa = selecionada.toLowerCase();
  document.getElementById("empresaLogo").src = `../img/${selecionada}.png`;
}
document.getElementById("ano").textContent = new Date().getFullYear();

// Feedback de carregamento ao abrir um formulário (a próxima página carrega o editor e o gerador de PDF).
document.addEventListener("click", evento => {
  const card = evento.target.closest("a.doc-card");
  if (!card || !card.hasAttribute("href") || evento.defaultPrevented || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.button !== 0) return;
  card.classList.add("is-loading");
  card.setAttribute("aria-busy", "true");
});
window.addEventListener("pageshow", () => {
  document.querySelectorAll("a.doc-card.is-loading").forEach(card => { card.classList.remove("is-loading"); card.removeAttribute("aria-busy"); });
});
