// ====== EMPRESAS (MS/JD) ======


    const empresaParametro = new URLSearchParams(location.search).get("empresa");
    const empresaKey = ["MS", "JD"].includes(empresaParametro) ? empresaParametro : (localStorage.getItem("empresaSelecionada") || "JD");
    const empresa = EMPRESAS[empresaKey] || EMPRESAS.JD;

    // aplica o tema
    document.documentElement.style.setProperty("--brand", empresa.cor);
    document.title = `Recibo - ${empresa.nome}`;
    document.getElementById("empresaBadge").textContent = empresa.nome;
    document.getElementById("tituloForm").textContent = `Gerador de Recibo - ${empresa.nome}`;

    // ====== HELPERS ======
    function onlyDigits(v){ return (v || "").replace(/\D/g, ""); }

    function maskCPF(v){
      v = onlyDigits(v).slice(0,11);
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      return v;
    }

    function maskCNPJ(v){
      v = onlyDigits(v).slice(0,14);
      v = v.replace(/(\d{2})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1/$2");
      v = v.replace(/(\d{4})(\d{1,2})$/, "$1-$2");
      return v;
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

    // moeda
    function formatBRLFromDigits(digits) {
      const only = (digits || "").replace(/\D/g, "");
      const number = Number(only) / 100;
      if (!only) return "R$ 0,00";
      return "R$ " + number.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function parseBRLToNumber(brl) {
      const n = Number(
        (brl || "")
          .replace("R$", "")
          .replace(/\./g, "")
          .replace(",", ".")
          .trim()
      );
      return isNaN(n) ? 0 : n;
    }

    // ====== VALOR POR EXTENSO (PT-BR) - CORRIGIDO (MIL/MILHÃO/BILHÃO) ======
    function numeroPorExtenso(valor) {
      const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
      const dez_a_dezenove = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
      const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
      const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

      function extenso_ate_999(n) {
        n = Number(n) || 0;
        if (n === 0) return "";
        if (n === 100) return "cem";

        let txt = "";
        const c = Math.floor(n / 100);
        const r = n % 100;

        if (c) txt = centenas[c];

        if (r) {
          if (txt) txt += " e ";
          if (r < 10) txt += unidades[r];
          else if (r < 20) txt += dez_a_dezenove[r - 10];
          else {
            const d = Math.floor(r / 10);
            const u = r % 10;
            txt += dezenas[d];
            if (u) txt += " e " + unidades[u];
          }
        }
        return txt;
      }

      function extenso_grande(n) {
        n = Math.floor(Number(n) || 0);
        if (n === 0) return "zero";

        const partes = [];
        const escalas = [
          { sing: "", plur: "" },
          { sing: "mil", plur: "mil" },
          { sing: "milhão", plur: "milhões" },
          { sing: "bilhão", plur: "bilhões" },
          { sing: "trilhão", plur: "trilhões" }
        ];

        let escala = 0;
        while (n > 0) {
          const bloco = n % 1000;
          n = Math.floor(n / 1000);

          if (bloco) {
            let blocoTxt = "";
            if (escala === 1 && bloco === 1) {
              blocoTxt = "mil";
            } else {
              blocoTxt = extenso_ate_999(bloco);
              const nomeEscala = escalas[escala];
              if (escala > 0) blocoTxt += " " + (bloco === 1 ? nomeEscala.sing : nomeEscala.plur);
            }
            partes.unshift(blocoTxt.trim());
          }
          escala++;
        }

        if (partes.length === 1) return partes[0];
        const ultimo = partes.pop();
        return partes.join(", ") + " e " + ultimo;
      }

      valor = Number(valor) || 0;
      const inteiro = Math.floor(valor + 1e-9);
      const centavos = Math.round((valor - inteiro) * 100);

      let texto = `${extenso_grande(inteiro)} ${inteiro === 1 ? "real" : "reais"}`;
      if (centavos > 0) {
        texto += ` e ${extenso_grande(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`;
      }
      return texto;
    }

    // ====== INPUTS ======
    const nomeInput = document.getElementById("nome");
    const tipoSelect = document.getElementById("tipoId");
    const docInput = document.getElementById("cpfCnpj");
    const dataInput = document.getElementById("dataano");
    const valorInput = document.getElementById("valor");
    const valorExtensoInput = document.getElementById("valorextenso");
    const formaPagamentoInput = document.getElementById("formaPagamento");
    const statusPagamentoInput = document.getElementById("statusPagamento");

    nomeInput.addEventListener("blur", () => {
      nomeInput.value = toTitleCase(nomeInput.value);
    });

    function applyDocMask(){
      const t = tipoSelect.value;
      if (t === "CPF") {
        docInput.placeholder = "000.000.000-00";
        docInput.value = maskCPF(docInput.value);
      } else {
        docInput.placeholder = "00.000.000/0000-00";
        docInput.value = maskCNPJ(docInput.value);
      }
    }

    tipoSelect.addEventListener("change", () => {
      docInput.value = "";
      applyDocMask();
    });

    docInput.addEventListener("input", applyDocMask);
    applyDocMask();

    dataInput.addEventListener("input", () => {
      dataInput.value = maskData(dataInput.value);
    });

    function updateValorExtenso() {
      const numero = parseBRLToNumber(valorInput.value);
      valorExtensoInput.value = numeroPorExtenso(numero);
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

    // ====== QUILL ======
    const quill = new Quill('#produtoEditor', {
      theme: 'snow',
      placeholder: 'Descreva o serviço/produto pago...',
      modules: {
        toolbar: [
          [{ 'font': [] }, { 'size': [] }],
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          ['clean']
        ]
      }
    });

    // ====== GERAR PREVIEW (RECIBO) ======
    const form = document.getElementById("formRecibo");
    const previewContainer = document.getElementById("previewContainer");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (Nuvem.ocupada || !Nuvem.pronta || document.body.classList.contains("pdf-mode")) return;
      if (!Portal.validar(form, quill)) return;

      nomeInput.value = toTitleCase(nomeInput.value);
      updateValorExtenso();

      const dados = {
        nome: nomeInput.value,
        tipoId: tipoSelect.value,
        cpfCnpj: docInput.value,
        referente: DOMPurify.sanitize(quill.root.innerHTML),
        valor: valorInput.value,
        valorextenso: valorExtensoInput.value,
        formaPagamento: formaPagamentoInput.value,
        statusPagamento: statusPagamentoInput.value,
        dataano: dataInput.value,
        data: new Date().toLocaleDateString()
      };

      Nuvem.capturar(dados);
      Portal.protegerDados(dados);

      const pagamentoExtra = empresa.pagamentoInfo
        ? `
          <div class="secao keep-together">
            <div class="titulo-01 keep-with-next"><strong>DADOS PARA PAGAMENTO</strong></div>
            <div class="sub-titulo">
              <p>${empresa.pagamentoInfo}</p>
            </div>
          </div>
        `
        : "";

      const reciboHTML = `
        <div id="contrato">
          <div class="doc">
            <header>
              <div class="photo">
                <img src="${empresa.logo}" alt="Logo ${empresa.nome}" width="200"/>
              </div>
              <h2>${empresa.nome}</h2>
              <p><strong>RECIBO DE PAGAMENTO</strong></p>
              <p>Data de emissão: ${dados.data}</p>
            </header>

            <div class="secao keep-together">
              <div class="titulo-01"><strong>DADOS DO EMISSOR (RECEBEDOR)</strong></div>
              <div class="sub-titulo">
                <p>
                  <b>Razão Social:</b> ${empresa.razao} <br>
                  <b>CNPJ:</b> ${empresa.cnpj} <br>
                  <b>IE:</b> ${empresa.ie} <br>
                  <b>Endereço:</b> ${empresa.enderecoFabrica}
                </p>
              </div>
            </div>

            <div class="secao keep-together">
              <div class="titulo-01"><strong>DADOS DO CLIENTE (PAGADOR)</strong></div>
              <div class="sub-titulo">
                <p>
                  <b>Nome:</b> ${dados.nome}<br>
                  <b>${dados.tipoId}:</b> ${dados.cpfCnpj}
                </p>
              </div>
            </div>

            <div class="secao keep-together">
              <div class="titulo-01"><strong>REFERENTE A</strong></div>
              <div class="sub-titulo">
                <div>${dados.referente}</div>
              </div>
            </div>

            <div class="secao keep-together">
              <div class="titulo-01"><strong>DECLARAÇÃO</strong></div>
              <div class="sub-titulo">
                <p>
                  Declaro que recebi de <strong>${dados.nome}</strong> (${dados.tipoId} ${dados.cpfCnpj})
                  o valor de <strong>${dados.valor}</strong> (<strong>${dados.valorextenso}</strong>),
                  na forma de pagamento <strong>${dados.formaPagamento}</strong>, com status <strong>${dados.statusPagamento}</strong>,
                  referente ao item descrito acima.
                </p>

                <p><strong>Valor Recebido:</strong> <strong>${dados.valor}</strong> (${dados.valorextenso})</p>
              </div>
            </div>

            ${pagamentoExtra}

            <div class="keep-together bloco-final">
              <h3>ASSINATURAS</h3>

              <div class="assinaturas">
                <div class="assinatura-item">
                  <div class="assinatura-linha"></div>
                  <p class="assinatura-nome">${dados.nome}</p>
                  <p class="assinatura-doc">${dados.tipoId} ${dados.cpfCnpj}</p>
                </div>

                <div class="assinatura-item">
                  <div class="assinatura-linha"></div>
                  <p class="assinatura-nome">${empresa.assinaturaNome}</p>
                  <p class="assinatura-doc">CNPJ: ${empresa.cnpj}</p>
                </div>
              </div>

              <div class="dataFinal">${empresa.cidade} ${dados.dataano}</div>
            </div>
          </div>
        </div>
      `;

      previewContainer.innerHTML = reciboHTML;
      document.getElementById("downloadPDF").disabled = false;
      await Nuvem.salvar();
      previewContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // ====== PDF (mesma config do contrato) ======
    document.getElementById("downloadPDF").addEventListener("click", async () => {
      if (Nuvem.ocupada || document.body.classList.contains("pdf-mode")) return;
      const contrato = document.getElementById("contrato");
      if (!contrato) return alert("Gere o recibo primeiro!");

      const botaoPDF = document.getElementById("downloadPDF");
      botaoPDF.disabled = true;
      botaoPDF.textContent = "Gerando PDF…";
      document.body.classList.add("pdf-mode");

      const opt = Portal.opcoesPDF("recibo", empresaKey);

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

Nuvem.iniciar("recibo", quill);
