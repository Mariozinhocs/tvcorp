// TvCorp Player Controller - Versão PHP com HTTP Polling
const API_URL = window.location.origin; // Detecta dinamicamente o servidor (ex: http://tvcorp.hubdigital360.com)

// Elementos do DOM
const pairingScreen = document.getElementById('pairing-screen');
const pairCodeDisplay = document.getElementById('pair-code-display');
const statusIndicator = document.getElementById('status-indicator');
const statusLabel = document.getElementById('status-label');
const overlayInfo = document.getElementById('overlay-info');

const imageDisplay = document.getElementById('image-display');
const videoDisplay = document.getElementById('video-display');
const iframeDisplay = document.getElementById('iframe-display');

// Estados internos do player
let screenId = localStorage.getItem('tvcorp_screen_id');
let isPaired = false;
let playlistItems = [];
let currentItemIndex = -1;
let playbackTimeout = null;
let currentMediaName = 'Aguardando Conteúdo';
let currentMediaType = 'Nenhum';

// Controle de atualização da playlist
let currentPlaylistId = null;

// 1. Inicializar ou resgatar identificador único da tela (Player ID)
if (!screenId) {
  screenId = 'screen_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('tvcorp_screen_id', screenId);
}

// Inicialização geral
async function init() {
  updateStatus('Conectando ao servidor...', 'connecting');
  
  // Tentar registrar/verificar pareamento com o backend via HTTP
  try {
    const response = await fetch(`${API_URL}/api/screens.php?action=register-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screenId })
    });
    
    if (!response.ok) throw new Error('Falha ao comunicar com o servidor');
    const data = await response.json();
    
    if (data.paired) {
      isPaired = true;
      pairingScreen.style.display = 'none';
      overlayInfo.style.display = 'block';
      updateStatus('Conectado', 'connected');
      await loadPlaylist();
    } else {
      isPaired = false;
      pairCodeDisplay.innerText = data.pairCode;
      pairingScreen.style.display = 'flex';
      overlayInfo.style.display = 'none';
    }

    // Iniciar o polling periódico (heartbeat e verificação de comandos)
    startPolling();

  } catch (error) {
    console.error('Erro na inicialização:', error);
    updateStatus('Erro ao conectar. Tentando novamente...', 'error');
    setTimeout(init, 5000);
  }
}

// 2. HTTP Polling (Simulação de Tempo Real para PHP)
function startPolling() {
  // Executar polling a cada 6 segundos
  setInterval(async () => {
    if (!screenId) return;

    try {
      const response = await fetch(`${API_URL}/api/screens.php?action=poll&screenId=${screenId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Falha no polling');
      const data = await response.json();

      // Se despareou no admin
      if (data.unpaired) {
        console.log('Tela despareada pelo servidor');
        isPaired = false;
        currentPlaylistId = null;
        stopPlayback();
        hideAllDisplays();
        pairCodeDisplay.innerText = data.pairCode || '------';
        pairingScreen.style.display = 'flex';
        overlayInfo.style.display = 'none';
        updateStatus('Aguardando pareamento...', 'connecting');
        return;
      }

      // Se acabou de ser pareado
      if (!isPaired && data.paired) {
        console.log('Tela pareada!');
        isPaired = true;
        pairingScreen.style.display = 'none';
        overlayInfo.style.display = 'block';
        updateStatus('Conectado', 'connected');
        await loadPlaylist();
        return;
      }

      if (isPaired) {
        updateStatus('Conectado', 'connected');

        // Verificar se mudou a playlist_id associada
        if (data.playlistId !== currentPlaylistId) {
          console.log(`Playlist alterada de ${currentPlaylistId} para ${data.playlistId}. Recarregando...`);
          currentPlaylistId = data.playlistId;
          await loadPlaylist();
        }

        // Verificar comandos pendentes
        if (data.pendingCommand) {
          console.log(`Comando recebido do painel: ${data.pendingCommand}`);
          handleRemoteCommand(data.pendingCommand);
          // Limpar o comando no servidor
          fetch(`${API_URL}/api/screens.php?action=clear-command&screenId=${screenId}`, { method: 'POST' });
        }
      } else {
        // Se não pareado, atualiza o código exibido se mudar
        if (data.pairCode) {
          pairCodeDisplay.innerText = data.pairCode;
        }
      }

    } catch (err) {
      console.warn('Erro na comunicação do polling:', err);
      updateStatus('Erro de sincronização', 'error');
    }
  }, 6000);
}

// Tratar comandos recebidos via polling
function handleRemoteCommand(command) {
  if (command === 'reload') {
    window.location.reload();
  } else if (command === 'screenshot') {
    takeScreenshotAndSend();
  }
}

// 3. Gerenciamento do Status Visual do Pareamento
function updateStatus(message, state) {
  statusLabel.innerText = message;
  statusIndicator.className = 'status-indicator';
  
  if (state === 'connected') {
    statusIndicator.classList.add('connected');
  } else if (state === 'connecting') {
    // Pulsando amarelo
  } else if (state === 'error') {
    statusIndicator.style.background = '#ff3b30';
    statusIndicator.style.boxShadow = '0 0 8px rgba(255, 59, 48, 0.5)';
  }
}

// 4. Carregar playlist da API
async function loadPlaylist() {
  try {
    const response = await fetch(`${API_URL}/api/screens.php?action=get-playlist&screenId=${screenId}`);
    if (!response.ok) throw new Error('Erro ao carregar playlist');
    const data = await response.json();
    
    stopPlayback();

    if (data.playlist) {
      currentPlaylistId = data.playlist.id;
    }

    if (data.items && data.items.length > 0) {
      playlistItems = data.items;
      currentItemIndex = 0;
      playMedia(playlistItems[currentItemIndex]);
    } else {
      playlistItems = [];
      currentItemIndex = -1;
      currentMediaName = 'Aguardando Conteúdo';
      currentMediaType = 'Nenhum';
      hideAllDisplays();
      pairingScreen.style.display = 'flex';
      pairCodeDisplay.innerText = 'Sem Playlist';
      document.querySelector('.instructions').innerHTML = 'Esta tela está pareada, mas não possui nenhuma <strong>playlist</strong> associada no painel.';
    }
  } catch (err) {
    console.error('Erro ao buscar playlist:', err);
  }
}

// 5. Motor de Reprodução
function playMedia(item) {
  if (!item) return;

  hideAllDisplays();
  currentMediaName = item.name;
  currentMediaType = item.type;
  
  const duration = (item.active_duration || 10) * 1000;
  console.log(`Reproduzindo (${item.type}): ${item.name} por ${item.active_duration}s`);
  overlayInfo.innerText = `TvCorp | Tocando agora: ${item.name}`;

  if (item.type === 'image') {
    imageDisplay.src = item.url;
    imageDisplay.style.display = 'block';
    
    playbackTimeout = setTimeout(advancePlaylist, duration);

  } else if (item.type === 'video') {
    videoDisplay.src = item.url;
    videoDisplay.style.display = 'block';
    videoDisplay.load();
    
    videoDisplay.play().catch(err => {
      console.warn('Erro ao auto-reproduzir vídeo. Forçando próximo em 5s...', err);
      playbackTimeout = setTimeout(advancePlaylist, 5000);
    });

    videoDisplay.onended = () => {
      clearTimeout(playbackTimeout);
      advancePlaylist();
    };

    playbackTimeout = setTimeout(advancePlaylist, duration);

  } else if (item.type === 'website') {
    iframeDisplay.src = item.url;
    iframeDisplay.style.display = 'block';
    
    playbackTimeout = setTimeout(advancePlaylist, duration);
  }
}

function advancePlaylist() {
  if (playlistItems.length === 0) return;
  
  currentItemIndex = (currentItemIndex + 1) % playlistItems.length;
  playMedia(playlistItems[currentItemIndex]);
}

function stopPlayback() {
  clearTimeout(playbackTimeout);
  if (videoDisplay) {
    videoDisplay.pause();
    videoDisplay.src = '';
  }
}

function hideAllDisplays() {
  imageDisplay.style.display = 'none';
  imageDisplay.src = '';
  videoDisplay.style.display = 'none';
  videoDisplay.pause();
  videoDisplay.src = '';
  iframeDisplay.style.display = 'none';
  iframeDisplay.src = '';
}

// 6. Geração de Screenshot Simulado via Canvas 2D
async function takeScreenshotAndSend() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');

  // Gradiente de Fundo
  const bgGrad = ctx.createRadialGradient(320, 180, 50, 320, 180, 360);
  bgGrad.addColorStop(0, '#100f2e');
  bgGrad.addColorStop(1, '#03020b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 640, 360);

  // Bordas
  ctx.strokeStyle = '#7b61ff';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 640, 360);

  // Logo da TvCorp
  ctx.fillStyle = '#7b61ff';
  ctx.beginPath();
  ctx.arc(35, 35, 6, 0, 2 * Math.PI);
  ctx.fill();

  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('TvCorp', 50, 41);

  // Status Online
  ctx.fillStyle = '#00ff66';
  ctx.beginPath();
  ctx.arc(555, 35, 5, 0, 2 * Math.PI);
  ctx.fill();

  ctx.font = '12px Arial, sans-serif';
  ctx.fillStyle = '#8b8a9f';
  ctx.fillText('AO VIVO', 568, 39);

  // Informações da Mídia
  ctx.textAlign = 'center';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillStyle = '#8b8a9f';
  ctx.fillText('EXIBINDO AGORA NO PLAYER (PHP MODE)', 320, 130);

  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  let displayName = currentMediaName;
  if (displayName.length > 30) {
    displayName = displayName.substring(0, 27) + '...';
  }
  ctx.fillText(displayName, 320, 175);

  ctx.font = 'italic 14px Arial, sans-serif';
  ctx.fillStyle = '#7b61ff';
  ctx.fillText(`Tipo de Mídia: ${currentMediaType.toUpperCase()}`, 320, 210);

  // Barra de carregamento
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(170, 240, 300, 6);
  ctx.fillStyle = '#7b61ff';
  ctx.fillRect(170, 240, 195, 6); // 65% completo

  // Rodapé com timestamp
  ctx.textAlign = 'left';
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = '#8b8a9f';
  const now = new Date();
  ctx.fillText(`Captura: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 30, 335);

  ctx.textAlign = 'right';
  ctx.fillText(`ID: ${screenId.substring(0, 14)}...`, 610, 335);

  const base64 = canvas.toDataURL('image/jpeg', 0.85);
  
  // Enviar screenshot via POST na API PHP
  try {
    await fetch(`${API_URL}/api/screens.php?action=upload-screenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screenId, base64 })
    });
    console.log('Screenshot enviado via API com sucesso!');
  } catch (err) {
    console.error('Erro ao enviar screenshot via API:', err);
  }
}

// Iniciar a aplicação
init();
