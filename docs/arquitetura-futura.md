# Arquitetura futura (PHP + MySQL) — PROPOSTA, NÃO IMPLEMENTADO

> **Status:** proposta. Nada aqui foi construído nem testado, e o projeto não tem
> nenhum arquivo PHP ou SQL executável. A hospedagem e o banco dependem de um
> ambiente aprovado pela DTI (dti@cpeanet.com). Este documento não descreve um
> sistema seguro: descreve o que precisa ser feito para que ele possa ser.

## 1. Visão geral

```text
Navegador ──HTTPS──> public/index.php ──> Rota ──> Controlador ──> Serviço ──> Repositório ──> MySQL
   (HTML/CSS/JS                (único ponto     (mapa      (lê a requisição,  (regras)   (SQL com PDO)
    da Fase 1)                  de entrada)     URL→ação)   chama o serviço,
                                                             devolve JSON)
```

- **Front-end:** o mesmo da Fase 1. Só troca a camada de dados (`js/repositorio.js`)
  por chamadas à API (`docs/api.md`).
- **Front controller** (`public/index.php`): o único arquivo PHP acessível pela web.
  Toda requisição para `/api/...` passa por ele, que carrega a configuração, abre a
  sessão e chama a rota.

## 2. Estrutura de diretórios proposta

```text
nos/
├── public/                     raiz exposta pelo servidor web (só isto fica acessível)
│   ├── index.php               front controller da API
│   ├── index.html, fornecedor.html, admin.html, css/, js/, assets/   front-end da Fase 1
│   └── uploads/                imagens enviadas (sem permissão de executar scripts)
├── src/
│   ├── Rotas/rotas.php         tabela método + caminho → controlador
│   ├── Http/                   Requisicao, RespostaJson, Middleware (autenticação, CSRF)
│   ├── Controladores/          FornecedorController, CategoriaController, SessaoController
│   ├── Servicos/               FornecedorService, CategoriaService, AutenticacaoService, ImagemService
│   ├── Repositorios/           FornecedorRepository (contrato) + MysqlFornecedorRepository, ...
│   └── Validacao/              FornecedorValidator, CategoriaValidator
├── config/
│   └── config.php              lê variáveis de ambiente; sem valor sensível escrito no código
├── migracoes/                  001_criar_tabelas.sql, 002_..., aplicadas em ordem
├── tests/                      unitários (serviços e validação) e de integração (API + banco de teste)
└── .env.example                lista de variáveis, sem valores reais (o .env real nunca vai para o Git)
```

O que cada camada faz:

| Camada | Responsabilidade | Não faz |
| --- | --- | --- |
| Rotas | Liga método + caminho ao controlador e diz quais rotas exigem login | Regra de negócio |
| Http / Middleware | Lê JSON, confere sessão e token CSRF, padroniza a resposta de erro | Acesso ao banco |
| Controladores | Pegam os dados da requisição, chamam validação e serviço, devolvem o status HTTP | SQL |
| Validação | Aplica as regras da seção 4 de `api.md` e devolve os erros por campo | Gravar dados |
| Serviços | Regras de negócio (ex.: só publicados nas rotas públicas; categoria em uso não é excluída) e transações | Ler `$_POST` ou montar HTTP |
| Repositórios | SQL com PDO e consultas parametrizadas; convertem linha do banco em array/objeto | Decidir regra |
| config | Lê `DB_HOST`, `DB_NOME`, `DB_USUARIO`, `DB_SENHA` etc. do ambiente | Guardar segredo no código |

## 3. Onde POO e Clean Architecture ajudam (e onde não)

**Ajudam:**
- **Repositório como classe, com contrato (`interface`):** isola o SQL. Nos testes,
  o serviço recebe um repositório em memória no lugar do MySQL. É a mesma ideia do
  `js/repositorio.js` no front.
- **Serviço com dependências no construtor:** recebe repositório e validador,
  e fica testável sem banco e sem HTTP.
- **Validador separado:** as mesmas regras servem para criar e editar, num lugar só.
- **Regra de dependência:** controlador → serviço → repositório, nunca ao contrário.
  O serviço não conhece `$_POST`, `$_SESSION` nem PDO.

**Não ajudam neste tamanho de projeto:**
- container de injeção de dependências: as peças são montadas à mão no `index.php`;
- interface para classe que só terá uma implementação e não precisa de versão de
  teste (validador e controlador não precisam);
- ORM, camada de entidades com herança, eventos ou CQRS;
- framework completo, enquanto o escopo for este CRUD. Se o escopo crescer, reavaliar.

## 4. Modelo relacional inicial (MySQL 8, `utf8mb4`)

```sql
CREATE TABLE fornecedores (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(120) NOT NULL,
  descricao     VARCHAR(600) NULL,
  imagem        VARCHAR(255) NULL,          -- caminho relativo em public/uploads
  cidade        VARCHAR(80)  NULL,
  uf            CHAR(2)      NULL,
  site          VARCHAR(255) NULL,
  telefone      VARCHAR(20)  NULL,
  email         VARCHAR(254) NULL,
  whatsapp      VARCHAR(15)  NULL,
  status        ENUM('rascunho', 'publicado') NOT NULL DEFAULT 'rascunho',
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fornecedores_status_nome (status, nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE categorias (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome      VARCHAR(60)  NOT NULL,
  descricao VARCHAR(255) NULL,
  UNIQUE KEY uq_categorias_nome (nome)      -- a collation ai_ci torna o nome único sem acento/caixa
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE fornecedor_categoria (
  fornecedor_id INT UNSIGNED NOT NULL,
  categoria_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (fornecedor_id, categoria_id), -- a combinação é única
  INDEX idx_fc_categoria (categoria_id),
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores (id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id)  REFERENCES categorias (id)   ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE administradores (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(254) NOT NULL,
  senha_hash    VARCHAR(255) NOT NULL,      -- resultado de password_hash(); nunca a senha
  ativo         TINYINT(1)   NOT NULL DEFAULT 1,
  ultimo_login  DATETIME     NULL,
  criado_em     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_administradores_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE schema_migracoes (           -- controle das migrações aplicadas
  versao       VARCHAR(50) PRIMARY KEY,
  aplicada_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

- **`ON DELETE CASCADE` na ligação com fornecedor:** excluir o fornecedor apaga as
  ligações dele com as categorias.
- **`RESTRICT` na ligação com categoria:** impede excluir uma categoria em uso, e a
  API responde `409`.
- **Busca:** a pesquisa por termo usa `LIKE` com parâmetro, e a collation `ai_ci`
  já ignora acento e caixa. Se o volume crescer, avaliar índice `FULLTEXT`.

## 5. Requisitos de segurança e operação

Nenhum destes itens está implementado. Cada um precisa ser feito **e testado** antes de
uso real.

**Autenticação**
- Senha guardada com `password_hash()` (bcrypt ou argon2id) e conferida com
  `password_verify()`. Nunca em texto puro, nem em log.
- Sessão PHP com cookie `HttpOnly`, `Secure` e `SameSite=Lax` (ou `Strict`).
- `session_regenerate_id(true)` no login, para evitar fixação de sessão.
- Tempo de expiração por inatividade e logout que destrói a sessão.
- Limite de tentativas de login por IP e por e-mail (responde `429`).
- Primeiro administrador criado por script de linha de comando, fora da web. Não
  existe tela pública de cadastro de administrador.

**Autorização**
- Toda rota `/api/admin/...` passa pelo middleware de autenticação. A checagem é no
  servidor, nunca escondendo botão no front.
- As rotas públicas filtram `status = 'publicado'` no SQL, e não depois.

**Consultas parametrizadas**
- PDO com `prepare()` e parâmetros nomeados em todas as consultas, inclusive `LIKE`.
- `PDO::ATTR_EMULATE_PREPARES = false` e `PDO::ERRMODE_EXCEPTION`.
- Nada de concatenar entrada do usuário em SQL. Ordenação e paginação vêm de
  listas fixas e inteiros validados.

**Proteção CSRF**
- Token aleatório (`random_bytes`) por sessão, entregue em `GET /api/admin/sessao`.
- Exigido no cabeçalho `X-CSRF-Token` em todo `POST`, `PUT` e `DELETE` e comparado
  com `hash_equals()`.
- Somado ao `SameSite` do cookie e à conferência do cabeçalho `Origin`.

**Saída e upload**
- O front continua escapando todo texto antes de inserir em HTML (`Util.escaparHtml`).
- Cabeçalhos de segurança:
  - `Content-Security-Policy` sem `unsafe-inline`;
  - `X-Content-Type-Options: nosniff`;
  - `Referrer-Policy`;
  - HSTS, que obriga o navegador a usar HTTPS.
- Upload com tipo conferido pelo conteúdo (`finfo`), limite de tamanho, nome gerado
  pelo servidor e imagem regravada. A pasta `uploads/` não executa PHP.

**Gerenciamento de credenciais**
- Credenciais do banco em variáveis de ambiente ou num `.env` fora de `public/`, e
  fora do Git. No repositório, só o `.env.example` sem valores.
- Usuário do banco da aplicação só com `SELECT`, `INSERT`, `UPDATE` e `DELETE` nas
  tabelas do sistema. As migrações rodam com outro usuário.
- `display_errors = Off` em produção. Erros vão para o log, sem senha nem token.
- Rotação das credenciais combinada com a DTI.

**Migrações**
- Arquivos SQL numerados em `migracoes/`, aplicados em ordem por um script que grava
  cada versão em `schema_migracoes`.
- Migração já aplicada nunca é editada: correção vira uma migração nova.
- Toda migração é testada antes num banco de homologação.

**Backups**
- Backup automático do MySQL (por exemplo, `mysqldump` diário) e da pasta
  `uploads/`, com retenção definida e cópia guardada fora do servidor.
- Teste de restauração periódico num banco separado: backup que nunca foi restaurado
  não é garantia.
- Política, local e responsável definidos com a DTI.

**Outros**
- HTTPS obrigatório.
- PHP e MySQL em versões com suporte e atualizados.
- Log de quem criou, editou ou excluiu cada fornecedor.

## 6. Testes que a Fase 2 precisará ter

- **Unitários:**
  - validação (cada regra de `api.md`, seção 4);
  - serviços com repositório em memória.
- **Integração (API + banco de teste):**
  - cada rota e cada código de erro;
  - rascunho fora das rotas públicas;
  - `409` ao excluir categoria em uso.
- **Segurança:**
  - rota admin sem sessão devolve `401`;
  - escrita sem token CSRF devolve `403`;
  - tentativa de SQL injection nos parâmetros;
  - upload de arquivo que não é imagem;
  - limite de login;
  - revisão de cabeçalhos;
  - teste de invasão (pentest) antes de publicar.
