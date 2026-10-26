// ====== EMPRESAS (MS/JD) ======


    const empresaParametro = new URLSearchParams(location.search).get("empresa");
    const empresaKey = ["MS", "JD"].includes(empresaParametro) ? empresaParametro : (localStorage.getItem("empresaSelecionada") || "JD");
    const empresa = EMPRESAS[empresaKey] || EMPRESAS.JD;

    // aplica o tema (mesma raiz do contrato)
    document.documentElement.style.setProperty("--brand", empresa.cor);
    document.title = `Orçamento - ${empresa.nome}`;
    document.getElementById("empresaBadge").textContent = empresa.nome;
    document.getElementById("tituloForm").textContent = `Gerador de Orçamento - ${empresa.nome}`;

    // ====== HELPERS ======
    function onlyDigits(v){ return (v || "").replace(/\D/g, ""); }

    function maskCEP(v){
      v = onlyDigits(v).slice(0,8);
      if (v.length <= 5) return v;
      return v.slice(0,5) + "-" + v.slice(5);
    }

    function maskData(v){
      v = onlyDigits(v).slice(0,8);
      if (v.length <= 2) return v;
      if (v.length <= 4) return v.slice(0,2) + "/" + v.slice(2);
      return v.slice(0,2) + "/" + v.slice(2,4) + "/" + v.slice(4);
    }

    function toTitleCase(str) {
      return str
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
    }

    // ====== INPUTS ======
    const nomeInput = document.getElementById("nome");
    const cepInput = document.getElementById("cep");
    const enderecoInput = document.getElementById("endereco");
    const dataInput = document.getElementById("dataano");
    const valorInput = document.getElementById("valor");
    const valorExtensoInput = document.getElementById("valorextenso");

    nomeInput.addEventListener("blur", () => {
      nomeInput.value = toTitleCase(nomeInput.value);
    });

    // CEP + ViaCEP
    cepInput.addEventListener("input", () => {
      cepInput.value = maskCEP(cepInput.value);
    });

    cepInput.addEventListener("blur", () => {
      const cepLimpo = onlyDigits(cepInput.value);
      if (cepLimpo.length !== 8) return;

      fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        .then(r => r.json())
        .then(data => {
          if (!data.erro) {
            enderecoInput.value =
              `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
          }
        }).catch(() => Portal.mensagem("Consulta de CEP indisponível. Preencha o endereço manualmente.", true));
    });

    // Data dd/mm/aaaa
    dataInput.addEventListener("input", () => {
      dataInput.value = maskData(dataInput.value);
    });

    // ====== Moeda BRL (igual contrato) ======
    function formatBRLFromDigits(digits) {
      const only = (digits || "").replace(/\D/g, "");
      const number = Number(only) / 100;
      if (!only) return "R$ 0,00";
      return "R$ " + number.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // ====== Valor por extenso ======
   function numeroPorExtenso(valor) {
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
    "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function extensoAte999(n) {
    if (n === 0) return "";
    if (n < 20) return unidades[n];
    if (n < 100) return dezenas[Math.floor(n / 10)] + (n % 10 ? " e " + unidades[n % 10] : "");
    if (n === 100) return "cem";
    return centenas[Math.floor(n / 100)] + (n % 100 ? " e " + extensoAte999(n % 100) : "");
  }

  function extenso(n) {
    if (n === 0) return "zero";

    const partes = [];

    const bilhoes = Math.floor(n / 1_000_000_000);
    n = n % 1_000_000_000;
    const milhoes = Math.floor(n / 1_000_000);
    n = n % 1_000_000;
    const milhares = Math.floor(n / 1000);
    const resto = n % 1000;

    if (bilhoes) partes.push(extensoAte999(bilhoes) + (bilhoes === 1 ? " bilhão" : " bilhões"));
    if (milhoes) partes.push(extensoAte999(milhoes) + (milhoes === 1 ? " milhão" : " milhões"));
    if (milhares) {
      if (milhares === 1) partes.push("mil");
      else partes.push(extensoAte999(milhares) + " mil");
    }
    if (resto) partes.push(extensoAte999(resto));

    // regra do "e" antes do último quando faz sentido em pt-br
    if (partes.length === 1) return partes[0];
    return partes.slice(0, -1).join(", ") + " e " + partes[partes.length - 1];
  }

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  let texto = "";

  if (inteiro > 0) {
    texto = extenso(inteiro) + (inteiro === 1 ? " real" : " reais");
  } else {
    texto = "zero real";
  }

  if (centavos > 0) {
    texto += " e " + extenso(centavos) + (centavos === 1 ? " centavo" : " centavos");
  }

  return texto;
}


    function updateValorExtenso() {
      const numero = Number(
        valorInput.value
          .replace("R$", "")
          .replace(/\./g, "")
          .replace(",", ".")
          .trim()
      );
      if (!isNaN(numero)) valorExtensoInput.value = numeroPorExtenso(numero);
      else valorExtensoInput.value = "";
    }

    valorInput.addEventListener("input", () => {
      valorInput.value = formatBRLFromDigits(valorInput.value);
      valorInput.setSelectionRange(valorInput.value.length, valorInput.value.length);
      updateValorExtenso();
    });

    valorInput.addEventListener("blur", () => {
      if (!valorInput.value.trim()) valorInput.value = "R$ 0,00";
      else valorInput.value = formatBRLFromDigits(valorInput.value);
      updateValorExtenso();
    });

    // inicia certinho
    valorInput.value = "R$ 0,00";
    updateValorExtenso();

    // QUILL
    const quill = new Quill('#produtoEditor', {
      theme: 'snow',
      placeholder: 'Descreva o produto/serviço...',
      modules: {
        toolbar: [
          [{ 'font': [] }, { 'size': [] }],
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          ['clean']
        ]
      }
    });

    // ====== GERAR PREVIEW (ORÇAMENTO) ======
    const form = document.getElementById("formOrcamento");
    const previewContainer = document.getElementById("previewContainer");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (Nuvem.ocupada || !Nuvem.pronta || document.body.classList.contains("pdf-mode")) return;
      if (!Portal.validar(form, quill)) return;

      nomeInput.value = toTitleCase(nomeInput.value);

      const dados = {
        nome: nomeInput.value,
        endereco: enderecoInput.value,
        cep: cepInput.value,
        produto: DOMPurify.sanitize(quill.root.innerHTML),
        valor: valorInput.value,
        valorextenso: valorExtensoInput.value,
        validade: document.getElementById("validade").value,
        dataano: dataInput.value,
        data: new Date().toLocaleDateString()
      };

      Nuvem.capturar(dados);
      Portal.protegerDados(dados);

      const pagamentoExtra = empresa.pagamentoInfo
        ? `
          <div class="secao keep-together">
            <div class="titulo-01 keep-with-next"><strong>DADOS DO PAGAMENTO</strong></div>
            <div class="sub-titulo">
              <p>${empresa.pagamentoInfo}</p>
            </div>
          </div>
        `
        : "";

      const orcamentoHTML = `
        <div id="contrato">
          <div class="doc">
            <header>
              <div class="photo">
                <img src="${empresa.logo}" alt="Logo ${empresa.nome}" width="200"/>
              </div>
              <h2>${empresa.nome}</h2>
              <p><strong>ORÇAMENTO</strong></p>
              <p>Data de emissão: ${dados.data}</p>
            </header>

            <div class="contratado">
              <h3><b>Razão Social:</b> ${empresa.razao}</h3>
              <h3><b>CNPJ:</b> ${empresa.cnpj}</h3>
              <h3><b>IE:</b> ${empresa.ie}</h3>
              <h3><b>ENDEREÇO FÁBRICA:</b> ${empresa.enderecoFabrica}</h3>
            </div>

            <div class="secao keep-together">
              <div class="titulo-01"><strong>DADOS DO CLIENTE</strong></div>
              <p>
                <strong>Nome:</strong> ${dados.nome}<br>
                <strong>CEP:</strong> ${dados.cep}<br>
                <strong>Endereço:</strong> ${dados.endereco}
              </p>
            </div>

            <div class="secao keep-together">
              <div class="titulo-01 keep-with-next"><strong>DETALHAMENTO DO SERVIÇO</strong></div>
              <div class="sub-titulo">
                <div>${dados.produto}</div>
                <p><strong>Valor:</strong> <strong>${dados.valor}</strong> (${dados.valorextenso})</p>
                <p><strong>Validade do Orçamento:</strong> ${dados.validade}</p>
              </div>
            </div>


            <div class="secao keep-together">
              <div class="titulo-01 keep-with-next"><strong>OBSERVAÇÕES</strong></div>
              <div class="sub-titulo">
                <p>
                  Este orçamento é uma proposta comercial e está sujeito a confirmação de medidas, materiais e disponibilidade.
                </p>
              </div>
            </div>

              <div class="dataFinal">${empresa.cidade} ${dados.dataano}</div>
            </div>

          </div>
        </div>
      `;

      previewContainer.innerHTML = orcamentoHTML;
      document.getElementById("downloadPDF").disabled = false;
      await Nuvem.salvar();
      previewContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // ====== PDF (mesma config do contrato) ======
    document.getElementById("downloadPDF").addEventListener("click", async () => {
      if (Nuvem.ocupada || document.body.classList.contains("pdf-mode")) return;
      const contrato = document.getElementById("contrato");
      if (!contrato) return alert("Gere o orçamento primeiro!");

      const botaoPDF = document.getElementById("downloadPDF");
      botaoPDF.disabled = true;
      botaoPDF.textContent = "Gerando PDF…";
      document.body.classList.add("pdf-mode");

      const opt = Portal.opcoesPDF("orcamento", empresaKey);

      try {
        await html2pdf().set(opt).from(Portal.prepararPDF(contrato)).save();
      } catch (erro) {
        Portal.mensagem("Não foi possível gerar o PDF. Tente novamente.", true);
        console.error("Falha ao gerar PDF", erro);
      } finally {
        document.body.classList.remove("pdf-mode");
        botaoPDF.disabled = false;
        botaoPDF.textContent = "Baixar PDF";
      }
    });

Nuvem.iniciar("orcamento", quill);
