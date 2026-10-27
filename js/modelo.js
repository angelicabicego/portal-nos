// Converte o registro como vem da fonte de dados (hoje o JSON; depois, a API) no
// objeto que as telas usam. As telas só conhecem o resultado de paraFornecedor():
// se o nome de um campo mudar na fonte, muda só esta função.

/**
 * @param {object} registro fornecedor como está no JSON.
 * @returns {object} fornecedor pronto para exibição e edição.
 */
function paraFornecedor(registro) {
  const cidade = registro.cidade ?? '';
  const uf = registro.uf ?? '';
  const imagem = registro.imagem ?? '';
  return {
    id: registro.id,
    nome: registro.nome ?? '',
    descricao: registro.descricao ?? '',
    cidade,
    uf,
    local: [cidade, uf].filter(Boolean).join(' – '),
    categorias: [...(registro.categorias ?? [])],
    imagem,
    imagemExibicao: Util.srcImagemSegura(imagem) || Util.imagemPadrao(registro.nome),
    site: registro.site ?? '',
    telefone: registro.telefone ?? '',
    email: registro.email ?? '',
    whatsapp: registro.whatsapp ?? '',
    contatos: montarContatos(registro),
    status: registro.status,
    publicado: registro.status === 'publicado',
  };
}

// Só os canais preenchidos, cada um já com o link pronto para a tela.
function montarContatos(registro) {
  const contatos = [];
  const site = Util.urlSegura(registro.site);
  const telefone = String(registro.telefone ?? '').replace(/[^\d+]/g, '');
  const whatsapp = Util.linkWhatsapp(registro.whatsapp);

  if (site) contatos.push({ rotulo: 'Site', href: site, texto: registro.site, externo: true });
  if (telefone) contatos.push({ rotulo: 'Telefone', href: `tel:${telefone}`, texto: registro.telefone, externo: false });
  if (registro.email) contatos.push({ rotulo: 'E-mail', href: `mailto:${registro.email}`, texto: registro.email, externo: false });
  if (whatsapp) contatos.push({ rotulo: 'WhatsApp', href: whatsapp, texto: 'Conversar no WhatsApp', externo: true });
  return contatos;
}
