document.addEventListener('DOMContentLoaded', () => {
  let baseCeps = [];

  // Elementos da Busca
  const inputBusca = document.getElementById('input-logradouro');
  const btnLimpar = document.getElementById('btn-limpar');
  const listaSugestoes = document.getElementById('lista-sugestoes');
  const hintBusca = document.getElementById('search-hint');

  // Elementos do Resultado
  const cardResultado = document.getElementById('resultado-cep');
  const resCep = document.getElementById('res-cep');
  const resLogradouro = document.getElementById('res-logradouro');
  const resBairro = document.getElementById('res-bairro');
  const resComplemento = document.getElementById('res-complemento');
  const resLocalidade = document.getElementById('res-localidade');
  const resIbge = document.getElementById('res-ibge');
  const btnCopiarCep = document.getElementById('btn-copiar-cep');

  // 1. Carregamento assíncrono do JSON local via Fetch API
  async function carregarBaseCeps() {
    try {
      const response = await fetch('./data/ceps.json');
      if (!response.ok) {
        throw new Error(`Erro HTTP ao carregar JSON: ${response.status}`);
      }
      baseCeps = await response.json();
    } catch (erro) {
      console.error('Falha ao carregar ./data/ceps.json:', erro);
      hintBusca.innerHTML = '<strong>Aviso:</strong> Não foi possível carregar a base local de CEPs. Verifique se a página está rodando em um servidor web (Live Server, GitHub Pages ou Vercel).';
    }
  }

  // Função utilitária para remover acentos e facilitar a busca
  function normalizarTexto(texto) {
    return (texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // 2. Renderizar sugestões no dropdown
  function exibirSugestoes(resultados) {
    listaSugestoes.innerHTML = '';

    if (resultados.length === 0) {
      const liVazio = document.createElement('li');
      liVazio.className = 'suggestions-empty';
      liVazio.textContent = 'Nenhum logradouro encontrado em Ubá com esse termo.';
      listaSugestoes.appendChild(liVazio);
    } else {
      // Limita a exibição a 25 itens para manter a UI leve e fluida
      resultados.slice(0, 25).forEach((item) => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.tabIndex = 0;

        const spanRua = document.createElement('span');
        spanRua.className = 'suggestion-street';
        spanRua.textContent = item.logradouro;

        const spanMeta = document.createElement('span');
        spanMeta.className = 'suggestion-meta';
        const bairroTexto = item.bairro ? `Bairro: ${item.bairro}` : 'Bairro não especificado';
        spanMeta.textContent = `${bairroTexto} • CEP: ${item.cep}`;

        li.appendChild(spanRua);
        li.appendChild(spanMeta);

        // Evento de clique ou Enter na sugestão
        const selecionarItem = () => {
          preencherResultado(item);
          inputBusca.value = item.logradouro;
          fecharSugestoes();
        };

        li.addEventListener('click', selecionarItem);
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') selecionarItem();
        });

        listaSugestoes.appendChild(li);
      });
    }

    listaSugestoes.hidden = false;
    inputBusca.setAttribute('aria-expanded', 'true');
  }

  function fecharSugestoes() {
    listaSugestoes.hidden = true;
    inputBusca.setAttribute('aria-expanded', 'false');
  }

  // 3. Exibir detalhes completos com destaque no CEP
  function preencherResultado(item) {
    resCep.textContent = item.cep || 'Não informado';
    resLogradouro.textContent = item.logradouro || '—';
    resBairro.textContent = item.bairro || 'Centro / Não especificado';
    resComplemento.textContent = item.complemento || 'Sem complemento';
    resLocalidade.textContent = `${item.localidade || 'Ubá'} / ${item.uf || 'MG'}`;
    resIbge.textContent = `DDD (${item.ddd || '32'}) • IBGE: ${item.ibge || '3169901'}`;

    btnCopiarCep.textContent = 'Copiar CEP';
    cardResultado.hidden = false;
  }

  // 4. Evento de digitação reativa (dispara somente com 3 ou mais letras)
  inputBusca.addEventListener('input', (evento) => {
    const termoBruto = evento.target.value;
    btnLimpar.hidden = termoBruto.length === 0;

    const termoNormalizado = normalizarTexto(termoBruto);

    if (termoNormalizado.length < 3) {
      fecharSugestoes();
      hintBusca.innerHTML = 'Digite pelo menos <strong>3 caracteres</strong> para exibir sugestões.';
      return;
    }

    const filtrados = baseCeps.filter((item) => {
      const logradouroNorm = normalizarTexto(item.logradouro);
      const bairroNorm = normalizarTexto(item.bairro);
      return logradouroNorm.includes(termoNormalizado) || bairroNorm.includes(termoNormalizado);
    });

    hintBusca.textContent = `${filtrados.length} logradouro(s) encontrado(s) em Ubá.`;
    exibirSugestoes(filtrados);
  });

  // Botão limpar campo
  btnLimpar.addEventListener('click', () => {
    inputBusca.value = '';
    btnLimpar.hidden = true;
    fecharSugestoes();
    cardResultado.hidden = true;
    hintBusca.innerHTML = 'Digite pelo menos <strong>3 caracteres</strong> para exibir sugestões.';
    inputBusca.focus();
  });

  // Fechar dropdown ao clicar fora
  document.addEventListener('click', (evento) => {
    if (!evento.target.closest('.search-box')) {
      fecharSugestoes();
    }
  });

  // Botão de copiar CEP para a área de transferência
  btnCopiarCep.addEventListener('click', async () => {
    const cepTexto = resCep.textContent;
    try {
      await navigator.clipboard.writeText(cepTexto);
      btnCopiarCep.textContent = 'CEP Copiado!';
      setTimeout(() => {
        btnCopiarCep.textContent = 'Copiar CEP';
      }, 2000);
    } catch {
      btnCopiarCep.textContent = 'Erro ao copiar';
    }
  });

  // 5. Controle dos Modais Flutuantes (Sobre, Termos, Privacidade)
  const botoesAbrirModal = document.querySelectorAll('[data-modal]');
  const botoesFecharModal = document.querySelectorAll('[data-close-modal]');
  const overlaysModais = document.querySelectorAll('.modal-overlay');

  botoesAbrirModal.forEach((botao) => {
    botao.addEventListener('click', () => {
      const idModal = botao.getAttribute('data-modal');
      const modalAlvo = document.getElementById(idModal);
      if (modalAlvo) {
        modalAlvo.hidden = false;
      }
    });
  });

  botoesFecharModal.forEach((botao) => {
    botao.addEventListener('click', () => {
      const modalPai = botao.closest('.modal-overlay');
      if (modalPai) modalPai.hidden = true;
    });
  });

  overlaysModais.forEach((overlay) => {
    overlay.addEventListener('click', (evento) => {
      if (evento.target === overlay) {
        overlay.hidden = true;
      }
    });
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      overlaysModais.forEach((modal) => {
        modal.hidden = true;
      });
      fecharSugestoes();
    }
  });

  carregarBaseCeps();
});