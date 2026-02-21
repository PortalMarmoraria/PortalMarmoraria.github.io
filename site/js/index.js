// Seleciona todos os cards de empresa
document.querySelectorAll(".empresa").forEach((empresaCard) => {
  const empresa = empresaCard.dataset.empresa;

  empresaCard.addEventListener("click", () => {
    selecionarEmpresa(empresa);
  });

  const botao = empresaCard.querySelector("button");
  if (botao) {
    botao.addEventListener("click", (e) => {
      e.stopPropagation();
      selecionarEmpresa(empresa);
    });
  }
});

function selecionarEmpresa(empresa) {
  localStorage.setItem("empresaSelecionada", empresa);
  console.log("Empresa selecionada:", empresa);

  // CORRETO
  window.location.href = "./site/tipo.html";
}