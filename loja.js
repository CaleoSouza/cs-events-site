/**
 * Loja -- galeria de imagens de produtos
 * Imagens em: assets/img/
 */

const LOJA_IMGS = [
  { nome: 'Banners e Albums Envelopados',  arquivo: 'Banners e Álbuns Envelopados - 2026.jpg' },
  { nome: 'Quadros',                        arquivo: 'Quadros.jpg' },
  { nome: 'Revelação de Fotos',           arquivo: 'Revelação de fotos 2026.jpg' },
  { nome: 'Tabela Porcelana',               arquivo: 'Tabela Porcelana 2025-2026.jpg' },
];

const LOJA_BASE = 'assets/img';

function abrirModalLoja() {
  document.getElementById('overlay-loja').style.display = 'flex';
  _renderLoja();
}

function fecharModalLoja() {
  document.getElementById('overlay-loja').style.display = 'none';
  _fecharVisualizador();
}

function _renderLoja() {
  let html = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:.75rem;">';
  for (const img of LOJA_IMGS) {
    const src = LOJA_BASE + '/' + encodeURIComponent(img.arquivo);
    html += '<button onclick="_verImagem(\'' + src + '\', \'' + img.nome + '\')"'
          + ' style="background:#252d3d; border:1px solid #30363d; border-radius:10px; cursor:pointer; padding:0; overflow:hidden; aspect-ratio:3/4;">'
          + '<img src="' + src + '" alt="' + img.nome + '" loading="lazy"'
          + ' style="width:100%; height:100%; object-fit:cover; display:block;">'
          + '</button>';
  }
  html += '</div>';
  document.getElementById('corpo-loja').innerHTML = html;
}

function _verImagem(src, nome) {
  document.getElementById('loja-img-titulo').textContent = nome;
  document.getElementById('loja-img-full').src = src;
  document.getElementById('loja-visualizador').style.display = 'flex';
}

function _fecharVisualizador() {
  document.getElementById('loja-visualizador').style.display = 'none';
  document.getElementById('loja-img-full').src = '';
}
