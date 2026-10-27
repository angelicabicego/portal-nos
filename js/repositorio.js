// Camada de acesso a dados do MVP: o único arquivo que sabe de onde vêm os fornecedores.
// Lê data/fornecedores.json e, se o painel de demonstração alterou algo, usa a cópia
// gravada no localStorage deste navegador. Todos os métodos públicos devolvem Promise:
// a versão com API terá os mesmos métodos usando fetch (ver docs/api.md) e as telas
// não mudam. A pesquisa e os filtros ficam aqui porque, com a API, quem filtra é o servidor.
class JsonFornecedorRepository {
  /**
   * @param {Array} registrosBase fornecedores lidos do JSON.
   * @param {Storage|null} storage localStorage do navegador; null guarda só em memória.
   * @param {string} chave chave usada no storage.
   */
  constructor(registrosBase, storage, chave) {
    this.registrosBase = registrosBase;
    this.storage = storage;
    this.chave = chave;
    this.registros = this._carregar();
  }

  // ---------- Consulta pública (futuro GET /api/fornecedores e /api/categorias) ----------

  /** Fornecedores publicados que atendem à pesquisa (nome ou palavra-chave) e à categoria. */
  async pesquisar({ termo = '', categoria = '' } = {}) {
    const termoNormalizado = Util.normalizar(termo.trim());
    return this._modelos()
      .filter((f) => f.publicado)
      .filter((f) => !categoria || f.categorias.includes(categoria))
      .filter((f) => !termoNormalizado || Util.normalizar(
        [f.nome, f.descricao, f.cidade, f.uf, ...f.categorias].join(' '),
      ).includes(termoNormalizado));
  }

  /** Fornecedor publicado pelo id, ou null (rascunho também devolve null). */
  async buscar(id) {
    return this._modelos().find((f) => f.id === id && f.publicado) ?? null;
  }

  async listarCategorias() {
    const nomes = new Set(this.registros.flatMap((r) => r.categorias ?? []));
    return [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  // ---------- Só da demonstração (na API, rotas /api/admin/... com login) ----------

  /** Todos os fornecedores, inclusive rascunhos. */
  async listarTodos() {
    return this._modelos();
  }

  /** Cria um fornecedor e devolve o id gerado. */
  async criar(dados) {
    const id = this.registros.reduce((maior, r) => Math.max(maior, r.id), 0) + 1;
    this._alterar(() => this.registros.push({ id, ...this._paraRegistro(dados) }));
    return id;
  }

  async editar(id, dados) {
    const indice = this.registros.findIndex((r) => r.id === id);
    if (indice < 0) throw new Error('Fornecedor não encontrado.');
    this._alterar(() => { this.registros[indice] = { id, ...this._paraRegistro(dados) }; });
  }

  async excluir(id) {
    this._alterar(() => { this.registros = this.registros.filter((r) => r.id !== id); });
  }

  /** true quando este navegador tem alterações feitas no painel. */
  async temAlteracoesLocais() {
    try {
      return Boolean(this.storage?.getItem(this.chave));
    } catch (erro) {
      return false;
    }
  }

  /** Apaga as alterações deste navegador e volta aos dados do JSON. */
  async restaurarDadosOriginais() {
    try {
      this.storage?.removeItem(this.chave);
    } catch (erro) {
      console.error('Não foi possível limpar o localStorage.', erro);
    }
    this.registros = structuredClone(this.registrosBase);
  }

  // ---------- Internos ----------

  _modelos() {
    return this.registros.map(paraFornecedor).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  // Campos aceitos na gravação, no formato do JSON.
  _paraRegistro(dados) {
    const campos = ['nome', 'descricao', 'imagem', 'cidade', 'uf', 'site', 'telefone', 'email', 'whatsapp', 'status'];
    const registro = Object.fromEntries(campos.map((campo) => [campo, dados[campo] ?? '']));
    registro.categorias = [...(dados.categorias ?? [])];
    return registro;
  }

  // Aplica a alteração e grava; se a gravação falhar, desfaz e repassa o erro.
  _alterar(alteracao) {
    const anterior = structuredClone(this.registros);
    alteracao();
    if (!this.storage) return;
    try {
      this.storage.setItem(this.chave, JSON.stringify(this.registros));
    } catch (erro) {
      this.registros = anterior;
      if (erro.name === 'QuotaExceededError') {
        throw new Error('O espaço do navegador acabou. Use imagens menores ou restaure os dados originais.');
      }
      throw erro;
    }
  }

  _carregar() {
    try {
      const salvo = this.storage?.getItem(this.chave);
      if (salvo) return JSON.parse(salvo);
    } catch (erro) {
      console.error('Alterações salvas ilegíveis; usando o JSON original.', erro);
    }
    return structuredClone(this.registrosBase);
  }
}

/** Monta a camada de dados usada pelas telas. Trocar JSON por API é trocar esta função. */
async function criarRepositorio() {
  const resposta = await fetch('data/fornecedores.json');
  if (!resposta.ok) throw new Error(`Falha ao ler data/fornecedores.json (HTTP ${resposta.status}).`);
  const registrosBase = await resposta.json();

  let storage = null;
  try {
    storage = window.localStorage;
  } catch (erro) {
    console.error('localStorage indisponível; alterações do painel não serão mantidas.', erro);
  }
  return new JsonFornecedorRepository(registrosBase, storage, 'nos.fornecedores.v1');
}
