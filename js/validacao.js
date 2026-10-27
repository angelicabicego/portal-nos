// Validação do formulário do painel. Aqui serve só para avisar o usuário antes de salvar:
// na versão com back-end, as mesmas regras (docs/api.md, seção "Validações") precisam
// ser aplicadas no servidor, que é quem decide de fato.
const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const STATUS_VALIDOS = ['rascunho', 'publicado'];

/**
 * @param {object} dados campos lidos do formulário.
 * @returns {string[]} mensagens de erro; lista vazia quando está tudo certo.
 */
function validarFornecedor(dados) {
  const erros = [];
  if (dados.nome.length < 2 || dados.nome.length > 120) erros.push('Nome: de 2 a 120 caracteres.');
  if (dados.descricao.length > 600) erros.push('Descrição: até 600 caracteres.');
  if (dados.cidade.length > 80) erros.push('Cidade: até 80 caracteres.');
  if (dados.uf && !UFS.includes(dados.uf)) erros.push('UF: use a sigla de um estado (ex.: SP).');
  if (dados.categorias.length > 10) erros.push('Categorias: no máximo 10.');
  if (dados.site && !Util.urlSegura(dados.site)) erros.push('Site: precisa começar com http:// ou https://.');
  if (dados.telefone && !/^[\d\s()+-]{8,20}$/.test(dados.telefone)) erros.push('Telefone: de 8 a 20 caracteres, só números, espaço, ( ) + -.');
  if (dados.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) erros.push('E-mail: formato inválido.');
  if (dados.whatsapp && !/^\d{10,15}$/.test(dados.whatsapp)) erros.push('WhatsApp: de 10 a 15 dígitos, com DDI e DDD.');
  if (!STATUS_VALIDOS.includes(dados.status)) erros.push('Status: rascunho ou publicado.');
  return erros;
}
