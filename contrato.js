// ====== EMPRESAS (MS/JD) ======


    const empresaParametro = new URLSearchParams(location.search).get("empresa");
    const empresaKey = ["MS", "JD"].includes(empresaParametro) ? empresaParametro : (localStorage.getItem("empresaSelecionada") || "JD");
    const empresa = EMPRESAS[empresaKey] || EMPRESAS.JD;

    // aplica o tema
    document.documentElement.style.setProperty("--brand", empresa.cor);
    document.title = `Contrato - ${empresa.nome}`;
    document.getElementById("empresaBadge").textContent = empresa.nome;
    document.getElementById("tituloForm").textContent = `Gerador de Contrato - ${empresa.nome}`;

    // ====== FUNÇÕES DE MÁSCARA ======
    function onlyDigits(v){ return (v || "").replace(/\D/g, ""); }

    function maskCEP(v){
      v = onlyDigits(v).slice(0,8);
      if (v.length <= 5) return v;
      return v.slice(0,5) + "-" + v.slice(5);
    }

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

    // ====== (Nome Title Case) ======
    function toTitleCase(str) {
      return str
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
    }

    const nomeInput = document.getElementById("nome");
    nomeInput.addEventListener("blur", () => {
      nomeInput.value = toTitleCase(nomeInput.value);
    });

    // ====== (CEP máscara + ViaCEP) ======
    const cepInput = document.getElementById("cep");
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
            document.getElementById('endereco').value =
              `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
          }
        }).catch(() => Portal.mensagem("Consulta de CEP indisponível. Preencha o endereço manualmente.", true));
    });

    // ====== (CPF/CNPJ máscara conforme select) ======
    const tipoSelect = document.getElementById("tipoId");
    const docInput = document.getElementById("cpfCnpj");

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

    // ====== (Data máscara) ======
    const dataInput = document.getElementById("dataano");
    dataInput.addEventListener("input", () => {
      dataInput.value = maskData(dataInput.value);
    });

    // ====== (Moeda BRL) ======
    const valorInput = document.getElementById("valor");
    const valorExtensoInput = document.getElementById("valorextenso"); // <<< ADICIONADO (FALTAVA)

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

    function updateValorExtenso() {
      const numero = parseBRLToNumber(valorInput.value);
      valorExtensoInput.value = numeroPorExtenso(numero);
    }

    // <<< ALTERADO: agora atualiza extenso automaticamente
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

    // ====== GERAR PREVIEW ======
    const form = document.getElementById("formContrato");
    const previewContainer = document.getElementById("previewContainer");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (Nuvem.ocupada || !Nuvem.pronta || document.body.classList.contains("pdf-mode")) return;
      if (!Portal.validar(form, quill)) return;

      nomeInput.value = toTitleCase(nomeInput.value);

      // <<< GARANTE que o extenso esteja atualizado antes de gerar o HTML
      updateValorExtenso();

      const dados = {
        nome: nomeInput.value,
        tipoId: tipoSelect.value,
        cpfCnpj: docInput.value,
        endereco: document.getElementById("endereco").value,
        cep: cepInput.value,
        produto: DOMPurify.sanitize(quill.root.innerHTML),
        valor: valorInput.value,
        valorextenso: valorExtensoInput.value, // <<< CORRIGIDO (antes era "valorextenso.value" sem const)
        pagamento: document.getElementById("pagamento").value,
        prazo: document.getElementById("prazo").value,
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

      const contratoHTML = `
        <div id="contrato">
          <div class="doc">
            <header>
              <div class="photo">
                <img src="${empresa.logo}" alt="Logo ${empresa.nome}" width="200"/>
              </div>
              <h2>${empresa.nome}</h2>
              <p>Data de emissão: ${dados.data}</p>
            </header>

            <div class="contratado">
              <h3><b>Razão Social:</b> ${empresa.razao}</h3>
              <h3><b>CNPJ:</b> ${empresa.cnpj}</h3>
              <h3><b>IE:</b> ${empresa.ie}</h3>
              <h3><b>ENDEREÇO FABRICA:</b> ${empresa.enderecoFabrica}</h3>
            </div>

            <div class="secao keep-together">
              <div class="titulo-01"><strong>CONTRATANTE</strong></div>
              <p><strong>${dados.nome}</strong>, inscrito(a) no ${dados.tipoId} <strong>${dados.cpfCnpj}</strong>, situado na ${dados.endereco}, CEP: ${dados.cep}.</p>
            </div>

            <div class="secao keep-together">
              <div class="titulo-01"><strong>CONTRATADO</strong></div>
              <div class="sub-titulo">
                <p>
                  As partes acima elencadas, contratante e Contratado, firmam entre si o presente Contrato de Prestação de Serviço, conforme cláusulas a seguir: <br>
                  <b>Razão Social:</b> ${empresa.razao} <br>
                  <b>CNPJ:</b> ${empresa.cnpj} <br>
                  <b>IE:</b> ${empresa.ie}
                </p>
              </div>
            </div>

            <div class="secao keep-together">
              <div class="titulo-01 keep-with-next"><strong>CLAUSULA 1ª - DO OBJETO E EXECUÇÃO DOS SERVIÇOS</strong></div>
              <div class="sub-titulo">
                <p>
                  1.1 A CONTRATADA se obriga com o contratante à prestação de serviços, que se regerá pelas cláusulas e condições abaixo transcritas: <br>
                  1.2 A CONTRATADA se compromete a fornecer o seguinte material:
                </p>
              </div>
            </div>

            <div class="secao keep-together">
              <div class="titulo-01 keep-with-next"><strong>Detalhamento do Produto</strong></div>
              <div>${dados.produto}</div>
              <p><strong>Valor:</strong> <strong>${dados.valor}</strong></p>
            </div>

            <div class="secao keep-together">
              <div class="titulo-01 keep-with-next"><strong>CLAUSULA 2ª DO PREÇO</strong></div>
              <div class="sub-titulo">
                <p>
                  1.3 Para execução dos serviços contratados no presente instrumento, o CONTRATANTE pagará à CONTRATADA o valor total de
                  <strong>${dados.valor}</strong> (${dados.valorextenso}), ${dados.pagamento}.
                </p>
              </div>
            </div>

            ${pagamentoExtra}

            <div class="secao keep-together">
              <div class="titulo-01 keep-with-next"><strong>CLAUSULA 3ª DO PRAZO</strong></div>
              <div class="sub-titulo">
                <p>
                  1.4 O presente contrato entra em vigor na presente data, gerando direitos e deveres recíprocos, obrigando-se a CONTRATADA
                  a entregar o material no prazo de até <strong>${dados.prazo}</strong>.
                </p>
              </div>
            </div>

            <div class="secao keep-together">
              <div class="titulo-01 keep-with-next"><strong>CLAUSULA 4ª - DAS OBRIGAÇÕES DAS PARTES</strong></div>
              <div class="sub-titulo">
                <p>
                  a. Se responsabilizar pelos atos e omissões praticados por seus subordinados; <br>
                  b. Providenciar os meios e os equipamentos necessários à correta execução dos serviços; <br>
                  c. Fornecer o produto conforme descrito. <br><br>

                  1.6 São obrigações do CONTRATANTE: <br>
                  Fornecer todas as informações necessárias à realização dos serviços; <br>
                  a. Realizar pagamento restante após término da instalação; <br>
                  b. Providenciar um local para eventuais recortes e ajustes.
                </p>
              </div>
            </div>

            <div class="secao keep-together">
              <div class="titulo-01 keep-with-next"><strong>CLAUSULA 5ª DISPOSIÇÕES GERAIS</strong></div>
              <div class="sub-titulo">
                <p>
                  a. A empresa CONTRATADA não faz instalação de hidráulica, elétrica ou quaisquer que saia do ramo; <br>
                  b. Granitos, mármores ou quartzitos são materiais naturais, podendo ocorrer divergência de tonalidade; <br>
                  c. A empresa CONTRATADA não tem obrigação de comprometer-se com a limpeza do ambiente.
                </p>
              </div>
            </div>

            <div class="secao keep-together">
              <div class="titulo-01 keep-with-next"><strong>CLÁUSULA 6ª – DA GARANTIA</strong></div>
              <div class="sub-titulo">
              <p>
              A CONTRATADA assegura ao CONTRATANTE a garantia legal de 90 (noventa) dias, conforme previsto no Código de Defesa do Consumidor 
              (Lei nº 8.078/90), contados a partir da entrega do produto ou conclusão do serviço, cobrindo eventuais defeitos decorrentes de falha de 
              material ou de execução. <br>

              Além da garantia legal, poderá ser concedida garantia contratual adicional, conforme especificado neste contrato ou na nota fiscal, 
              observando as condições, prazos e limitações estabelecidas pela CONTRATADA.
              </p>


                          <div class="secao keep-together">
              <div class="titulo-01 keep-with-next"><strong>CLÁUSULA 7ª – DA MULTA RESCISÓRIA</strong></div>
              <div class="sub-titulo">
              <p>
              O descumprimento de qualquer das cláusulas deste instrumento que enseje a rescisão antecipada
              do contrato sujeitará a parte infratora ao pagamento de multa compensatória fixa e irreduzivel de 5% (cinco por cento) sobre o valor total e fixo
              deste contrato.
              </p>

              

              </div>
              </div>

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

      previewContainer.innerHTML = contratoHTML;
      document.getElementById("downloadPDF").disabled = false;
      await Nuvem.salvar();
      previewContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // ====== PDF com paginação compartilhada ======
    document.getElementById("downloadPDF").addEventListener("click", async () => {
      if (Nuvem.ocupada || document.body.classList.contains("pdf-mode")) return;
      const contrato = document.getElementById("contrato");
      if (!contrato) return alert("Gere o contrato primeiro!");

      const botaoPDF = document.getElementById("downloadPDF");
      botaoPDF.disabled = true;
      botaoPDF.textContent = "Gerando PDF…";
      document.body.classList.add("pdf-mode");

      const opt = Portal.opcoesPDF("contrato", empresaKey);

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

Nuvem.iniciar("contrato", quill);
