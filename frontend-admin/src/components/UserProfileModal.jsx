import React, { useState, useEffect } from 'react';

export default function UserProfileModal({ isOpen, onClose, user, subscription, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'billing'
  
  // Estado do formulário de perfil
  const [profileForm, setProfileForm] = useState({
    name: user ? user.name : '',
    email: user ? user.email : '',
    company: user ? user.company || '' : ''
  });

  // Estado da alteração de senha
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Estado de mensagens e feedback
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' | 'error'
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        company: user.company || ''
      });
    }
    if (isOpen) {
      fetchPaymentHistory();
    }
  }, [user, isOpen]);

  const fetchPaymentHistory = async () => {
    try {
      const res = await fetch(`/api/auth.php?action=payments&user_id=${user ? user.id : 1}`);
      if (res.ok) {
        const data = await res.json();
        setPaymentHistory(data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico de pagamentos:', err);
    }
  };

  if (!isOpen) return null;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/auth.php?action=update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user ? user.id : 1,
          name: profileForm.name,
          email: profileForm.email,
          company: profileForm.company
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ text: '🎉 Perfil atualizado com sucesso!', type: 'success' });
        if (onUpdateUser) onUpdateUser(data.user);
      } else {
        setMessage({ text: data.error || 'Erro ao atualizar perfil', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Erro de conexão com o servidor', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ text: 'A nova senha e a confirmação não coincidem', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/auth.php?action=change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user ? user.id : 1,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ text: '🔒 Senha alterada com sucesso!', type: 'success' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ text: data.error || 'Erro ao alterar senha', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Erro ao alterar a senha', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content profile-modal" style={{ maxWidth: '680px', padding: '0', overflow: 'hidden' }}>
        
        {/* CABEÇALHO DO PERFIL */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          padding: '24px',
          color: '#fff',
          position: 'relative'
        }}>
          <button className="modal-close-btn" onClick={onClose} style={{ color: '#fff', top: '16px', right: '16px' }}>&times;</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7b61ff 0%, #00f2fe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 20px rgba(0, 242, 254, 0.3)'
            }}>
              {user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>{user ? user.name : 'Administrador TvCorp'}</h2>
              <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{user ? user.email : 'admin@tvcorp.com'}</span>
              {user && user.company && (
                <div style={{ fontSize: '0.8rem', color: '#00f2fe', marginTop: '4px' }}>
                  🏢 {user.company}
                </div>
              )}
            </div>
          </div>

          {/* ABAS DO PERFIL */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => { setActiveTab('profile'); setMessage({ text: '', type: '' }); }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'profile' ? '3px solid #00f2fe' : '3px solid transparent',
                color: activeTab === 'profile' ? '#00f2fe' : '#94a3b8',
                padding: '8px 14px',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              👤 Dados da Conta
            </button>

            <button
              className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => { setActiveTab('security'); setMessage({ text: '', type: '' }); }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'security' ? '3px solid #00f2fe' : '3px solid transparent',
                color: activeTab === 'security' ? '#00f2fe' : '#94a3b8',
                padding: '8px 14px',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              🔒 Segurança & Senha
            </button>

            <button
              className={`profile-tab ${activeTab === 'billing' ? 'active' : ''}`}
              onClick={() => { setActiveTab('billing'); setMessage({ text: '', type: '' }); }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'billing' ? '3px solid #00f2fe' : '3px solid transparent',
                color: activeTab === 'billing' ? '#00f2fe' : '#94a3b8',
                padding: '8px 14px',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              💳 Faturas & Assinatura
            </button>
          </div>
        </div>

        {/* CORPO DO MODAL */}
        <div style={{ padding: '24px', background: '#0b0f19', color: '#fff' }}>
          
          {message.text && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: message.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
              color: message.type === 'success' ? '#10b981' : '#ef4444',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              {message.text}
            </div>
          )}

          {/* ABA 1: DADOS DA CONTA */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Nome Completo *</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#1e293b', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>E-mail Corporativo *</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#1e293b', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Nome da Empresa / Loja</label>
                <input
                  type="text"
                  placeholder="Ex: TvCorp Redes Inc."
                  value={profileForm.company}
                  onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#1e293b', color: '#fff' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #7b61ff 0%, #00f2fe 100%)',
                  color: '#fff',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Salvando Alterações...' : 'Salvar Perfil 💾'}
              </button>
            </form>
          )}

          {/* ABA 2: SEGURANÇA E SENHA */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Senha Atual</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#1e293b', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Nova Senha *</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#1e293b', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Confirmar Nova Senha *</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Repita a nova senha"
                  required
                  minLength={6}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#1e293b', color: '#fff' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#7b61ff',
                  color: '#fff',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Atualizando Senha...' : 'Atualizar Senha 🔒'}
              </button>
            </form>
          )}

          {/* ABA 3: FATURAS E ASSINATURA */}
          {activeTab === 'billing' && (
            <div>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '16px',
                borderRadius: '10px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Plano Atual:</span>
                  <span style={{ fontWeight: '800', color: '#00f2fe', fontSize: '1.1rem' }}>
                    {subscription ? subscription.plan_name : 'Trial 7 Dias Grátis'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Limite de Telas:</span>
                  <span style={{ fontWeight: '700', background: 'rgba(123, 97, 255, 0.2)', color: '#7b61ff', padding: '2px 8px', borderRadius: '6px' }}>
                    {subscription ? subscription.screen_limit : 1} Telas Ativas
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Validade da Assinatura:</span>
                  <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>
                    {subscription ? subscription.expires_at : 'Em breve'}
                  </span>
                </div>
              </div>

              <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#cbd5e1' }}>Histórico de Transações & Faturas (Mercado Pago):</h4>

              {paymentHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.9rem' }}>
                  Nenhum histórico de fatura encontrado.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {paymentHistory.map((item) => (
                    <div key={item.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.plan_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID Mercado Pago: {item.mp_payment_id || 'N/A'}</div>
                      </div>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: item.status === 'active' ? '#10b981' : '#f59e0b',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: item.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'
                      }}>
                        {item.status === 'active' ? '🟢 Aprovado' : '🟡 Pendente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
