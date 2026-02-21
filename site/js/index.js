
  // Seleciona todos os cards de empresa
  document.querySelectorAll('.empresa').forEach(empresaCard => {
    const empresa = empresaCard.dataset.empresa;

    // Clique no card inteiro
    empresaCard.addEventListener('click', () => {
      selecionarEmpresa(empresa);
    });

    // Clique no botão (evita duplicar evento)
    const botao = empresaCard.querySelector('button');
    botao.addEventListener('click', (e) => {
      e.stopPropagation();
      selecionarEmpresa(empresa);
    });
  });

  function selecionarEmpresa(empresa) {
    // Salva a empresa escolhida
    localStorage.setItem('empresaSelecionada', empresa);

    // DEBUG (pode apagar depois)
    console.log('Empresa selecionada:', empresa);

    // Próxima tela (vamos criar depois)
    window.location.href = 'tipo.html';
    // se quiser ir direto pro contrato por enquanto:
    // window.location.href = 'contrato.html';
  }
