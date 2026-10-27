# nós — Catálogo de fornecedores

Catálogo de fornecedores em duas fases:

| Fase | Situação | O que é |
| --- | --- | --- |
| 1 — MVP | **Implementado e testado localmente** | Site estático em HTML, CSS e JavaScript puro, com dados fictícios em JSON. Sem back-end, sem banco e sem dependências externas. |
| 2 — Sistema funcional | **Proposta, não implementado** | API em PHP com MySQL, login de administrador e persistência real. Só existe como documentação em `docs/`. |

**Publicação e hospedagem:** nenhuma das duas fases está publicada. Publicar o MVP e
hospedar a Fase 2 (servidor, PHP, MySQL, domínio) dependem de um ambiente aprovado pela
DTI (dti@cpeanet.com). Este README cobre só a execução local.

## Executar localmente

**Requisitos**
- Um navegador atual (Chrome, Edge ou Firefox).
- Python 3 (não é preciso instalar pacote nenhum).

O site lê `data/fornecedores.json` com `fetch`, e o navegador bloqueia essa leitura
quando a página é aberta direto do disco (`file://`). Por isso ele precisa de um
servidor de arquivos local. O Python já traz um.

1. Abra um terminal na pasta do projeto:
   ```bash
   cd D:\Projetos\CPEA\nos
   ```
2. Suba o servidor, acessível só nesta máquina:
   ```bash
   python -m http.server 8000 --bind 127.0.0.1
   ```
3. No navegador, acesse <http://127.0.0.1:8000/>.
4. Para parar, use `Ctrl+C` no terminal.

Se a porta 8000 estiver ocupada, use outra (por exemplo, `8080`) nos passos 2 e 3.

## Estrutura atual (Fase 1)

```text
nos/
├── index.html              catálogo
├── fornecedor.html         detalhes (?id=N)
├── admin.html              painel de demonstração
├── css/style.css           layout e responsividade
├── data/fornecedores.json  dados fictícios (12 fornecedores, 1 em rascunho)
├── assets/imagens/         imagens dos fornecedores e ícone
├── js/
│   ├── util.js               escape de HTML, normalização de texto, tags
│   ├── modelo.js             converte o registro do JSON no objeto usado pelas telas
│   ├── repositorio.js        camada de dados: pesquisa, filtros, leitura e gravação
│   ├── catalogo.js           tela do catálogo
│   ├── detalhe.js            tela de detalhes
│   ├── validacao.js          regras do formulário (as mesmas de docs/api.md)
│   ├── imagem.js             redução da imagem enviada no painel
│   ├── admin-formulario.js   formulário de cadastro e edição
│   └── admin.js              lista, exclusão e restauração do painel
└── docs/                   PROPOSTA, NÃO IMPLEMENTADO
    ├── api.md                contratos da futura API
    └── arquitetura-futura.md PHP + MySQL: diretórios, camadas, modelo relacional, segurança
```

Todos os caminhos são relativos.

### Decisões de arquitetura do front-end

- **Três partes:** apresentação (HTML e CSS), lógica de interface (`catalogo.js`,
  `detalhe.js`, `admin*.js`) e acesso a dados (`repositorio.js` e `modelo.js`).
- **Só a camada de dados conhece a fonte.** As telas chamam `pesquisar`, `buscar`,
  `listarCategorias` e, no painel, `listarTodos`, `criar`, `editar` e `excluir`.
  A pesquisa e os filtros ficam nessa camada, porque com a API quem filtra é o
  servidor.
- **Métodos assíncronos:** todos devolvem Promise, como uma chamada `fetch` faria.
  Trocar JSON por API é escrever uma classe com os mesmos métodos e mudar
  `criarRepositorio()`. As telas não mudam (correspondência na seção 5 de
  `docs/api.md`).
- **Telas não dependem da estrutura do JSON.** `modelo.js` converte cada registro
  num objeto pronto para exibição, com `local`, `imagemExibicao` e `contatos` já
  com link. Se um campo mudar de nome na fonte, muda só esse arquivo.
- **Pouca POO:** só duas classes. O repositório é o ponto de troca JSON → API, e o
  formulário guarda estado e dependências. O resto é função simples, sem framework.

## Funcionalidades da Fase 1

**Catálogo (`index.html`)**
- Cards com imagem, nome, cidade/UF e categorias. Sem imagem, o card mostra as
  iniciais.
- Pesquisa por nome ou palavra-chave (descrição, cidade, UF, categoria), sem
  diferenciar acento nem maiúscula.
- Filtro por categoria, que combina com a pesquisa.
- Só aparecem os fornecedores publicados.

**Detalhes (`fornecedor.html?id=N`)**
- Imagem, descrição, categorias e contatos preenchidos, cada um como link.
- Rascunho ou id inexistente mostram "Fornecedor não encontrado".

**Painel de demonstração (`admin.html`)**
- Criar, editar e excluir; publicar ou deixar em rascunho.
- Marcar categorias existentes ou criar novas.
- Enviar imagem, que é reduzida para no máximo 800 px.
- Validar campos antes de salvar.
- Restaurar os dados originais.

**Layout:** responsivo; no celular a grade e os detalhes ficam em uma coluna.

**Editar os dados fictícios:** altere `data/fornecedores.json`. Se o painel já foi
usado neste navegador, as alterações locais têm prioridade: use **Restaurar dados
originais** para ver o JSON editado.

## Limitações de cada fase

**Fase 1 (MVP) — não é um sistema seguro nem multiusuário**
- **Sem login.** O painel não tem autenticação, nem simulada: qualquer pessoa com
  acesso à página pode usá-lo.
- **Alterações só neste navegador.** Ficam no localStorage, não mudam o JSON,
  ninguém mais as vê e somem se os dados do site forem limpos. O limite é de cerca
  de 5 MB.
- **Validação só para avisar o usuário.** Ela roda no navegador e pode ser
  contornada; não é proteção.
- **Sem dados reais.** Os dados são fictícios. Não insira dados reais, de clientes,
  pessoais ou confidenciais.
- **Sem segredos no código.** O código não contém credenciais, chaves nem tokens,
  porque nesta fase não há nenhum.

**Fase 2 (PHP + MySQL) — não existe**
- **Só documentação.** Há apenas os documentos em `docs/`, marcados como proposta.
  Não há arquivo PHP, SQL executável, login nem API.
- **Nada construído, nada testado.** Nenhum requisito de segurança de
  `docs/arquitetura-futura.md` (seção 5) foi implementado ou testado.
- **Ajustes previstos no front na troca para a API:** categorias por id, upload de
  imagem pela API, tela de login e envio do token CSRF (`docs/api.md`, seção 5).
- **Hospedagem, banco, backups e credenciais** dependem da DTI.

**Futuramente no servidor (Fase 2):**
- autenticação;
- autorização em toda rota de escrita;
- validação dos dados (a do front só avisa);
- persistência;
- proteção contra ataques: SQL injection, CSRF, XSS, upload malicioso, força bruta
  no login;
- gerenciamento de credenciais.

O detalhe de cada item está em `docs/arquitetura-futura.md`.

## Testes funcionais realizados (Fase 1)

Testes automatizados no Chrome sem interface (headless), com o site servido em
`127.0.0.1`. Resultado: todos os 44 testes passaram.

**Pesquisa e filtros**
- O catálogo lista só os 11 publicados de 12, com contagem correta.
- A pesquisa funciona sem acento ("sao paulo") e com maiúsculas ("LABORATÓRIO").
- Pesquisa sem resultado mostra o aviso.
- O filtro por categoria deixa o rascunho de fora.
- Filtro e pesquisa combinados.
- "Todas" volta à lista completa.

**Detalhes**
- Nome, 4 contatos e link `wa.me` corretos.
- Rascunho e id inexistente mostram o aviso.
- Clicar no card abre o detalhe.
- Edição feita no painel aparece no detalhe.

**Edição e exclusão (demonstração)**
- Cadastro com upload de imagem, que vira JPEG reduzido.
- O novo fornecedor aparece no catálogo, e a nova categoria vira filtro.
- Editar preenche o formulário.
- Publicado que vira rascunho sai do catálogo.
- Excluir remove; cancelar a exclusão mantém.
- Restaurar volta aos dados originais.

**Validação do formulário**
- Recusa UF, WhatsApp, e-mail e nome inválidos, e site `javascript:`.
- Nada é gravado quando a validação falha.

**Camada de dados, chamada direto**
- `pesquisar` com termo e categoria.
- `pesquisar()` devolve só publicados.
- `buscar` de rascunho devolve `null`.
- O modelo entrega `local`, `contatos` e imagem prontos.
- `listarCategorias` vem ordenada.
- Os métodos devolvem Promise.

**Layout e carregamento**
- Celular (390 px) sem rolagem horizontal no catálogo e nos detalhes.
- Todas as imagens carregam.
- Aberto via `file://`, mostra a orientação do README.
- Console sem erros.

**Não verificado:**
- Firefox e Safari;
- celular físico (simulado no Chrome);
- leitor de tela e acessibilidade em geral;
- desempenho com muitos fornecedores.

## Verificações de segurança

Código organizado não é o mesmo que código seguro. O que foi verificado é pouco e
cobre só a Fase 1.

**Feitas (Fase 1):**
- Texto digitado com HTML (`<img onerror=...>`) é exibido como texto e não executa.
- Links `javascript:` no site são recusados, e só imagens `data:image` ou de
  `assets/` são exibidas.
- Busca no código: nenhuma senha, token, chave ou credencial; nenhum arquivo PHP,
  SQL ou `.env`.
- Nenhum script, estilo ou fonte carregado de fora: todos os caminhos são relativos.

**Não feitas:**
- Teste de invasão (pentest) ou revisão de segurança por especialista.
- Cabeçalhos de segurança (CSP, HSTS etc.): dependem de onde o site for hospedado.
- Autenticação, autorização, CSRF, SQL injection, upload no servidor e gestão de
  credenciais: não existem nesta fase e só poderão ser testados quando a Fase 2
  existir.
- Revisão de LGPD para dados reais de fornecedores.
