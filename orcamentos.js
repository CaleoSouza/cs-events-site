/**
 * Orcamentos -- abre PDFs armazenados em assets/orcamentos/[ANO]/
 * Sem API externa, sem rate limit.
 */

// Catalogo de PDFs -- adicione novos arquivos aqui
const CATALOGO = {
  "2026": [
    "15 anos 2026.pdf",
    "Aniversario Adulto 2026.pdf",
    "Batizado 2026.pdf",
  ],
  "2027": [],
  "2028": [],
};

const ORC_BASE = "assets/orcamentos";
let _orcAnoAtual = null;

function abrirModalOrcamentos() {
  document.getElementById("overlay-orcamentos").style.display = "flex";
  _mostrarAnos();
}

function fecharModalOrcamentos() {
  document.getElementById("overlay-orcamentos").style.display = "none";
  _orcAnoAtual = null;
}

function voltarAnos() {
  _mostrarAnos();
}

function _mostrarAnos() {
  _orcAnoAtual = null;
  document.getElementById("orc-titulo").textContent = "Orcamentos";
  document.getElementById("orc-voltar").style.display = "none";

  const anos = Object.keys(CATALOGO).sort((a, b) => b.localeCompare(a));
  let html = '<div style="display:grid; gap:.75rem;">';
  for (const ano of anos) {
    const qtd = CATALOGO[ano].length;
    html += '<button onclick="_mostrarPdfs(\'' + ano + '\')"'
          + ' style="text-align:left; background:#252d3d; border:1px solid #30363d; color:#f9fafb;'
          + ' padding:1rem 1.25rem; border-radius:10px; cursor:pointer; font-size:1rem;'
          + ' font-weight:600; display:flex; align-items:center; gap:.75rem;">'
          + '<i class="bi bi-calendar3" style="color:#3b82f6; font-size:1.2rem;"></i>'
          + '<span style="flex:1;">' + ano + '</span>'
          + '<span style="font-size:.8rem; color:#6b7280; font-weight:400;">' + qtd + ' PDF' + (qtd !== 1 ? 's' : '') + '</span>'
          + '<i class="bi bi-chevron-right" style="color:#6b7280;"></i>'
          + '</button>';
  }
  html += '</div>';
  document.getElementById('corpo-orcamentos').innerHTML = html;
}

function _mostrarPdfs(ano) {
  _orcAnoAtual = ano;
  document.getElementById("orc-titulo").textContent = "Orcamentos " + ano;
  document.getElementById("orc-voltar").style.display = "inline-flex";

  const pdfs = CATALOGO[ano] || [];
  const corpo = document.getElementById("corpo-orcamentos");

  if (pdfs.length === 0) {
    corpo.innerHTML = "<p style='color:#9ca3af; text-align:center; padding:2rem;'>Nenhum PDF disponivel para este ano.</p>";
    return;
  }

  let html = '<div style="display:grid; gap:.75rem;">';
  for (const nome of pdfs) {
    const caminho = ORC_BASE + '/' + ano + '/' + encodeURIComponent(nome);
    const label = nome.replace(/\.pdf$/i, '');
    html += '<button onclick="abrirPdf(\'' + caminho + '\')"'
          + ' style="text-align:left; background:#252d3d; border:1px solid #30363d; color:#f9fafb;'
          + ' padding:1rem 1.25rem; border-radius:10px; cursor:pointer; display:flex;'
          + ' align-items:center; gap:.75rem;">'
          + '<i class="bi bi-file-pdf" style="color:#ef4444; font-size:1.4rem; flex-shrink:0;"></i>'
          + '<span style="flex:1; font-size:.92rem; font-weight:500; text-align:left;">' + label + '</span>'
          + '<i class="bi bi-box-arrow-up-right" style="color:#6b7280; flex-shrink:0;"></i>'
          + '</button>';
  }
  html += '</div>';
  corpo.innerHTML = html;
}

function abrirPdf(caminho) {
  window.open(caminho, "_blank");
}
