const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let dbConnection = null;

async function getDatabase() {
  if (dbConnection) return dbConnection;

  const dbPath = path.join(__dirname, 'tvcorp.db');
  
  dbConnection = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Habilitar chaves estrangeiras
  await dbConnection.run('PRAGMA foreign_keys = ON');

  // Inicializar tabelas
  await dbConnection.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('image', 'video', 'website')) NOT NULL,
      url TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 10
    );

    CREATE TABLE IF NOT EXISTS playlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlist_id INTEGER NOT NULL,
      media_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      duration INTEGER,
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS screens (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT CHECK(status IN ('online', 'offline')) NOT NULL DEFAULT 'offline',
      pair_code TEXT UNIQUE,
      paired_at TEXT,
      playlist_id INTEGER,
      last_heartbeat TEXT,
      screenshot_url TEXT,
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE SET NULL
    );
  `);

  // Semear dados iniciais de demonstração (seed)
  try {
    const mediaCount = await dbConnection.get('SELECT COUNT(*) as count FROM media');
    if (mediaCount.count === 0) {
      console.log('Semeando dados iniciais na biblioteca de mídia...');
      
      // Inserir mídias de demonstração
      await dbConnection.run(
        'INSERT INTO media (name, type, url, duration) VALUES (?, ?, ?, ?)',
        'Bem-vindo à TvCorp', 'image', 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=640&auto=format&fit=crop', 8
      );
      await dbConnection.run(
        'INSERT INTO media (name, type, url, duration) VALUES (?, ?, ?, ?)',
        'Indicadores de Performance', 'image', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=640&auto=format&fit=crop', 8
      );
      await dbConnection.run(
        'INSERT INTO media (name, type, url, duration) VALUES (?, ?, ?, ?)',
        'Website Corporativo', 'website', 'https://www.wikipedia.org', 12
      );

      // Criar playlist padrão
      const plResult = await dbConnection.run('INSERT INTO playlists (name) VALUES (?)', 'Programação Geral');
      const playlistId = plResult.lastID;

      // Associar mídias à playlist
      const mediaItems = await dbConnection.all('SELECT id FROM media');
      for (let i = 0; i < mediaItems.length; i++) {
        await dbConnection.run(
          'INSERT INTO playlist_items (playlist_id, media_id, position, duration) VALUES (?, ?, ?, ?)',
          playlistId, mediaItems[i].id, i, null
        );
      }
      console.log('Dados de demonstração semeados com sucesso!');
    }
  } catch (err) {
    console.error('Erro ao semear dados iniciais:', err.message);
  }

  console.log('Banco de dados SQLite inicializado com sucesso em:', dbPath);
  return dbConnection;
}

module.exports = { getDatabase };
