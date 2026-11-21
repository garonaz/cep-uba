# Consulta Canônica de CEPs — Ubá (MG)

Landing page interativa para consulta local de logradouros (Ruas, Avenidas e Praças) e Códigos de Endereçamento Postal (CEP) do município de **Ubá - MG**.

Projeto desenvolvido como atividade prática da disciplina de **Programação 2 (Desenvolvimento Web)** do curso de **Bacharelado em Sistemas de Informação** da **Universidade do Estado de Minas Gerais (UEMG) — Unidade Acadêmica de Carangola** (2º Período).

## Tecnologias Utilizadas
* **HTML5 Semântico** (`header`, `section`, `main`, `article`, `footer`, `dl`, atributos ARIA)
* **CSS3 Puro** (Variáveis CSS, Flexbox, CSS Grid, Design Mobile-First e Media Queries)
* **JavaScript Vanilla (ES6+)** (`Fetch API`, manipulação reativa do DOM, normalização de texto sem acentos e controle de modais)
* **Base de Dados:** JSON consolidado e higienizado a partir da API pública ViaCEP (`Rua`, `Avenida` e `Praca` de Ubá/MG).

## Autores
* **Danielly Dodó**
* **Luciano Rocha**
* **Maria Eduarda**
* **Mateus Garona**

## Como Executar Localmente
Por utilizar `fetch('./data/ceps.json')`, abra o projeto através de um servidor HTTP local (como a extensão **Live Server** do VS Code) para evitar bloqueios de CORS do navegador ao abrir arquivos diretamente via `file://`.