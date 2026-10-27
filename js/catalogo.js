// Tela pública: cards dos fornecedores publicados, com pesquisa e filtro por categoria.
// A filtragem é feita pela camada de dados (repositorio.pesquisar); esta tela só desenha.
const campoBusca = document.getElementById('busca');
const areaFiltros = document.getElementById('filtros');
const grade = document.getElementById('grade');
const contagem = document.getElementById('contagem');

iniciarCatalogo().catch((erro) => Util.mostrarErroCarga(grade, erro));

async function iniciarCatalogo() {
  const repositorio = await criarRepositorio();
  const total = (await repositorio.pesquisar()).length;
  const categorias = await repositorio.listarCategorias();
  let categoriaSelecionada = '';
  let numeroPesquisa = 0;

  function renderizarFiltros() {
    areaFiltros.innerHTML = ['', ...categorias].map((nome) => {
      const ativo = nome === categoriaSelecionada;
      return `<button type="button" class="filtro" data-categoria="${Util.escaparHtml(nome)}" `
        + `aria-pressed="${ativo}">${Util.escaparHtml(nome || 'Todas')}</button>`;
    }).join('');
  }

  // Ignora respostas de pesquisas antigas, caso cheguem fora de ordem (com API, podem chegar).
  async function atualizarGrade() {
    const numero = ++numeroPesquisa;
    const lista = await repositorio.pesquisar({ termo: campoBusca.value, categoria: categoriaSelecionada });
    if (numero !== numeroPesquisa) return;
    grade.innerHTML = lista.length
      ? lista.map(renderizarCard).join('')
      : '<p class="vazio">Nenhum fornecedor encontrado.</p>';
    contagem.textContent = `${lista.length} de ${total} fornecedores`;
  }

  function aoFalhar(erro) {
    Util.mostrarErroCarga(grade, erro);
  }

  areaFiltros.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.filtro');
    if (!botao) return;
    categoriaSelecionada = botao.dataset.categoria;
    renderizarFiltros();
    atualizarGrade().catch(aoFalhar);
  });
  campoBusca.addEventListener('input', () => atualizarGrade().catch(aoFalhar));

  renderizarFiltros();
  await atualizarGrade();
}

function renderizarCard(f) {
  return `<a class="card" href="fornecedor.html?id=${f.id}">
      <img class="card-imagem" src="${Util.escaparHtml(f.imagemExibicao)}" alt="" loading="lazy">
      <div class="card-corpo">
        <h2>${Util.escaparHtml(f.nome)}</h2>
        <p class="cidade">${Util.escaparHtml(f.local)}</p>
        ${Util.renderizarTags(f.categorias)}
      </div>
    </a>`;
}
