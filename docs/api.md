# Contratos da API — PROPOSTA, NÃO IMPLEMENTADO

> **Status:** proposta. Nenhuma destas rotas existe. O MVP não chama API nenhuma: lê
> `data/fornecedores.json`. Este documento define o que a futura API em PHP deve
> oferecer para substituir a camada de dados do front-end (`js/repositorio.js`).

## 1. Convenções

- Base: `/api`. Corpo das requisições e respostas em JSON UTF-8
  (`Content-Type: application/json; charset=utf-8`).
- Datas em ISO 8601 com fuso (`2026-10-27T14:30:00-03:00`).
- Rotas públicas: só leitura e só fornecedores com `status = "publicado"`.
- Rotas `/api/admin/...`:
  - exigem sessão de administrador autenticado;
  - nas que alteram dados (`POST`, `PUT`, `DELETE`), exigem também o cabeçalho
    `X-CSRF-Token` (ver `arquitetura-futura.md`, seção 5).
- Campos desconhecidos no corpo são recusados com `422`, para não gravar dado
  inesperado.

## 2. Recursos

### Fornecedor (resposta)

```json
{
  "id": 1,
  "nome": "Alfa Equipamentos",
  "descricao": "Venda e locação de equipamentos de medição de campo.",
  "imagem_url": "/uploads/fornecedores/1/7f3a.jpg",
  "categorias": [{ "id": 2, "nome": "Equipamentos" }],
  "cidade": "São Paulo",
  "uf": "SP",
  "site": "https://alfa.example",
  "telefone": "(11) 90000-0001",
  "email": "contato@alfa.example",
  "whatsapp": "5511900000001",
  "status": "publicado",
  "criado_em": "2026-10-27T14:30:00-03:00",
  "atualizado_em": "2026-10-27T14:30:00-03:00"
}
```

- Nas rotas públicas, `status`, `criado_em` e `atualizado_em` podem ser omitidos.
- Campos opcionais vazios voltam como `null`.

### Categoria (resposta)

```json
{ "id": 2, "nome": "Equipamentos", "descricao": null }
```

### Erro (formato único para qualquer status 4xx/5xx)

```json
{
  "erro": {
    "codigo": "validacao",
    "mensagem": "Há campos inválidos.",
    "campos": {
      "nome": ["obrigatorio"],
      "uf": ["valor_invalido"]
    }
  }
}
```

- `campos` só aparece em erros de validação.
- Em `500`, a mensagem é genérica: o detalhe técnico vai para o log do servidor e
  nunca para a resposta.

| HTTP | `codigo` | Quando |
| --- | --- | --- |
| 400 | `requisicao_invalida` | JSON malformado ou parâmetro de consulta inválido |
| 401 | `nao_autenticado` | Rota admin sem sessão válida |
| 403 | `sem_permissao` | Sessão válida sem permissão, ou token CSRF ausente/inválido |
| 404 | `nao_encontrado` | Id inexistente (ou fornecedor em rascunho, nas rotas públicas) |
| 409 | `conflito` | Nome de categoria repetido; categoria em uso ao excluir |
| 413 | `arquivo_grande` | Imagem acima do limite |
| 415 | `tipo_nao_suportado` | Corpo que não é JSON, ou imagem fora dos formatos aceitos |
| 422 | `validacao` | Campos inválidos (ver seção 4) |
| 429 | `muitas_tentativas` | Excesso de tentativas de login |
| 500 | `erro_interno` | Falha não prevista |

## 3. Rotas

### Públicas (sem login)

| Método e rota | Descrição | Sucesso | Erros |
| --- | --- | --- | --- |
| `GET /api/fornecedores` | Lista os publicados, com pesquisa e filtro | 200 | 400 |
| `GET /api/fornecedores/{id}` | Um fornecedor publicado | 200 | 404 |
| `GET /api/categorias` | Todas as categorias | 200 | — |

Parâmetros de `GET /api/fornecedores`, todos opcionais:

| Parâmetro | Regra |
| --- | --- |
| `termo` | Texto de 0 a 100 caracteres. Busca em nome, descrição, cidade, UF e nome da categoria, sem diferenciar acento nem caixa. |
| `categoria_id` | Inteiro positivo. Id inexistente devolve lista vazia. |
| `pagina` | Inteiro ≥ 1. Padrão 1. |
| `por_pagina` | Inteiro de 1 a 50. Padrão 20. |

Resposta `200`:

```json
{
  "dados": [ { "...": "Fornecedor" } ],
  "paginacao": { "pagina": 1, "por_pagina": 20, "total": 11 }
}
```

### Sessão do administrador

| Método e rota | Descrição | Sucesso | Erros |
| --- | --- | --- | --- |
| `POST /api/admin/sessao` | Login com `{ "email", "senha" }` | 200, com `{ "email", "csrf_token" }` | 400, 401, 422, 429 |
| `GET /api/admin/sessao` | Dados da sessão atual e token CSRF | 200 | 401 |
| `DELETE /api/admin/sessao` | Logout | 204 | 401, 403 |

- A resposta de login é a mesma para e-mail inexistente e para senha errada (`401`),
  para não revelar quais e-mails estão cadastrados.

### Administração (com login)

| Método e rota | Descrição | Sucesso | Erros |
| --- | --- | --- | --- |
| `GET /api/admin/fornecedores` | Lista todos, aceita `status` (`rascunho`/`publicado`) e os parâmetros da lista pública | 200 | 400, 401 |
| `GET /api/admin/fornecedores/{id}` | Um fornecedor, qualquer status | 200 | 401, 404 |
| `POST /api/admin/fornecedores` | Cria | 201 + cabeçalho `Location` + Fornecedor | 400, 401, 403, 415, 422 |
| `PUT /api/admin/fornecedores/{id}` | Substitui todos os campos editáveis | 200 + Fornecedor | 400, 401, 403, 404, 415, 422 |
| `DELETE /api/admin/fornecedores/{id}` | Exclui; também remove as ligações com categorias e a imagem | 204 | 401, 403, 404 |
| `POST /api/admin/fornecedores/{id}/imagem` | Envia ou troca a imagem (`multipart/form-data`, campo `arquivo`) | 200 + Fornecedor | 401, 403, 404, 413, 415 |
| `DELETE /api/admin/fornecedores/{id}/imagem` | Remove a imagem | 204 | 401, 403, 404 |
| `POST /api/admin/categorias` | Cria `{ "nome", "descricao" }` | 201 + Categoria | 401, 403, 409, 422 |
| `PUT /api/admin/categorias/{id}` | Renomeia | 200 + Categoria | 401, 403, 404, 409, 422 |
| `DELETE /api/admin/categorias/{id}` | Exclui se não houver fornecedor usando | 204 | 401, 403, 404, 409 |

Corpo de `POST` e `PUT /api/admin/fornecedores`:

```json
{
  "nome": "Alfa Equipamentos",
  "descricao": "Venda e locação de equipamentos de medição de campo.",
  "categoria_ids": [2],
  "cidade": "São Paulo",
  "uf": "SP",
  "site": "https://alfa.example",
  "telefone": "(11) 90000-0001",
  "email": "contato@alfa.example",
  "whatsapp": "5511900000001",
  "status": "rascunho"
}
```

- `id`, `imagem_url`, `criado_em` e `atualizado_em` são definidos pelo servidor e
  recusados no corpo.

## 4. Validações (fornecedor)

O servidor aplica todas. O front-end (`js/validacao.js`) repete as mesmas regras só
para avisar o usuário antes de enviar, e isso não substitui a validação do servidor.

| Campo | Obrigatório | Regra | Erro |
| --- | --- | --- | --- |
| `nome` | sim | Texto de 2 a 120 caracteres, sem espaços nas pontas | `obrigatorio`, `tamanho` |
| `descricao` | não | Até 600 caracteres | `tamanho` |
| `categoria_ids` | não (padrão `[]`) | Lista de até 10 ids existentes, sem repetir | `valor_invalido`, `nao_encontrado` |
| `cidade` | não | Até 80 caracteres | `tamanho` |
| `uf` | não | Uma das 27 siglas de UF | `valor_invalido` |
| `site` | não | URL `http://` ou `https://`, até 255 caracteres | `formato` |
| `telefone` | não | 8 a 20 caracteres: dígitos, espaço, `( ) + -` | `formato` |
| `email` | não | E-mail válido, até 254 caracteres | `formato` |
| `whatsapp` | não | Só dígitos, de 10 a 15 (com DDI e DDD) | `formato` |
| `status` | sim | `rascunho` ou `publicado` | `obrigatorio`, `valor_invalido` |
| imagem (upload) | não | JPEG, PNG ou WebP, conferido pelo conteúdo do arquivo e não pela extensão; até 2 MB; o servidor regrava a imagem e descarta metadados | 413, 415 |

Categoria:

- `nome` é obrigatório, de 2 a 60 caracteres, e único, sem diferenciar acento nem
  caixa. Repetido devolve `409`.
- `descricao` vai até 255 caracteres.

## 5. Correspondência com o front-end

Na Fase 2, `criarRepositorio()` passa a devolver uma classe com os mesmos métodos,
mas usando `fetch`. As telas não mudam.

| Método em `js/repositorio.js` | Rota |
| --- | --- |
| `pesquisar({ termo, categoria })` | `GET /api/fornecedores?termo=&categoria_id=` |
| `buscar(id)` | `GET /api/fornecedores/{id}` (404 → `null`) |
| `listarCategorias()` | `GET /api/categorias` |
| `listarTodos()` | `GET /api/admin/fornecedores` |
| `criar(dados)` | `POST /api/admin/fornecedores` (+ imagem, se houver) |
| `editar(id, dados)` | `PUT /api/admin/fornecedores/{id}` |
| `excluir(id)` | `DELETE /api/admin/fornecedores/{id}` |
| `temAlteracoesLocais()`, `restaurarDadosOriginais()` | Não existem: são só da demonstração. |

Ajustes previstos na troca:

- **Categorias:** hoje o front trabalha com o nome da categoria. A API usa
  `categoria_ids`, então o filtro e o formulário passam a usar ids. A tela que cria
  categoria nova também passa a chamar `POST /api/admin/categorias`.
- **Imagem:** deixa de ir como data URL no JSON e passa a ser enviada pela rota de
  upload.
- **Erros:** o `{ "erro": ... }` da API vira um `Error` com a `mensagem`, e as telas
  já exibem `erro.message`.
- **Login:** o painel ganha a tela de login (`/api/admin/sessao`) e passa a enviar o
  `X-CSRF-Token`.
