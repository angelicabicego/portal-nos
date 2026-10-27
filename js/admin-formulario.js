// Formulário de cadastro e edição do painel de demonstração.
class FormularioFornecedor {
  /**
   * @param {HTMLFormElement} form formulário da página admin.html.
   * @param {JsonFornecedorRepository} repositorio camada de dados.
   * @param {Function} aoSalvar chamado depois de salvar, para atualizar a lista.
   * @param {Function} mostrarMensagem (texto, erro) exibe o retorno para o usuário.
   */
  constructor(form, repositorio, aoSalvar, mostrarMensagem) {
    this.form = form;
    this.repositorio = repositorio;
    this.aoSalvar = aoSalvar;
    this.mostrarMensagem = mostrarMensagem;
    this.imagem = '';
    this.previa = form.querySelector('#previa-imagem');

    form.addEventListener('submit', (evento) => {
      evento.preventDefault();
      this._salvar();
    });
    form.querySelector('#cancelar').addEventListener('click', () => this.fechar());
    form.querySelector('#remover-imagem').addEventListener('click', () => this._definirImagem(''));
    form.elements.arquivo.addEventListener('change', () => this._trocarImagem());
  }

  /** Abre o formulário vazio (fornecedor null) ou preenchido para edição. */
  async abrir(fornecedor) {
    const f = fornecedor ?? { categorias: [], status: 'rascunho' };
    const campos = this.form.elements;
    this.form.reset();
    campos.id.value = f.id ?? '';
    ['nome', 'descricao', 'cidade', 'uf', 'site', 'telefone', 'email', 'whatsapp'].forEach((nome) => {
      campos[nome].value = f[nome] ?? '';
    });
    campos.status.value = f.status;
    await this._renderizarCategorias(f.categorias);
    this._definirImagem(f.imagem ?? '');
    this.form.querySelector('#titulo-formulario').textContent = fornecedor ? 'Editar fornecedor' : 'Novo fornecedor';
    this.form.hidden = false;
    campos.nome.focus();
  }

  fechar() {
    this.form.hidden = true;
  }

  async _renderizarCategorias(selecionadas) {
    const area = this.form.querySelector('#campo-categorias');
    const categorias = await this.repositorio.listarCategorias();
    area.innerHTML = categorias.map((nome) => {
      const marcado = selecionadas.includes(nome) ? ' checked' : '';
      return `<label class="opcao"><input type="checkbox" name="categoria" value="${Util.escaparHtml(nome)}"${marcado}> `
        + `${Util.escaparHtml(nome)}</label>`;
    }).join('');
  }

  async _trocarImagem() {
    const arquivo = this.form.elements.arquivo.files[0];
    if (!arquivo) return;
    try {
      this._definirImagem(await reduzirImagem(arquivo));
    } catch (erro) {
      this.mostrarMensagem(erro.message, true);
    }
  }

  _definirImagem(src) {
    this.imagem = src;
    this.previa.src = Util.srcImagemSegura(src) || Util.imagemPadrao(this.form.elements.nome.value);
  }

  // Junta as categorias marcadas com as novas digitadas (separadas por vírgula), sem repetir.
  _lerCategorias() {
    const marcadas = [...this.form.querySelectorAll('input[name="categoria"]:checked')].map((c) => c.value);
    const novas = this.form.elements.novas_categorias.value.split(',').map((nome) => nome.trim()).filter(Boolean);
    return [...new Set([...marcadas, ...novas])];
  }

  _lerDados() {
    const campos = this.form.elements;
    const texto = (nome) => campos[nome].value.trim();
    return {
      nome: texto('nome'),
      descricao: texto('descricao'),
      imagem: this.imagem,
      categorias: this._lerCategorias(),
      cidade: texto('cidade'),
      uf: texto('uf').toUpperCase(),
      site: texto('site'),
      telefone: texto('telefone'),
      email: texto('email'),
      whatsapp: texto('whatsapp').replace(/\D/g, ''),
      status: campos.status.value,
    };
  }

  async _salvar() {
    const id = Number(this.form.elements.id.value) || null;
    const dados = this._lerDados();
    const erros = validarFornecedor(dados);
    if (erros.length) {
      this.mostrarMensagem(erros.join(' '), true);
      return;
    }
    try {
      if (id) await this.repositorio.editar(id, dados);
      else await this.repositorio.criar(dados);
      this.fechar();
      await this.aoSalvar();
      this.mostrarMensagem(`"${dados.nome}" salvo neste navegador.`);
    } catch (erro) {
      this.mostrarMensagem(erro.message, true);
    }
  }
}
