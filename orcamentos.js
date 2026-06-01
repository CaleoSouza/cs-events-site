/**
 * Integração com Dropbox para Orçamentos
 */

// URL pública para carregar config do Dropbox (via GitHub raw)
const DROPBOX_CONFIG_URL = 'https://raw.githubusercontent.com/CaleoSouza/cs-events-site/main/assets/dados/dropbox_config.json';

let _dropboxConfig = null;
let _dropboxPastasAno = [];
let _dropboxPdfsSelecionados = [];

/**
 * Carrega a configuração do Dropbox desde o repositório
 */
async function carregarConfigDropbox() {
  try {
    const resp = await fetch(DROPBOX_CONFIG_URL, { cache: 'no-cache' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    _dropboxConfig = await resp.json();
    return _dropboxConfig;
  } catch (err) {
    console.error('Erro ao carregar config Dropbox:', err);
    return null;
  }
}

/**
 * Valida se o token está configurado
 */
function temTokenDropbox() {
  if (!_dropboxConfig) return false;
  const token = _dropboxConfig.token || '';
  return token.length > 10; // Token deve ter pelo menos alguns caracteres
}

/**
 * Lista as pastas de anos (2026, 2027, etc)
 */
async function listarPastasAno() {
  if (!temTokenDropbox()) {
    console.warn('Token Dropbox não configurado');
    return [];
  }

  const pastaBase = _dropboxConfig.pasta_orcamentos || '/Orçamentos';
  const token = _dropboxConfig.token;

  try {
    const resp = await fetch(
      'https://api.dropboxapi.com/2/files/list_folder',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: pastaBase }),
      }
    );

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} - ${resp.statusText}`);
    }

    const dados = await resp.json();
    const pastas = [];

    for (const item of dados.entries || []) {
      if (item['.tag'] === 'folder') {
        pastas.push({
          nome: item.name,
          caminho: item.path_display,
        });
      }
    }

    _dropboxPastasAno = pastas.sort((a, b) => b.nome.localeCompare(a.nome));
    return _dropboxPastasAno;
  } catch (err) {
    console.error('Erro ao listar pastas:', err);
    return [];
  }
}

/**
 * Lista todos os PDFs em uma pasta
 */
async function listarPdfs(caminhoFolder) {
  if (!temTokenDropbox()) {
    console.warn('Token Dropbox não configurado');
    return [];
  }

  const token = _dropboxConfig.token;

  try {
    const resp = await fetch(
      'https://api.dropboxapi.com/2/files/list_folder',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: caminhoFolder }),
      }
    );

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const dados = await resp.json();
    const pdfs = [];

    for (const item of dados.entries || []) {
      if (item['.tag'] === 'file' && item.name.toLowerCase().endsWith('.pdf')) {
        pdfs.push({
          nome: item.name,
          caminho: item.path_display,
          tamanho: item.size || 0,
        });
      }
    }

    _dropboxPdfsSelecionados = pdfs.sort((a, b) => a.nome.localeCompare(b.nome));
    return _dropboxPdfsSelecionados;
  } catch (err) {
    console.error('Erro ao listar PDFs:', err);
    return [];
  }
}

/**
 * Obtém URL temporária (4h) para download do arquivo
 */
async function obterUrlDownload(caminhoArquivo) {
  if (!temTokenDropbox()) return '';

  const token = _dropboxConfig.token;

  try {
    const resp = await fetch(
      'https://api.dropboxapi.com/2/files/get_temporary_link',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: caminhoArquivo }),
      }
    );

    if (resp.ok) {
      const dados = await resp.json();
      return dados.link || '';
    }

    console.error('Erro ao obter URL:', resp.status);
    return '';
  } catch (err) {
    console.error('Erro:', err);
    return '';
  }
}

/**
 * Obtém URL de compartilhamento (link permanente)
 */
async function obterUrlCompartilhamento(caminhoArquivo) {
  if (!temTokenDropbox()) return '';

  const token = _dropboxConfig.token;

  try {
    // Tenta criar link compartilhado
    let resp = await fetch(
      'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: caminhoArquivo,
          settings: { requested_visibility: 'public' },
        }),
      }
    );

    // Se já existe, tenta listar links existentes
    if (resp.status === 409) {
      resp = await fetch(
        'https://api.dropboxapi.com/2/sharing/list_shared_links',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path: caminhoArquivo }),
        }
      );

      if (resp.ok) {
        const dados = await resp.json();
        const links = dados.links || [];
        if (links.length > 0) {
          return links[0].url || '';
        }
      }
    } else if (resp.ok) {
      const dados = await resp.json();
      return dados.url || '';
    }

    console.error('Erro ao compartilhar:', resp.status);
    return '';
  } catch (err) {
    console.error('Erro:', err);
    return '';
  }
}

/**
 * Abre o modal de orçamentos
 */
async function abrirModalOrcamentos() {
  // Carrega config se não estiver carregada
  if (!_dropboxConfig) {
    await carregarConfigDropbox();
  }

  if (!temTokenDropbox()) {
    alert('Token do Dropbox não configurado. Acesse Configurações para adicionar.');
    return;
  }

  // Mostra o overlay
  document.getElementById('overlay-orcamentos').style.display = 'flex';

  // Carrega pastas
  const btnCarregar = document.getElementById('btn-carregar-orcamentos');
  if (btnCarregar) {
    btnCarregar.textContent = 'Carregando...';
    btnCarregar.disabled = true;
  }

  const pastas = await listarPastasAno();

  // Preenche dropdown
  const selectAno = document.getElementById('select-ano-orcamento');
  selectAno.innerHTML = '<option value="">Selecione um ano...</option>';
  for (const pasta of pastas) {
    const opt = document.createElement('option');
    opt.value = pasta.caminho;
    opt.textContent = pasta.nome;
    selectAno.appendChild(opt);
  }

  if (btnCarregar) {
    btnCarregar.textContent = 'Carregar PDFs';
    btnCarregar.disabled = false;
  }
}

/**
 * Fecha o modal de orçamentos
 */
function fecharModalOrcamentos() {
  document.getElementById('overlay-orcamentos').style.display = 'none';
  document.getElementById('corpo-pdfs-orcamento').innerHTML = '';
}

/**
 * Carrega PDFs do ano selecionado
 */
async function carregarPdfsOrcamento() {
  const selectAno = document.getElementById('select-ano-orcamento');
  const caminhoSelecionado = selectAno.value;

  if (!caminhoSelecionado) {
    alert('Selecione um ano');
    return;
  }

  const corpoPdfs = document.getElementById('corpo-pdfs-orcamento');
  corpoPdfs.innerHTML = '<div style="text-align:center; padding:20px;"><div class="spinner-border spinner-border-sm text-primary"></div> Carregando PDFs...</div>';

  const pdfs = await listarPdfs(caminhoSelecionado);

  if (pdfs.length === 0) {
    corpoPdfs.innerHTML = '<div style="text-align:center; padding:20px; color:#9ca3af;">Nenhum PDF encontrado nesta pasta</div>';
    return;
  }

  // Renderiza PDFs
  let html = '';
  for (const pdf of pdfs) {
    html += `
      <div style="display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid #f3f4f6;">
        <i class="bi bi-file-pdf" style="font-size:24px; color:#e53935;"></i>
        <div style="flex:1; min-width:0;">
          <div style="font-weight:500; color:#ffffff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${pdf.nome}
          </div>
          <div style="font-size:0.75rem; color:#9ca3af;">
            ${(pdf.tamanho / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>
        <button onclick="abrirPdfOrcamento('${pdf.caminho}')" style="background:#1a73e8; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:500;">
          Abrir
        </button>
        <button onclick="compartilharPdfOrcamento('${pdf.caminho}', '${pdf.nome}')" style="background:#34a853; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:500;">
          Compartilhar
        </button>
      </div>
    `;
  }

  corpoPdfs.innerHTML = html;
}

/**
 * Abre o PDF em nova aba (visualização no navegador)
 */
async function abrirPdfOrcamento(caminhoArquivo) {
  const url = await obterUrlCompartilhamento(caminhoArquivo);
  if (url) {
    // Força visualização no navegador: substitui dl=1 por dl=0 ou adiciona ?dl=0
    let urlVisualizacao = url.includes('dl=') ? url.replace('dl=1', 'dl=0') : url + (url.includes('?') ? '&dl=0' : '?dl=0');
    window.open(urlVisualizacao, '_blank');
  } else {
    alert('Erro ao obter URL do arquivo');
  }
}

/**
 * Compartilha o PDF gerando um link e copiando para a área de transferência
 */
async function compartilharPdfOrcamento(caminhoArquivo, nomeArquivo) {
  const btnCompartilhar = event.target;
  btnCompartilhar.disabled = true;
  btnCompartilhar.textContent = 'Gerando...';

  const url = await obterUrlCompartilhamento(caminhoArquivo);

  if (url) {
    // Copia para área de transferência
    navigator.clipboard.writeText(url).then(() => {
      btnCompartilhar.textContent = 'Copiado!';
      setTimeout(() => {
        btnCompartilhar.disabled = false;
        btnCompartilhar.textContent = 'Compartilhar';
      }, 2000);
    }).catch(() => {
      // Se falhar, abre em nova aba
      window.open(url, '_blank');
      btnCompartilhar.disabled = false;
      btnCompartilhar.textContent = 'Compartilhar';
    });
  } else {
    alert('Erro ao gerar link de compartilhamento');
    btnCompartilhar.disabled = false;
    btnCompartilhar.textContent = 'Compartilhar';
  }
}
