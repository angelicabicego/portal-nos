// Funções de apoio usadas pelas telas, pelo modelo e pela camada de dados.
const Util = {
  /** Escapa texto antes de inserir em HTML, para não executar conteúdo digitado. */
  escaparHtml(texto) {
    return String(texto ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  },

  /** Remove acentos e caixa, para a busca achar "sao paulo" em "São Paulo". */
  normalizar(texto) {
    return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  },

  /** Aceita só links http(s); bloqueia "javascript:" e similares. */
  urlSegura(url) {
    return /^https?:\/\//i.test(url ?? '') ? url : '';
  },

  /** Aceita imagem enviada no painel (data:image) ou arquivo relativo em assets/. */
  srcImagemSegura(src) {
    return /^(data:image\/|assets\/)/i.test(src ?? '') ? src : '';
  },

  /** Monta o link wa.me a partir do número, só com os dígitos. */
  linkWhatsapp(numero) {
    const digitos = String(numero ?? '').replace(/\D/g, '');
    return digitos ? `https://wa.me/${digitos}` : '';
  },

  /** Quadro com as iniciais do nome, usado quando o fornecedor não tem imagem. */
  imagemPadrao(nome) {
    const iniciais = String(nome || '?').split(/\s+/).slice(0, 2)
      .map((parte) => parte[0] ?? '').join('').toUpperCase();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250">'
      + '<rect width="400" height="250" fill="#dfe7e2"/>'
      + '<text x="200" y="125" font-family="sans-serif" font-size="72" fill="#4d6b5c" '
      + `text-anchor="middle" dominant-baseline="central">${Util.escaparHtml(iniciais)}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  },

  /** Lista de categorias como tags (usada nos cards e nos detalhes). */
  renderizarTags(categorias) {
    const itens = categorias.map((nome) => `<li>${Util.escaparHtml(nome)}</li>`).join('');
    return `<ul class="tags">${itens}</ul>`;
  },

  /** Mensagem exibida quando os dados não carregam (por exemplo, página aberta via file://). */
  mostrarErroCarga(alvo, erro) {
    console.error(erro);
    alvo.innerHTML = '<p class="vazio">Não foi possível carregar os dados dos fornecedores. '
      + 'Se você abriu o arquivo direto do disco, rode o servidor local descrito no README.</p>';
  },
};
