const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { getDatabase } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Permitir receber screenshots em base64 grandes

const PORT = process.env.PORT || 3001;

// Gerenciamento de Conexões Ativas de Players
const activePlayers = new Map(); // socket.id -> screenId

// Função utilitária para gerar código de pareamento único de 6 dígitos
function generatePairCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem O, 0, I, 1 para evitar confusão
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// REST API
// ==========================================

// 1. TELAS (SCREENS)
// Listar todas as telas
app.get('/api/screens', async (req, res) => {
  try {
    const db = await getDatabase();
    const screens = await db.all(`
      SELECT s.*, p.name as playlist_name 
      FROM screens s 
      LEFT JOIN playlists p ON s.playlist_id = p.id
    `);
    res.json(screens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar código temporário do Player (para a TV mostrar o código na tela)
app.post('/api/screens/register-code', async (req, res) => {
  const { screenId } = req.body;
  if (!screenId) return res.status(400).json({ error: 'screenId é obrigatório' });

  try {
    const db = await getDatabase();
    
    // Verificar se já existe tela pareada ou não
    const existing = await db.get('SELECT * FROM screens WHERE id = ?', screenId);
    
    let pairCode;
    if (existing) {
      if (existing.paired_at) {
        return res.json({ paired: true, screen: existing });
      }
      pairCode = existing.pair_code || generatePairCode();
      await db.run('UPDATE screens SET pair_code = ?, status = "online", last_heartbeat = ? WHERE id = ?', 
        pairCode, new Date().toISOString(), screenId);
    } else {
      pairCode = generatePairCode();
      await db.run('INSERT INTO screens (id, name, status, pair_code, last_heartbeat) VALUES (?, ?, ?, ?, ?)',
        screenId, 'Tela não pareada', 'online', pairCode, new Date().toISOString());
    }

    res.json({ paired: false, pairCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Parear tela pelo painel admin (insere o código e dá um nome à tela)
app.post('/api/screens/pair', async (req, res) => {
  const { pairCode, name, playlistId } = req.body;
  if (!pairCode || !name) {
    return res.status(400).json({ error: 'pairCode e name são obrigatórios' });
  }

  try {
    const db = await getDatabase();
    const screen = await db.get('SELECT * FROM screens WHERE pair_code = ?', pairCode.toUpperCase());

    if (!screen) {
      return res.status(404).json({ error: 'Código de pareamento inválido ou expirado' });
    }

    if (screen.paired_at) {
      return res.status(400).json({ error: 'Esta tela já está pareada' });
    }

    const now = new Date().toISOString();
    await db.run(
      'UPDATE screens SET name = ?, paired_at = ?, playlist_id = ?, pair_code = NULL WHERE id = ?',
      name, now, playlistId || null, screen.id
    );

    // Notificar o player via WebSocket de que foi pareado
    io.to(screen.id).emit('paired', { screenId: screen.id, name });

    res.json({ success: true, screenId: screen.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Desparear ou Excluir uma tela
app.delete('/api/screens/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM screens WHERE id = ?', id);
    
    // Avisar o player para limpar as credenciais locais e voltar a exibir tela de pareamento
    io.to(id).emit('unpaired');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar playlist associada a uma tela
app.put('/api/screens/:id/playlist', async (req, res) => {
  const { id } = req.params;
  const { playlistId } = req.body;

  try {
    const db = await getDatabase();
    await db.run('UPDATE screens SET playlist_id = ? WHERE id = ?', playlistId || null, id);
    
    // Notificar o player imediatamente que o conteúdo mudou
    io.to(id).emit('playlist_updated');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar comando manual para a tela (Casting, Reload, Screenshot, Reboot)
app.post('/api/screens/:id/command', async (req, res) => {
  const { id } = req.params;
  const { command, payload } = req.body; // command: 'reload', 'screenshot', 'cast'

  if (!command) return res.status(400).json({ error: 'command é obrigatório' });

  // Enviar comando para o socket do player específico
  io.to(id).emit('command', { command, payload });
  res.json({ success: true, message: `Comando ${command} enviado para a tela.` });
});

// Obter playlist atual de uma tela (usado pelo player no carregamento inicial)
app.get('/api/screens/:id/playlist', async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDatabase();
    const screen = await db.get('SELECT playlist_id FROM screens WHERE id = ?', id);
    
    if (!screen || !screen.playlist_id) {
      return res.json({ playlist: null, items: [] });
    }

    const playlist = await db.get('SELECT * FROM playlists WHERE id = ?', screen.playlist_id);
    const items = await db.all(`
      SELECT pi.*, m.name, m.type, m.url, COALESCE(pi.duration, m.duration) as active_duration
      FROM playlist_items pi
      JOIN media m ON pi.media_id = m.id
      WHERE pi.playlist_id = ?
      ORDER BY pi.position ASC
    `, screen.playlist_id);

    res.json({ playlist, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 2. BIBLIOTECA DE MÍDIA (MEDIA)
app.get('/api/media', async (req, res) => {
  try {
    const db = await getDatabase();
    const media = await db.all('SELECT * FROM media ORDER BY id DESC');
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/media', async (req, res) => {
  const { name, type, url, duration } = req.body;
  if (!name || !type || !url) {
    return res.status(400).json({ error: 'name, type e url são obrigatórios' });
  }

  try {
    const db = await getDatabase();
    const result = await db.run(
      'INSERT INTO media (name, type, url, duration) VALUES (?, ?, ?, ?)',
      name, type, url, duration || 10
    );
    res.status(201).json({ id: result.lastID, name, type, url, duration: duration || 10 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/media/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM media WHERE id = ?', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 3. PLAYLISTS
app.get('/api/playlists', async (req, res) => {
  try {
    const db = await getDatabase();
    const playlists = await db.all('SELECT * FROM playlists ORDER BY id DESC');
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter detalhes de uma playlist incluindo seus itens e mídias
app.get('/api/playlists/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDatabase();
    const playlist = await db.get('SELECT * FROM playlists WHERE id = ?', id);
    if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada' });

    const items = await db.all(`
      SELECT pi.*, m.name, m.type, m.url, m.duration as default_duration
      FROM playlist_items pi
      JOIN media m ON pi.media_id = m.id
      WHERE pi.playlist_id = ?
      ORDER BY pi.position ASC
    `, id);

    res.json({ ...playlist, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/playlists', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name é obrigatório' });

  try {
    const db = await getDatabase();
    const result = await db.run('INSERT INTO playlists (name) VALUES (?)', name);
    res.status(201).json({ id: result.lastID, name, items: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/playlists/:id/items', async (req, res) => {
  const { id } = req.params;
  const { items } = req.body; // Array de { mediaId, duration, position }

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items deve ser uma array' });
  }

  try {
    const db = await getDatabase();
    
    // Iniciar transação
    await db.run('BEGIN TRANSACTION');
    
    // Apagar itens antigos
    await db.run('DELETE FROM playlist_items WHERE playlist_id = ?', id);

    // Inserir novos itens reordenados
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await db.run(
        'INSERT INTO playlist_items (playlist_id, media_id, position, duration) VALUES (?, ?, ?, ?)',
        id, item.mediaId, i, item.duration || null
      );
    }

    await db.run('COMMIT');

    // Notificar todas as telas conectadas a esta playlist que ela mudou
    const screens = await db.all('SELECT id FROM screens WHERE playlist_id = ?', id);
    screens.forEach(screen => {
      io.to(screen.id).emit('playlist_updated');
    });

    res.json({ success: true });
  } catch (error) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/playlists/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM playlists WHERE id = ?', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// WEBSOCKETS (SOCKET.IO)
// ==========================================

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Registro inicial do Player
  socket.on('register_player', async ({ screenId }) => {
    if (!screenId) return;
    
    socket.join(screenId);
    activePlayers.set(socket.id, screenId);
    console.log(`Player registrado na sala: ${screenId} (Socket: ${socket.id})`);

    try {
      const db = await getDatabase();
      await db.run('UPDATE screens SET status = "online", last_heartbeat = ? WHERE id = ?', 
        new Date().toISOString(), screenId);
    } catch (err) {
      console.error('Erro ao atualizar status da tela no registro:', err.message);
    }
  });

  // Heartbeat do Player
  socket.on('heartbeat', async ({ screenId }) => {
    if (!screenId) return;

    try {
      const db = await getDatabase();
      await db.run('UPDATE screens SET status = "online", last_heartbeat = ? WHERE id = ?', 
        new Date().toISOString(), screenId);
    } catch (err) {
      console.error('Erro ao salvar heartbeat:', err.message);
    }
  });

  // Receber Screenshot em base64 da tela
  socket.on('screenshot_response', async ({ screenId, base64 }) => {
    if (!screenId) return;
    try {
      const db = await getDatabase();
      await db.run('UPDATE screens SET screenshot_url = ? WHERE id = ?', base64, screenId);
      console.log(`Screenshot atualizado para a tela: ${screenId}`);
    } catch (err) {
      console.error('Erro ao salvar screenshot:', err.message);
    }
  });

  socket.on('disconnect', async () => {
    const screenId = activePlayers.get(socket.id);
    if (screenId) {
      console.log(`Player desconectado: ${screenId} (Socket: ${socket.id})`);
      activePlayers.delete(socket.id);
      
      // Esperar alguns segundos para ter certeza que desconectou de vez (e não um reload rápido)
      setTimeout(async () => {
        // Verificar se não há nenhum outro socket registrado na sala dessa tela
        const activeSockets = await io.in(screenId).fetchSockets();
        if (activeSockets.length === 0) {
          try {
            const db = await getDatabase();
            await db.run('UPDATE screens SET status = "offline" WHERE id = ?', screenId);
            console.log(`Tela marcada como offline: ${screenId}`);
          } catch (err) {
            console.error('Erro ao marcar tela offline:', err.message);
          }
        }
      }, 5000);
    }
  });
});

// Loop periódico para marcar telas offline por inatividade
setInterval(async () => {
  try {
    const db = await getDatabase();
    const now = new Date();
    const screens = await db.all('SELECT id, last_heartbeat, status FROM screens WHERE status = "online"');
    
    for (const screen of screens) {
      if (!screen.last_heartbeat) continue;
      
      const lastHb = new Date(screen.last_heartbeat);
      const diffSeconds = (now - lastHb) / 1000;
      
      // Se não houver batimento há mais de 45 segundos, marcar offline
      if (diffSeconds > 45) {
        await db.run('UPDATE screens SET status = "offline" WHERE id = ?', screen.id);
        console.log(`Monitor de inatividade: Tela ${screen.id} inativa há ${diffSeconds}s e marcada offline.`);
      }
    }
  } catch (err) {
    console.error('Erro no monitor de inatividade:', err.message);
  }
}, 20000);

// Iniciar Servidor
server.listen(PORT, () => {
  console.log(`Servidor da API TvCorp rodando na porta ${PORT}`);
});
