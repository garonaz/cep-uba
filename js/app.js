document.addEventListener('DOMContentLoaded', () => {
  // Município atendido pelo grupo (usado para garantir que só registros de Ubá/MG sejam exibidos)
  const CIDADE_ALVO = 'Ubá';
  const UF_ALVO = 'MG';
  const MIN_CARACTERES = 3;
  const MAX_SUGESTOES = 25;

  let baseCeps = [];
  let erroCarregamento = false;
  let sugestoesAtuais = [];
  let indiceAtivo = -1;

  // Elementos da busca
  const inputBusca = document.getElementById('input-logradouro');
  const btnLimpar = document.getElementById('btn-limpar');
  const listaSugestoes = document.getElementById('lista-sugestoes');
  const hintBusca = document.getElementById('search-hint');

  // Elementos do resultado
  const resultadoVazio = document.getElementById('result-empty');
  const resultadoConteudo = document.getElementById('result-content');
  const resCep = document.getElementById('res-cep');
  const resLogradouro = document.getElementById('res-logradouro');
  const resBairro = document.getElementById('res-bairro');
  const resComplemento = document.getElementById('res-complemento');
  const resLocalidade = document.getElementById('res-localidade');
  const resIbge = document.getElementById('res-ibge');
  const btnCopiarCep = document.getElementById('btn-copiar-cep');
  const btnNovaBusca = document.getElementById('btn-nova-busca');

  const TEXTO_HINT_INICIAL = `Digite pelo menos <strong>${MIN_CARACTERES} caracteres</strong> para ver sugestões.`;
  const TEXTO_ERRO_BASE = '<strong>Aviso:</strong> não foi possível carregar a base local de CEPs. Abra a página por um servidor web (Live Server, GitHub Pages ou Vercel).';

  // Função utilitária para remover acentos e facilitar a busca
  function normalizarTexto(texto) {
    return (texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // 1. Carregamento assíncrono do JSON local via Fetch API
  async function carregarBaseCeps() {
    try {
      const response = await fetch('./data/ceps.json');
      if (!response.ok) {
        throw new Error(`Erro HTTP ao carregar JSON: ${response.status}`);
      }
      const dados = await response.json();

      // Filtro por cidade: a API ViaCEP faz busca parcial pelo nome do município
      // ("Uba" também retorna Janaúba, Itajubá, Juatuba...), então mantemos apenas Ubá/MG.
      const cidadeNorm = normalizarTexto(CIDADE_ALVO);
      baseCeps = dados.filter((item) =>
        normalizarTexto(item.localidade) === cidadeNorm &&
        (item.uf || '').toUpperCase() === UF_ALVO
      );
    } catch (erro) {
      console.error('Falha ao carregar ./data/ceps.json:', erro);
      erroCarregamento = true;
      hintBusca.innerHTML = TEXTO_ERRO_BASE;
    }
  }

  // 2. Renderizar sugestões no dropdown
  function exibirSugestoes(resultados) {
    listaSugestoes.innerHTML = '';
    sugestoesAtuais = resultados.slice(0, MAX_SUGESTOES);
    indiceAtivo = -1;
    inputBusca.removeAttribute('aria-activedescendant');

    if (sugestoesAtuais.length === 0) {
      const liVazio = document.createElement('li');
      liVazio.className = 'suggestions-empty';
      liVazio.textContent = 'Nenhum logradouro de Ubá encontrado com esse termo.';
      listaSugestoes.appendChild(liVazio);
    } else {
      sugestoesAtuais.forEach((item, indice) => {
        const li = document.createElement('li');
        li.id = `sugestao-${indice}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        li.tabIndex = -1;

        const textos = document.createElement('span');

        const spanRua = document.createElement('span');
        spanRua.className = 'suggestion-street';
        spanRua.textContent = item.logradouro;

        const spanMeta = document.createElement('span');
        spanMeta.className = 'suggestion-meta';
        spanMeta.textContent = item.bairro || 'Bairro não especificado';

        textos.append(spanRua, spanMeta);

        const spanCep = document.createElement('span');
        spanCep.className = 'suggestion-cep';
        spanCep.textContent = item.cep;

        li.append(textos, spanCep);

        li.addEventListener('click', () => selecionarItem(item));
        li.addEventListener('keydown', (evento) => {
          if (evento.key === 'Enter') selecionarItem(item);
        });

        listaSugestoes.appendChild(li);
      });
    }

    listaSugestoes.hidden = false;
    inputBusca.setAttribute('aria-expanded', 'true');
  }

  function fecharSugestoes() {
    listaSugestoes.hidden = true;
    indiceAtivo = -1;
    inputBusca.setAttribute('aria-expanded', 'false');
    inputBusca.removeAttribute('aria-activedescendant');
  }

  // Destaca a sugestão ativa ao navegar com as setas do teclado
  function marcarSugestaoAtiva(novoIndice) {
    const opcoes = listaSugestoes.querySelectorAll('[role="option"]');
    if (opcoes.length === 0) return;

    indiceAtivo = (novoIndice + opcoes.length) % opcoes.length;
    opcoes.forEach((opcao, i) => {
      opcao.setAttribute('aria-selected', String(i === indiceAtivo));
    });

    const ativa = opcoes[indiceAtivo];
    inputBusca.setAttribute('aria-activedescendant', ativa.id);
    ativa.scrollIntoView({ block: 'nearest' });
  }

  function selecionarItem(item) {
    preencherResultado(item);
    inputBusca.value = item.logradouro;
    btnLimpar.hidden = false;
    fecharSugestoes();
  }

  // 3. Exibir detalhes completos com destaque absoluto no CEP (um dígito por caixa)
  function renderizarCep(cep) {
    resCep.innerHTML = '';
    const texto = cep || '';

    // texto lido por leitores de tela (as caixinhas abaixo são só visuais)
    const textoAcessivel = document.createElement('span');
    textoAcessivel.className = 'sr-only';
    textoAcessivel.textContent = texto || 'não informado';
    resCep.appendChild(textoAcessivel);

    [...texto].forEach((caractere, i) => {
      const span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      if (caractere === '-') {
        span.className = 'cep-dash';
        span.textContent = '–';
      } else {
        span.className = 'cep-digit';
        span.textContent = caractere;
        span.style.animationDelay = `${i * 35}ms`;
      }
      resCep.appendChild(span);
    });
  }

  function preencherResultado(item) {
    renderizarCep(item.cep);
    resLogradouro.textContent = item.logradouro || '—';
    resBairro.textContent = item.bairro || 'Não especificado';
    resComplemento.textContent = item.complemento || 'Sem complemento';
    resLocalidade.textContent = `${item.localidade || CIDADE_ALVO} / ${item.uf || UF_ALVO}`;
    resIbge.textContent = `${item.ddd || '32'} · ${item.ibge || '3169901'}`;

    btnCopiarCep.dataset.cep = item.cep || '';
    btnCopiarCep.lastChild.textContent = ' Copiar CEP';
    resultadoVazio.hidden = true;
    resultadoConteudo.hidden = false;
  }

  function limparBusca() {
    inputBusca.value = '';
    btnLimpar.hidden = true;
    fecharSugestoes();
    resultadoConteudo.hidden = true;
    resultadoVazio.hidden = false;
    hintBusca.innerHTML = TEXTO_HINT_INICIAL;
    inputBusca.focus();
  }

  // 4. Evento de digitação reativa (dispara somente com 3 ou mais caracteres)
  inputBusca.addEventListener('input', (evento) => {
    const termoBruto = evento.target.value;
    btnLimpar.hidden = termoBruto.length === 0;

    const termoNormalizado = normalizarTexto(termoBruto);

    if (erroCarregamento) {
      hintBusca.innerHTML = TEXTO_ERRO_BASE;
      return;
    }

    if (termoNormalizado.length < MIN_CARACTERES) {
      fecharSugestoes();
      hintBusca.innerHTML = TEXTO_HINT_INICIAL;
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

  // Navegação do autocomplete pelo teclado (setas, Enter e Esc)
  inputBusca.addEventListener('keydown', (evento) => {
    if (listaSugestoes.hidden) return;

    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      marcarSugestaoAtiva(indiceAtivo + 1);
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      marcarSugestaoAtiva(indiceAtivo - 1);
    } else if (evento.key === 'Enter' && indiceAtivo >= 0) {
      evento.preventDefault();
      selecionarItem(sugestoesAtuais[indiceAtivo]);
    }
  });

  btnLimpar.addEventListener('click', limparBusca);
  btnNovaBusca.addEventListener('click', limparBusca);

  // Fechar dropdown ao clicar fora da área de busca
  document.addEventListener('click', (evento) => {
    if (!evento.target.closest('.search-box')) {
      fecharSugestoes();
    }
  });

  // Botão de copiar CEP para a área de transferência
  btnCopiarCep.addEventListener('click', async () => {
    const cepTexto = btnCopiarCep.dataset.cep;
    try {
      await navigator.clipboard.writeText(cepTexto);
      btnCopiarCep.lastChild.textContent = ' CEP copiado!';
    } catch {
      btnCopiarCep.lastChild.textContent = ' Não foi possível copiar';
    }
    setTimeout(() => {
      btnCopiarCep.lastChild.textContent = ' Copiar CEP';
    }, 2000);
  });

  // Links para #busca ("Encontrar CEP" e "Pular para a busca") levam o foco direto ao campo
  document.querySelectorAll('a[href="#busca"]').forEach((link) => {
    link.addEventListener('click', () => {
      setTimeout(() => inputBusca.focus({ preventScroll: true }), 350);
    });
  });

  // 5. Controle dos Modais Flutuantes (Sobre, Termos, Privacidade)
  const overlaysModais = document.querySelectorAll('.modal-overlay');
  let elementoAntesDoModal = null;

  function abrirModal(modal) {
    elementoAntesDoModal = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const botaoFechar = modal.querySelector('[data-close-modal]');
    if (botaoFechar) botaoFechar.focus();
  }

  function fecharModal(modal) {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (elementoAntesDoModal) elementoAntesDoModal.focus();
  }

  document.querySelectorAll('[data-modal]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const modalAlvo = document.getElementById(botao.getAttribute('data-modal'));
      if (modalAlvo) abrirModal(modalAlvo);
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const modalPai = botao.closest('.modal-overlay');
      if (modalPai) fecharModal(modalPai);
    });
  });

  overlaysModais.forEach((overlay) => {
    // Clique no fundo escurecido fecha o modal
    overlay.addEventListener('click', (evento) => {
      if (evento.target === overlay) fecharModal(overlay);
    });

    // Mantém o foco do teclado dentro do modal aberto
    overlay.addEventListener('keydown', (evento) => {
      if (evento.key !== 'Tab') return;
      const focaveis = overlay.querySelectorAll('a[href], button:not([disabled])');
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    });
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      overlaysModais.forEach((modal) => fecharModal(modal));
      fecharSugestoes();
    }
  });

  // 6. Carrossel de fotos do Hero (pilha de cartões-postais)
  function iniciarCarrossel() {
    const pilha = document.querySelector('[data-carousel]');
    if (!pilha) return;

    const fotos = [...pilha.querySelectorAll('[data-slide]')];
    const botaoProxima = pilha.querySelector('.photo-stack-next');
    if (fotos.length < 2) return;

    const INTERVALO = 8000; // tempo que cada foto fica em destaque antes da troca
    const DURACAO_SAIDA = 500;   // foto da frente sendo tirada da pilha (igual ao CSS .is-leaving)
    const DURACAO_ENTRADA = 750; // fotos se reorganizando na pilha (igual ao transition do CSS)
    const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ordem = [...fotos];
    let animando = false;
    let temporizador = null;

    function aplicarPosicoes() {
      ordem.forEach((foto, posicao) => {
        foto.dataset.pos = String(posicao);
        foto.setAttribute('aria-hidden', String(posicao !== 0));
      });
    }

    // Cartão sincronizado: mostra título e descrição da foto em destaque
    const cartao = document.querySelector('[data-note]');
    const cartaoTitulo = cartao ? cartao.querySelector('[data-note-titulo]') : null;
    const cartaoTexto = cartao ? cartao.querySelector('[data-note-texto]') : null;
    const DURACAO_CARTAO = 280; // igual ao transition do CSS .postcard-note.is-changing

    function preencherCartao(foto) {
      if (!cartao) return;
      cartaoTitulo.textContent = foto.dataset.titulo || '';
      cartaoTexto.textContent = foto.dataset.texto || '';
    }

    function trocarCartao(foto) {
      if (!cartao) return;
      if (movimentoReduzido) {
        preencherCartao(foto);
        return;
      }
      cartao.classList.add('is-changing');
      setTimeout(() => {
        preencherCartao(foto);
        cartao.classList.remove('is-changing');
      }, DURACAO_CARTAO);
    }

    function proximaFoto() {
      if (animando) return;
      animando = true;

      const frente = ordem[0];
      // 1º tempo: a foto da frente é "tirada" da pilha
      frente.classList.add('is-leaving');
      // o cartão "Lembranças de Ubá" troca junto, já com o texto da próxima foto
      trocarCartao(ordem[1]);

      setTimeout(() => {
        // 2º tempo: ela vai para o fundo e as outras avançam uma posição
        ordem = [...ordem.slice(1), frente];
        aplicarPosicoes();
        frente.classList.remove('is-leaving');
        setTimeout(() => {
          animando = false;
          // a contagem dos 8 s só começa depois que a nova foto termina de chegar à frente
          if (autoplayAtivo) agendarProxima();
        }, movimentoReduzido ? 0 : DURACAO_ENTRADA);
      }, movimentoReduzido ? 0 : DURACAO_SAIDA);
    }

    let autoplayAtivo = false;

    function agendarProxima() {
      clearTimeout(temporizador);
      temporizador = setTimeout(proximaFoto, INTERVALO);
    }

    function iniciarAutoplay() {
      if (movimentoReduzido || autoplayAtivo) return;
      autoplayAtivo = true;
      if (!animando) agendarProxima();
    }

    function pararAutoplay() {
      autoplayAtivo = false;
      clearTimeout(temporizador);
      temporizador = null;
    }

    botaoProxima.addEventListener('click', () => {
      // troca na hora; se a troca automática estiver ativa, os 8 s recomeçam ao fim da animação
      clearTimeout(temporizador);
      proximaFoto();
    });

    // Pausa enquanto o usuário está com o mouse ou o foco sobre as fotos
    pilha.addEventListener('mouseenter', pararAutoplay);
    pilha.addEventListener('mouseleave', iniciarAutoplay);
    pilha.addEventListener('focusin', pararAutoplay);
    pilha.addEventListener('focusout', iniciarAutoplay);

    // Não gasta processamento com a aba em segundo plano
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pararAutoplay();
      else iniciarAutoplay();
    });

    aplicarPosicoes();
    preencherCartao(ordem[0]);
    iniciarAutoplay();
  }

  iniciarCarrossel();
  carregarBaseCeps();
});
