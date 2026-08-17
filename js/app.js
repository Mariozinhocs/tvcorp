/**
 * TvCorp — Main Application Controller (Padrão 360)
 */

let currentUser = null;
let currentSub = null;
let screensList = [];
let playlistsList = [];
let mediaList = [];

// Inicialização da Aplicação
window.addEventListener('DOMContentLoaded', async () => {
  const authData = await checkAuthGuard();
  if (!authData) return;

  currentUser = authData.user;
  currentSub = authData.subscription;

  updateUserUI();
  await loadScreens();
  await loadPlaylists();
  await loadMedia();

  // Polling para manter as telas atualizadas a cada 5 segundos
  setInterval(loadScreens, 5000);
});

function updateUserUI() {
  const nameEl = document.getElementById('userNameDisplay');
  const badgeEl = document.getElementById('userPlanBadge');

  if (nameEl && currentUser) {
    nameEl.innerText = `👤 ${currentUser.name}`;
  }
  if (badgeEl && currentSub) {
    badgeEl.innerText = `⚡ ${currentSub.plan_name} (${currentSub.screen_limit} Telas)`;
  }

  // Preencher dados do perfil
  if (currentUser) {
    const profName = document.getElementById('profileName');
    const profEmail = document.getElementById('profileEmail');
    const profComp = document.getElementById('profileCompany');

    if (profName) profName.innerText = currentUser.name;
    if (profEmail) profEmail.innerText = currentUser.email;
    if (profComp) profComp.innerText = currentUser.company || 'Não informada';
  }

  // Preencher dados da assinatura
  if (currentSub) {
    const subTitle = document.getElementById('subPlanTitle');
    const subLimit = document.getElementById('subScreenLimit');
    const subExpires = document.getElementById('subExpiresAt');
    const subBadge = document.getElementById('subStatusBadge');

    if (subTitle) subTitle.innerText = currentSub.plan_name;
    if (subLimit) subLimit.innerText = `${currentSub.screen_limit} Tela${currentSub.screen_limit > 1 ? 's' : ''}`;
    if (subExpires && currentSub.expires_at) {
      const expDate = new Date(currentSub.expires_at);
      subExpires.innerText = expDate.toLocaleDateString('pt-BR');
    }
    if (subBadge) {
      if (currentSub.status === 'active') {
        subBadge.innerText = '🟢 ATIVO';
        subBadge.style.background = 'rgba(16, 185, 129, 0.15)';
        subBadge.style.color = 'var(--accent-emerald)';
      } else {
        subBadge.innerText = '🔴 EXPIRADO / SUSPENSO';
        subBadge.style.background = 'rgba(239, 68, 68, 0.15)';
        subBadge.style.color = '#ef4444';
      }
    }
  }
}

// TROCA DE ABAS (VIEWS 360)
function switchTab(tabName) {
  const tabs = ['screens', 'playlists', 'subscription', 'help', 'profile'];
  const titles = {
    screens: '🖥️ Minhas Telas Corporativas',
    playlists: '📋 Playlists & Mídias',
    subscription: '💳 Minha Assinatura & Faturas Mercado Pago',
    help: '❓ Tutoriais & Central de Ajuda',
    profile: '👤 Meu Perfil Cadastral'
  };

  tabs.forEach(t => {
    const viewEl = document.getElementById(`view${capitalize(t)}`);
    const navEl = document.getElementById(`nav${capitalize(t)}`);

    if (viewEl) viewEl.style.display = 'none';
    if (navEl) navEl.classList.remove('active');
  });

  const activeView = document.getElementById(`view${capitalize(tabName)}`);
  const activeNav = document.getElementById(`nav${capitalize(tabName)}`);

  if (activeView) activeView.style.display = 'block';
  if (activeNav) activeNav.classList.add('active');

  const viewTitle = document.getElementById('viewTitle');
  if (viewTitle && titles[tabName]) {
    viewTitle.innerText = titles[tabName];
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// 1. CARREGAR TELAS
async function loadScreens() {
  try {
    const res = await fetch('api/screens.php');
    if (res.ok) {
      screensList = await res.json();
      renderScreens();
    }
  } catch (err) {
    console.error('Erro ao buscar telas:', err);
  }
}

function renderScreens() {
  const container = document.getElementById('screensContainer');
  const badgeScreens = document.getElementById('badgeScreens');

  if (badgeScreens) badgeScreens.innerText = screensList.length;
  if (!container) return;

  if (screensList.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <span style="font-size: 3rem;">📺</span>
        <h3 style="margin-top: 1rem;">Nenhuma tela pareada</h3>
        <p style="color: var(--text-muted); margin-top: 6px;">Clique em "Conectar Nova Tela" para vincular sua primeira Smart TV ou TV Box via código de 6 dígitos.</p>
        <button class="btn-primary" style="margin-top: 1.5rem;" onclick="openPairModal()">Conectar Primeira Tela ⚡</button>
      </div>
    `;
    return;
  }

  container.innerHTML = screensList.map(screen => `
    <div class="glass-card fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="font-size: 1.1rem; margin: 0;">${escapeHTML(screen.name)}</h3>
        <span class="badge-status ${screen.status === 'online' ? 'online' : 'offline'}">
          ${screen.status === 'online' ? '🟢 Online' : '🔴 Offline'}
        </span>
      </div>

      <div style="aspect-ratio: 16/9; background: #000; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 12px; position: relative;">
        ${screen.screenshot_url ? `
          <img src="${screen.screenshot_url}" style="width: 100%; height: 100%; object-fit: cover;">
        ` : `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 0.85rem;">
            Aguardando sinal da TV...
          </div>
        `}
      </div>

      <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">
        Playlist: <strong style="color: #fff;">${screen.playlist_name || 'Nenhuma atribuída'}</strong>
      </div>

      <div style="display: flex; gap: 8px;">
        <button class="btn-secondary" style="flex: 1; padding: 6px 10px; font-size: 0.8rem;" onclick="sendCommand('${screen.id}', 'reload')">🔄 Recarregar</button>
        <button class="btn-secondary" style="flex: 1; padding: 6px 10px; font-size: 0.8rem;" onclick="sendCommand('${screen.id}', 'screenshot')">📸 Print TV</button>
      </div>
    </div>
  `).join('');
}

// MODAIS PAREAMENTO E ASSINATURA
function openPairModal() { 
  const el = document.getElementById('modalPair');
  if (el) el.style.display = 'flex'; 
}
function closePairModal() { 
  const el = document.getElementById('modalPair');
  if (el) el.style.display = 'none'; 
}

function openSubscriptionModal(planName = 'Pro') { 
  const el = document.getElementById('modalSubscription');
  if (el) el.style.display = 'flex'; 
}
function closeSubscriptionModal() { 
  const el = document.getElementById('modalSubscription');
  if (el) el.style.display = 'none'; 
}

async function handlePairSubmit(e) {
  e.preventDefault();
  const pairCode = document.getElementById('pairCodeInput').value.trim();
  const name = document.getElementById('pairNameInput').value.trim();

  try {
    const res = await fetch('api/screens.php?action=pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairCode, name })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      closePairModal();
      document.getElementById('pairCodeInput').value = '';
      document.getElementById('pairNameInput').value = '';
      await loadScreens();
    } else {
      alert(data.error || 'Erro ao parear tela');
    }
  } catch (err) {
    alert('Erro de conexão ao parear tela');
  }
}

async function payWithMercadoPago(method) {
  const fb = document.getElementById('mpFeedback');
  if (fb) {
    fb.style.display = 'block';
    fb.innerText = method === 'pix' 
      ? '⚡ Gerando QR Code PIX Mercado Pago...' 
      : '💳 Abrindo formulário seguro de cartão Mercado Pago...';
  }

  setTimeout(() => {
    if (fb) {
      fb.innerText = method === 'pix'
        ? '✅ Chave PIX gerada com sucesso! Copie o código abaixo no seu banco.'
        : '✅ Redirecionando para o ambiente seguro do Mercado Pago...';
    }
  }, 1200);
}

async function sendCommand(screenId, command) {
  try {
    await fetch('api/screens.php?action=send-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screenId, command })
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadPlaylists() {
  try {
    const res = await fetch('api/playlists.php');
    if (res.ok) playlistsList = await res.json();
  } catch (err) { console.error(err); }
}

async function loadMedia() {
  try {
    const res = await fetch('api/media.php');
    if (res.ok) mediaList = await res.json();
  } catch (err) { console.error(err); }
}

function openAddMediaModal() {
  alert('Selecione o arquivo de imagem, vídeo (MP4) ou link de site para adicionar à sua biblioteca.');
}

function openCreatePlaylistModal() {
  alert('Digite o nome da nova playlist e selecione os itens da biblioteca de mídia.');
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
