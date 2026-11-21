# Postal Ubá — Consulta de CEPs de Ubá (MG)

Landing page interativa para consulta local de logradouros (Ruas, Avenidas e Praças) e Códigos de Endereçamento Postal (CEP) do município de **Ubá - MG**.

Projeto desenvolvido como atividade prática da disciplina de **Programação 2 (Desenvolvimento Web)** do curso de **Bacharelado em Sistemas de Informação** da **Universidade do Estado de Minas Gerais (UEMG) — Unidade Acadêmica de Carangola** (2º Período).

## Funcionalidades
* **Busca reativa (autocomplete):** o filtro começa a partir de 3 caracteres digitados, ignorando acentos, e lista os logradouros em um menu suspenso (navegável pelo mouse ou pelas setas do teclado).
* **Resultado com destaque no CEP:** logradouro, bairro, complemento, cidade/UF e DDD/IBGE, com o CEP exibido dígito a dígito e botão para copiá-lo.
* **Carrossel de fotos da cidade** em formato de pilha de cartões-postais, com cartão descritivo sincronizado.
* **Janelas flutuantes (modais) acessíveis:** Sobre (com a equipe de desenvolvimento e a nota de transparência sobre IA), Termos de Uso e Política de Privacidade.

## Tecnologias Utilizadas
* **HTML5 Semântico** (`header`, `main`, `section`, `article`, `aside`, `figure`, `footer`, `dl`, atributos ARIA)
* **CSS3 Puro** (variáveis CSS, Flexbox, CSS Grid, animações, design mobile-first com media queries)
* **JavaScript Vanilla (ES6+)** (Fetch API, manipulação do DOM, controle de modais e do carrossel)
* **Fontes locais** (DM Sans, DM Serif Display e DM Mono em `assets/fonts/`), sem requisições a servidores externos.
* **Sem bibliotecas ou frameworks.**

## Base de Dados
O arquivo `data/ceps.json` foi consolidado a partir das consultas à API pública ViaCEP para `Rua`, `Avenida` e `Praca` de Ubá/MG, com registros duplicados removidos. Como a API faz busca parcial pelo nome do município (retornando também Janaúba, Itajubá e Juatuba), a aplicação filtra apenas os registros de **Ubá/MG** ao carregar a base.

## Estrutura
```
cep-uba/
├── index.html          # Documento principal em HTML5 semântico
├── css/styles.css      # Estilos e responsividade
├── js/app.js           # Busca, resultado, modais e carrossel
├── data/ceps.json      # Base unificada e higienizada de CEPs
├── assets/             # Logos, fotos, carimbo, esboço da igreja, fotos da equipe e fontes
└── README.md
```

## Autores
* **Danielly Dodó** — [GitHub](https://github.com/daniellydodo)
* **Luciano Rocha** — [GitHub](https://github.com/l1wba)
* **Maria Eduarda** — [GitHub](https://github.com/mariahernands)
* **Mateus Garona** — [GitHub](https://github.com/garonaz)

## Como Executar Localmente
Por utilizar `fetch('./data/ceps.json')`, abra o projeto através de um servidor HTTP local (como a extensão **Live Server** do VS Code) para evitar bloqueios de CORS do navegador ao abrir arquivos diretamente via `file://`.
