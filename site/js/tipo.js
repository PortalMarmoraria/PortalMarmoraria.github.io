
    // se chegar aqui sem empresa selecionada, volta
    const empresa = localStorage.getItem("empresaSelecionada");
    if (!empresa) {
      alert("Escolha uma empresa primeiro!");
      window.location.href = "index.html";
    }

    document.querySelectorAll(".empresa[data-doc]").forEach(card => {
      const doc = card.dataset.doc;

      card.addEventListener("click", () => escolher(doc));
      card.querySelector("button").addEventListener("click", (e) => {
        e.stopPropagation();
        escolher(doc);
      });
    });

function escolher(doc) {
  localStorage.setItem("tipoDocumento", doc);

  if (doc === "contrato") window.location.href = "../servicos/contrato.html";
  if (doc === "recibo") window.location.href = "../servicos/recibo.html";
  if (doc === "orcamento") window.location.href = "../servicos/orcamento.html";
    }
