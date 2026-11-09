"use strict";
// CORREÇÃO PROPOSTA — NÃO ATIVADA (aguarda sua autorização, pois altera o PDF gerado).
//
// Problema encontrado (existe também na versão anterior ao redesign):
// na PRIMEIRA geração após abrir contrato.html, recibo.html ou orcamento.html,
// o html2pdf mede a altura do documento antes de o logo da empresa terminar de
// carregar. O logo empurra o conteúdo para baixo e o final do documento é cortado.
// Exemplos observados nos testes: no contrato somem as linhas de assinatura, os
// nomes, o CPF/CNPJ e a data final; no orçamento some a seção Observações.
// Ao gerar uma segunda vez na mesma página, o PDF sai completo.
//
// Correção: pré-carregar o logo assim que a página abre. Não muda texto, layout,
// regras nem paginação do documento completo; apenas garante que a primeira
// geração seja igual às seguintes.
//
// Para ativar, adicione esta linha nas três páginas de documento, logo após
// <script src="js/documento-ui.js"></script>:
//   <script src="js/correcao-logo-pdf.js"></script>
(() => {
  if (typeof empresa === "undefined" || !empresa.logo) return;
  const logo = new Image();
  logo.src = empresa.logo;
})();
