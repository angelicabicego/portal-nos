// Ponto de entrada do painel de demonstração: lista, edição, exclusão e restauração.
const listaFornecedores = document.getElementById('lista-fornecedores');
const areaMensagem = document.getElementById('mensagem');
const avisoAlteracoes = document.getElementById('aviso-alteracoes');
const ROTULO_STATUS = { publicado: 'Publicado', rascunho: 'Rascunho' };

function mostrarMensagem(texto, erro = false) {
  areaMensagem.textContent = texto;
  areaMensagem.classList.toggle('erro', erro);
}

iniciarPainel().catch((erro) => Util.mostrarErroCarga(areaMensagem, erro));

async function iniciarPainel() {
  const repositorio = await criarRepositorio();
  const formulario = new FormularioFornecedor(
    document.getElementById('form-fornecedor'), repositorio, atualizarLista, mostrarMensagem,
  );
  let fornecedores = [];

  async function atualizarLista() {
    fornecedores = await repositorio.listarTodos();
    listaFornecedores.innerHTML = fornecedores.map(renderizarLinha).join('')
      || '<tr><td colspan="4" class="vazio">Nenhum fornecedor.</td></tr>';
    avisoAlteracoes.hidden = !(await repositorio.temAlteracoesLocais());
  }

  async function excluirFornecedor(fornecedor) {
    if (!window.confirm(`Excluir "${fornecedor.nome}"? A exclusão vale só neste navegador.`)) return;
    try {
      await repositorio.excluir(fornecedor.id);
      await atualizarLista();
      mostrarMensagem(`"${fornecedor.nome}" excluído neste navegador.`);
    } catch (erro) {
      mostrarMensagem(erro.message, true);
    }
  }

  async function restaurarDados() {
    if (!window.confirm('Apagar as alterações deste navegador e voltar aos dados originais?')) return;
    await repositorio.restaurarDadosOriginais();
    formulario.fechar();
    await atualizarLista();
    mostrarMensagem('Dados originais restaurados.');
  }

  listaFornecedores.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-acao]');
    if (!botao) return;
    const fornecedor = fornecedores.find((f) => f.id === Number(botao.dataset.id));
    if (botao.dataset.acao === 'editar') formulario.abrir(fornecedor);
    if (botao.dataset.acao === 'excluir') excluirFornecedor(fornecedor);
  });
  document.getElementById('novo-fornecedor').addEventListener('click', () => formulario.abrir(null));
  document.getElementById('restaurar').addEventListener('click', restaurarDados);

  await atualizarLista();
}

function renderizarLinha(f) {
  return `<tr>
      <td>${Util.escaparHtml(f.nome)}</td>
      <td>${Util.escaparHtml(f.local)}</td>
      <td><span class="status status-${Util.escaparHtml(f.status)}">${ROTULO_STATUS[f.status] ?? Util.escaparHtml(f.status)}</span></td>
      <td class="acoes">
        <button type="button" class="botao secundario" data-acao="editar" data-id="${f.id}">Editar</button>
        <button type="button" class="botao perigo" data-acao="excluir" data-id="${f.id}">Excluir</button>
      </td>
    </tr>`;
}
