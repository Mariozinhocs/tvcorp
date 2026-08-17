/**
 * TvCorp — Controller de Autenticação e Guarda de Rotas
 */

async function checkAuthGuard() {
  try {
    const res = await fetch('api/auth.php?action=me');
    if (!res.ok) {
      window.location.replace('login.html');
      return null;
    }
    const data = await res.json();
    if (!data.authenticated || !data.user) {
      window.location.replace('login.html');
      return null;
    }
    return data;
  } catch (err) {
    console.error('Erro na guarda de autenticação:', err);
    window.location.replace('login.html');
    return null;
  }
}

async function handleLogout() {
  try {
    await fetch('api/auth.php?action=logout', { method: 'POST' });
    localStorage.removeItem('tvcorp_user');
    window.location.replace('login.html');
  } catch (err) {
    console.error('Erro ao fazer logout:', err);
  }
}
