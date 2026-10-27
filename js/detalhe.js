// Página de detalhes de um fornecedor publicado (fornecedor.html?id=N).
const areaDetalhe = document.getElementById('detalhe');

iniciarDetalhe().catch((erro) => Util.mostrarErroCarga(areaDetalhe, erro));

async function iniciarDetalhe() {
  const repositorio = await criarRepositorio();
  const id = Number(new URLSearchParams(window.location.search).get('id'));
  const fornecedor = await repositorio.buscar(id);

  if (!fornecedor) {
    areaDetalhe.innerHTML = '<p class="vazio">Fornecedor não encontrado. '
      + '<a href="index.html">Voltar ao catálogo</a></p>';
    return;
  }
  document.title = `${fornecedor.nome} — nós`;
  areaDetalhe.innerHTML = renderizarDetalhe(fornecedor);
}

function renderizarDetalhe(f) {
  return `<a class="voltar" href="index.html">← Voltar ao catálogo</a>
    <article class="detalhe">
      <img class="detalhe-imagem" src="${Util.escaparHtml(f.imagemExibicao)}" alt="Imagem de ${Util.escaparHtml(f.nome)}">
      <div class="detalhe-corpo">
        <h1>${Util.escaparHtml(f.nome)}</h1>
        <p class="cidade">${Util.escaparHtml(f.local)}</p>
        ${Util.renderizarTags(f.categorias)}
        <p class="descricao">${Util.escaparHtml(f.descricao)}</p>
        <h2>Contato</h2>
        ${renderizarContatos(f.contatos)}
      </div>
    </article>`;
}

function renderizarContatos(contatos) {
  if (!contatos.length) return '<p class="vazio">Sem contatos cadastrados.</p>';
  const itens = contatos.map((c) => {
    const alvo = c.externo ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<li><span>${Util.escaparHtml(c.rotulo)}</span>`
      + `<a href="${Util.escaparHtml(c.href)}"${alvo}>${Util.escaparHtml(c.texto)}</a></li>`;
  });
  return `<ul class="contatos">${itens.join('')}</ul>`;
}
