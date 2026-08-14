import React, { useState, useEffect } from 'react';
import './App.css';

// COMPONENTES DE ÍCONES SVG INLINE (Design Premium)
const MonitorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
);
const PlaylistIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="20" y2="18"></line><line x1="9" y1="12" x2="20" y2="12"></line><line x1="9" y1="6" x2="20" y2="6"></line><path d="M16 3H3v18h13"></path><polygon points="12 9 12 15 17 12 12 9"></polygon></svg>
);
const MediaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
);
const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
);
const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
);
const ArrowDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
);
const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
);
const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
);

function App() {
  const [activeTab, setActiveTab] = useState('screens');
  const [screens, setScreens] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [media, setMedia] = useState([]);

  // Estados dos modais e formulários
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairCodeInput, setPairCodeInput] = useState('');
  const [screenNameInput, setScreenNameInput] = useState('');
  const [pairPlaylistId, setPairPlaylistId] = useState('');

  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const [newMedia, setNewMedia] = useState({ name: '', type: 'image', url: '', duration: 10 });
  const [uploadFile, setUploadFile] = useState(null);
  
  // Imagem expandida
  const [expandedImage, setExpandedImage] = useState(null);

  // Carregar dados iniciais
  useEffect(() => {
    fetchScreens();
    fetchPlaylists();
    fetchMedia();
    
    // Polling periódico para manter o painel atualizado com status e prints das TVs
    const interval = setInterval(() => {
      fetchScreens();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchScreens = async () => {
    try {
      const res = await fetch('/api/screens.php');
      if (res.ok) setScreens(await res.json());
    } catch (err) { console.error('Erro ao buscar telas:', err); }
  };

  const fetchPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists.php');
      if (res.ok) setPlaylists(await res.json());
    } catch (err) { console.error('Erro ao buscar playlists:', err); }
  };

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/media.php');
      if (res.ok) setMedia(await res.json());
    } catch (err) { console.error('Erro ao buscar mídias:', err); }
  };

  // Funções de Ações de Screens
  const handlePairScreen = async (e) => {
    e.preventDefault();
    if (!pairCodeInput || !screenNameInput) return;

    try {
      const res = await fetch('/api/screens.php?action=pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairCode: pairCodeInput.toUpperCase(),
          name: screenNameInput,
          playlistId: pairPlaylistId ? parseInt(pairPlaylistId) : null
        })
      });

      if (res.ok) {
        setShowPairModal(false);
        setPairCodeInput('');
        setScreenNameInput('');
        setPairPlaylistId('');
        fetchScreens();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao parear tela');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao parear tela');
    }
  };

  const handleUpdateScreenPlaylist = async (screenId, playlistId) => {
    try {
      const res = await fetch('/api/screens.php?action=update-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          screenId, 
          playlistId: playlistId ? parseInt(playlistId) : null 
        })
      });
      if (res.ok) fetchScreens();
    } catch (err) { console.error(err); }
  };

  const handleSendCommand = async (screenId, command) => {
    try {
      await fetch('/api/screens.php?action=send-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenId, command })
      });
      if (command === 'screenshot') {
        // Dar um tempo para o player receber o comando via poll, capturar e subir o base64
        setTimeout(fetchScreens, 4000);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteScreen = async (screenId) => {
    if (!confirm('Deseja realmente desparear/remover esta tela?')) return;
    try {
      const res = await fetch(`/api/screens.php?action=delete&id=${screenId}`, { method: 'POST' });
      if (res.ok) fetchScreens();
    } catch (err) { console.error(err); }
  };


  // Funções de Ações de Media
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewMedia(prev => ({
        ...prev,
        name: prev.name || file.name,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        url: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddMedia = async (e) => {
    e.preventDefault();
    if (!newMedia.name || !newMedia.url) return;

    try {
      const res = await fetch('/api/media.php?action=add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedia)
      });
      if (res.ok) {
        setNewMedia({ name: '', type: 'image', url: '', duration: 10 });
        setUploadFile(null);
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
        fetchMedia();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteMedia = async (id) => {
    if (!confirm('Deseja realmente deletar esta mídia de forma definitiva?')) return;
    try {
      const res = await fetch(`/api/media.php?action=delete&id=${id}`, { method: 'POST' });
      if (res.ok) {
        fetchMedia();
        if (selectedPlaylist) fetchPlaylistDetails(selectedPlaylist.id);
      }
    } catch (err) { console.error(err); }
  };


  // Funções de Ações de Playlists
  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName) return;

    try {
      const res = await fetch('/api/playlists.php?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlaylistName })
      });
      if (res.ok) {
        setShowPlaylistModal(false);
        setNewPlaylistName('');
        fetchPlaylists();
      }
    } catch (err) { console.error(err); }
  };

  const fetchPlaylistDetails = async (playlistId) => {
    try {
      const res = await fetch(`/api/playlists.php?action=get&id=${playlistId}`);
      if (res.ok) setSelectedPlaylist(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleSelectPlaylist = (playlistId) => {
    fetchPlaylistDetails(playlistId);
  };

  const handleAddItemToPlaylist = async (mediaId) => {
    if (!selectedPlaylist) return;
    const newItems = [...selectedPlaylist.items, { mediaId, duration: 10 }];
    
    try {
      const res = await fetch(`/api/playlists.php?action=save-items&id=${selectedPlaylist.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems })
      });
      if (res.ok) fetchPlaylistDetails(selectedPlaylist.id);
    } catch (err) { console.error(err); }
  };

  const handleUpdateItemDuration = async (index, newDuration) => {
    if (!selectedPlaylist) return;
    const newItems = selectedPlaylist.items.map((item, idx) => 
      idx === index ? { ...item, duration: parseInt(newDuration) || 10 } : item
    );

    try {
      const res = await fetch(`/api/playlists.php?action=save-items&id=${selectedPlaylist.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems })
      });
      if (res.ok) fetchPlaylistDetails(selectedPlaylist.id);
    } catch (err) { console.error(err); }
  };

  const handleMoveItem = async (index, direction) => {
    if (!selectedPlaylist) return;
    const items = [...selectedPlaylist.items];
    const targetIdx = index + direction;
    
    if (targetIdx < 0 || targetIdx >= items.length) return;
    
    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;

    try {
      const res = await fetch(`/api/playlists.php?action=save-items&id=${selectedPlaylist.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (res.ok) fetchPlaylistDetails(selectedPlaylist.id);
    } catch (err) { console.error(err); }
  };

  const handleRemoveItemFromPlaylist = async (index) => {
    if (!selectedPlaylist) return;
    const items = selectedPlaylist.items.filter((_, idx) => idx !== index);

    try {
      const res = await fetch(`/api/playlists.php?action=save-items&id=${selectedPlaylist.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (res.ok) fetchPlaylistDetails(selectedPlaylist.id);
    } catch (err) { console.error(err); }
  };

  const handleDeletePlaylist = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente deletar esta playlist de forma definitiva?')) return;
    try {
      const res = await fetch(`/api/playlists.php?action=delete&id=${id}`, { method: 'POST' });
      if (res.ok) {
        fetchPlaylists();
        if (selectedPlaylist && selectedPlaylist.id === id) setSelectedPlaylist(null);
      }
    } catch (err) { console.error(err); }
  };

  const onlineCount = screens.filter(s => s.status === 'online').length;

  return (
    <div className="admin-app">
      
      {/* SIDEBAR COMPONENT */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-dot"></div>
          <span className="logo-text">TvCorp</span>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'screens' ? 'active' : ''}`}
            onClick={() => setActiveTab('screens')}
          >
            <MonitorIcon />
            <span>Telas</span>
            {screens.length > 0 && <span className="badge">{screens.length}</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'playlists' ? 'active' : ''}`}
            onClick={() => setActiveTab('playlists')}
          >
            <PlaylistIcon />
            <span>Playlists</span>
            {playlists.length > 0 && <span className="badge bg-purple">{playlists.length}</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <MediaIcon />
            <span>Mídias</span>
            {media.length > 0 && <span className="badge bg-purple">{media.length}</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator-box">
            <span className={`status-led ${onlineCount > 0 ? 'online' : 'offline'}`}></span>
            <span>{onlineCount} de {screens.length} telas online</span>
          </div>
          <span className="version">A-Team Squad © 2026</span>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="content-container">
        
        {/* VIEW: TELAS */}
        {activeTab === 'screens' && (
          <section className="tab-view fade-in">
            <header className="view-header">
              <div>
                <h1>Gerenciamento de Telas</h1>
                <p className="subtitle">Pareie e monitore o status de suas Smart TVs corporativas em tempo real.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowPairModal(true)}>
                <PlusIcon />
                <span>Parear Tela</span>
              </button>
            </header>

            <div className="screens-grid">
              {screens.length === 0 ? (
                <div className="empty-state">
                  <MonitorIcon />
                  <h3>Nenhuma tela pareada</h3>
                  <p>Adicione sua primeira TV corporativa clicando em "Parear Tela" e inserindo o código de 6 dígitos exibido nela.</p>
                </div>
              ) : (
                screens.map(screen => (
                  <div key={screen.id} className="glass-card screen-card">
                    
                    <div className="screen-card-header">
                      <div>
                        <h3>{screen.name}</h3>
                        <span className="screen-id">ID: {screen.id.substring(0, 15)}...</span>
                      </div>
                      <span className={`status-badge ${screen.status}`}>
                        <span className="status-dot"></span>
                        {screen.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    {/* Screenshot / Preview */}
                    <div className="screen-preview-container">
                      {screen.screenshot_url ? (
                        <img 
                          src={screen.screenshot_url} 
                          alt="Visualização da Tela" 
                          className="screen-preview-img"
                          onClick={() => setExpandedImage(screen.screenshot_url)}
                        />
                      ) : (
                        <div className="screen-preview-placeholder">
                          <MonitorIcon />
                          <span>Sem pré-visualização ativa</span>
                        </div>
                      )}
                      <div className="preview-overlay-info">
                        Última atividade: {screen.last_heartbeat ? new Date(screen.last_heartbeat).toLocaleTimeString() : 'N/A'}
                      </div>
                    </div>

                    {/* Playlist Selector */}
                    <div className="form-group-card">
                      <label>Playlist de Programação</label>
                      <select 
                        value={screen.playlist_id || ''} 
                        onChange={(e) => handleUpdateScreenPlaylist(screen.id, e.target.value)}
                        className="select-premium"
                      >
                        <option value="">-- Sem playlist (Aguardando) --</option>
                        {playlists.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="screen-actions">
                      <button 
                        className="btn btn-icon" 
                        title="Forçar Recarregamento da Tela"
                        onClick={() => handleSendCommand(screen.id, 'reload')}
                        disabled={screen.status === 'offline'}
                      >
                        <RefreshIcon />
                        <span>Recarregar</span>
                      </button>
                      <button 
                        className="btn btn-icon" 
                        title="Capturar Print da Tela Atual"
                        onClick={() => handleSendCommand(screen.id, 'screenshot')}
                        disabled={screen.status === 'offline'}
                      >
                        <CameraIcon />
                        <span>Capturar Print</span>
                      </button>
                      <button 
                        className="btn btn-icon btn-danger" 
                        title="Desparear TV"
                        onClick={() => handleDeleteScreen(screen.id)}
                      >
                        <TrashIcon />
                        <span>Desparear</span>
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* VIEW: PLAYLISTS */}
        {activeTab === 'playlists' && (
          <section className="tab-view fade-in">
            <header className="view-header">
              <div>
                <h1>Playlists</h1>
                <p className="subtitle">Organize, ordene e configure a duração dos conteúdos das grades.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowPlaylistModal(true)}>
                <PlusIcon />
                <span>Nova Playlist</span>
              </button>
            </header>

            <div className="playlist-workspace">
              <div className="playlists-list-panel glass-card">
                <h2>Suas Playlists</h2>
                <div className="playlist-items-scroll">
                  {playlists.length === 0 ? (
                    <div className="empty-panel">
                      <p>Nenhuma playlist criada.</p>
                    </div>
                  ) : (
                    playlists.map(p => (
                      <div 
                        key={p.id} 
                        className={`playlist-row ${selectedPlaylist?.id === p.id ? 'active' : ''}`}
                        onClick={() => handleSelectPlaylist(p.id)}
                      >
                        <span>{p.name}</span>
                        <button className="delete-btn-sub" onClick={(e) => handleDeletePlaylist(p.id, e)}>
                          <TrashIcon />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="playlist-editor-panel glass-card">
                {selectedPlaylist ? (
                  <>
                    <div className="editor-header">
                      <h2>Editando: {selectedPlaylist.name}</h2>
                    </div>

                    <div className="add-to-playlist-section">
                      <label>Adicionar Mídia à Fila:</label>
                      <div className="media-selector-grid">
                        {media.length === 0 ? (
                          <p className="text-muted-p">Adicione mídias na biblioteca primeiro.</p>
                        ) : (
                          media.map(m => (
                            <button 
                              key={m.id} 
                              className="add-media-bubble"
                              onClick={() => handleAddItemToPlaylist(m.id)}
                            >
                              <PlusIcon />
                              <span>{m.name} ({m.type})</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="playlist-queue">
                      <h3>Ordem de Exibição</h3>
                      {selectedPlaylist.items.length === 0 ? (
                        <div className="empty-queue">
                          <p>Nenhuma mídia inserida nesta playlist ainda. Selecione mídias acima.</p>
                        </div>
                      ) : (
                        <div className="queue-list">
                          {selectedPlaylist.items.map((item, index) => (
                            <div key={item.id} className="queue-row">
                              
                              <div className="queue-position">{index + 1}</div>
                              
                              <div className="queue-info">
                                <div className="queue-name">{item.name}</div>
                                <div className="queue-type">{item.type}</div>
                              </div>

                              <div className="queue-duration-control">
                                <input 
                                  type="number" 
                                  min="1"
                                  value={item.duration || item.default_duration || 10} 
                                  onChange={(e) => handleUpdateItemDuration(index, e.target.value)}
                                  className="input-duration"
                                />
                                <span>segundos</span>
                              </div>

                              <div className="queue-actions">
                                <button 
                                  className="btn-arrow" 
                                  disabled={index === 0}
                                  onClick={() => handleMoveItem(index, -1)}
                                >
                                  <ArrowUpIcon />
                                </button>
                                <button 
                                  className="btn-arrow" 
                                  disabled={index === selectedPlaylist.items.length - 1}
                                  onClick={() => handleMoveItem(index, 1)}
                                >
                                  <ArrowDownIcon />
                                </button>
                                <button 
                                  className="btn-delete-item"
                                  onClick={() => handleRemoveItemFromPlaylist(index)}
                                >
                                  <TrashIcon />
                                </button>
                              </div>

                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <PlaylistIcon />
                    <h3>Selecione uma playlist</h3>
                    <p>Escolha uma playlist na lista à esquerda para editar a fila, ajustar tempos de exibição e ordenar conteúdos.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* VIEW: MEDIA LIBRARY */}
        {activeTab === 'media' && (
          <section className="tab-view fade-in">
            <header className="view-header">
              <div>
                <h1>Biblioteca de Mídia</h1>
                <p className="subtitle">Faça upload de fotos/vídeos locais ou cadastre websites externos.</p>
              </div>
            </header>

            <div className="media-workspace">
              <div className="media-form-panel glass-card">
                <h2>Adicionar Conteúdo</h2>
                <form onSubmit={handleAddMedia} className="form-premium">
                  <div className="form-group">
                    <label>Nome da Mídia</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Banner Informativo Outubro"
                      value={newMedia.name}
                      onChange={(e) => setNewMedia({...newMedia, name: e.target.value})}
                      className="input-premium"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Tipo de Mídia</label>
                    <select 
                      value={newMedia.type}
                      onChange={(e) => setNewMedia({...newMedia, type: e.target.value, url: ''})}
                      className="select-premium"
                    >
                      <option value="image">Imagem</option>
                      <option value="video">Vídeo</option>
                      <option value="website">Website (iFrame)</option>
                    </select>
                  </div>

                  {newMedia.type === 'website' ? (
                    <div className="form-group">
                      <label>URL do Website</label>
                      <input 
                        type="url" 
                        placeholder="https://exemplo.com/pagina"
                        value={newMedia.url}
                        onChange={(e) => setNewMedia({...newMedia, url: e.target.value})}
                        className="input-premium"
                        required
                      />
                    </div>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>Arquivo Local (Upload)</label>
                        <div className="file-upload-wrapper">
                          <input 
                            type="file" 
                            id="file-upload" 
                            accept={newMedia.type === 'video' ? 'video/*' : 'image/*'}
                            onChange={handleFileChange}
                            className="input-file-hidden"
                          />
                          <label htmlFor="file-upload" className="btn btn-secondary btn-full">
                            Selecionar Arquivo
                          </label>
                          {uploadFile && <span className="file-name">{uploadFile.name}</span>}
                        </div>
                      </div>

                      <div className="divider-or"><span>OU</span></div>

                      <div className="form-group">
                        <label>Inserir URL da Mídia Direta</label>
                        <input 
                          type="text" 
                          placeholder="https://exemplo.com/imagem.png"
                          value={newMedia.url}
                          onChange={(e) => setNewMedia({...newMedia, url: e.target.value})}
                          className="input-premium"
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Duração Padrão (segundos)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={newMedia.duration}
                      onChange={(e) => setNewMedia({...newMedia, duration: parseInt(e.target.value) || 10})}
                      className="input-premium"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-full">
                    Salvar Mídia na Biblioteca
                  </button>
                </form>
              </div>

              <div className="media-library-panel glass-card">
                <h2>Biblioteca</h2>
                {media.length === 0 ? (
                  <div className="empty-state">
                    <MediaIcon />
                    <h3>Nenhum conteúdo cadastrado</h3>
                    <p>Use o formulário ao lado para carregar imagens/vídeos ou adicionar links externos para exibição.</p>
                  </div>
                ) : (
                  <div className="media-grid">
                    {media.map(m => (
                      <div key={m.id} className="media-card">
                        
                        <div className="media-card-preview">
                          {m.type === 'image' && (
                            <img src={m.url} alt={m.name} onClick={() => setExpandedImage(m.url)} />
                          )}
                          {m.type === 'video' && (
                            <div className="media-video-icon">
                              <VideoIcon />
                              <span>VÍDEO</span>
                            </div>
                          )}
                          {m.type === 'website' && (
                            <div className="media-web-icon">
                              <LinkIcon />
                              <span>WEBSITE</span>
                            </div>
                          )}
                        </div>

                        <div className="media-card-body">
                          <h4>{m.name}</h4>
                          <div className="media-card-meta">
                            <span>{m.type}</span>
                            <span>{m.duration}s</span>
                          </div>
                        </div>

                        <button 
                          className="media-card-delete"
                          onClick={() => handleDeleteMedia(m.id)}
                        >
                          <TrashIcon />
                        </button>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

      </main>

      {/* MODAL: PAREAR TELA */}
      {showPairModal && (
        <div className="modal-overlay">
          <div className="modal-card glass-card fade-in">
            <h2>Parear Nova Tela</h2>
            <p className="modal-description">Veja o código de pareamento de 6 dígitos gerado pela sua TV e digite-o abaixo.</p>
            
            <form onSubmit={handlePairScreen}>
              <div className="form-group">
                <label>Código de Pareamento</label>
                <input 
                  type="text" 
                  maxLength="6"
                  placeholder="EX: X7F9K2"
                  value={pairCodeInput}
                  onChange={(e) => setPairCodeInput(e.target.value)}
                  className="input-premium code-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Nome da Tela / Localização</label>
                <input 
                  type="text" 
                  placeholder="Ex: Recepção Térreo, Refeitório"
                  value={screenNameInput}
                  onChange={(e) => setScreenNameInput(e.target.value)}
                  className="input-premium"
                  required
                />
              </div>

              <div className="form-group">
                <label>Vincular Playlist Inicial (Opcional)</label>
                <select 
                  value={pairPlaylistId} 
                  onChange={(e) => setPairPlaylistId(e.target.value)}
                  className="select-premium"
                >
                  <option value="">-- Deixar em espera --</option>
                  {playlists.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPairModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Vincular TV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR PLAYLIST */}
      {showPlaylistModal && (
        <div className="modal-overlay">
          <div className="modal-card glass-card fade-in">
            <h2>Criar Nova Playlist</h2>
            
            <form onSubmit={handleCreatePlaylist}>
              <div className="form-group">
                <label>Nome da Playlist</label>
                <input 
                  type="text" 
                  placeholder="Ex: Programação Manhã, Comunicados Internos"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="input-premium"
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPlaylistModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Criar Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE IMAGEM EXPANDIDA */}
      {expandedImage && (
        <div className="modal-overlay img-viewer" onClick={() => setExpandedImage(null)}>
          <div className="expanded-image-wrapper">
            <img src={expandedImage} alt="Visualização Completa" />
            <span className="close-viewer">Clique em qualquer lugar para fechar</span>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
