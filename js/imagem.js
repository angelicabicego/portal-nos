// Reduz a imagem escolhida no painel para um JPEG pequeno (data URL), para caber
// no limite do localStorage, que costuma ser de cerca de 5 MB por site.
const LADO_MAXIMO_IMAGEM = 800;
const QUALIDADE_JPEG = 0.8;

async function reduzirImagem(arquivo) {
  if (!arquivo.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.');
  const url = URL.createObjectURL(arquivo);
  try {
    const imagem = await carregarImagem(url);
    const escala = Math.min(1, LADO_MAXIMO_IMAGEM / Math.max(imagem.width, imagem.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(imagem.width * escala);
    canvas.height = Math.round(imagem.height * escala);
    canvas.getContext('2d').drawImage(imagem, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', QUALIDADE_JPEG);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function carregarImagem(src) {
  return new Promise((resolver, rejeitar) => {
    const imagem = new Image();
    imagem.onload = () => resolver(imagem);
    imagem.onerror = () => rejeitar(new Error('Não foi possível ler a imagem.'));
    imagem.src = src;
  });
}
