"import React, { useState } from 'react';

export default function SubscriptionModal({ isOpen, onClose, user, subscription, onRefreshSubscription }) {
  const [selectedPlanKey, setSelectedPlanKey] = useState('pro');
  const [paymentMethodTab, setPaymentMethodTab] = useState('card'); // 'card' | 'pix'
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Estados do Formulário de Cartão de Crédito
  const [cardForm, setCardForm] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: '',
    installments: '1'
  });

  if (!isOpen) return null;

  const plans = [
    { key: 'start', name: 'Plano Start', price: 39.00, formattedPrice: 'R$ 39,00', screens: 2, desc: 'Até 2 telas ativas' },
    { key: 'pro', name: 'Plano Pro', price: 89.00, formattedPrice: 'R$ 89,00', screens: 5, desc: 'Até 5 telas ativas + Takeover' },
    { key: 'enterprise', name: 'Plano Enterprise', price: 199.00, formattedPrice: 'R$ 199,00', screens: 15, desc: 'Até 15 telas + Suporte 24/7' }
  ];

  const currentSelectedPlan = plans.find(p => p.key === selectedPlanKey) || plans[1];

  const handleCardFormChange = (e) => {
    const { name, value } = e.target;
    setCardForm(prev => ({ ...prev, [name]: value }));
  };

  // Processar pagamento com Cartão de Crédito
  const handlePayWithCard = async (e) => {
    e.preventDefault();
    if (!cardForm.number || !cardForm.holder || !cardForm.expiry || !cardForm.cvv) {
      alert('Por favor, preencha todos os campos do cartão de crédito.');
      return;
    }

    setLoading(true);
    setPaymentSuccessMsg('');

    try {
      const res = await fetch('/api/mercadopago.php?action=create-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey: selectedPlanKey,
          userId: user ? user.id : 1,
          email: user ? user.email : 'cliente@tvcorp.com',
          installments: parseInt(cardForm.installments),
          cardToken: 'token_demo_' + Math.random().toString(36).substring(2, 9)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPaymentSuccessMsg(data.message || '🎉 Pagamento com Cartão Aprovado com Sucesso!');
        if (onRefreshSubscription) onRefreshSubscription();
      } else {
        alert(data.error || 'Erro ao processar o pagamento com cartão');
      }
    } catch (err) {
      console.error('Erro no checkout de cartão:', err);
      alert('Não foi possível conectar ao servidor de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  // Solicitar geração de PIX no backend Mercado Pago
  const handleGeneratePix = async () => {
    setLoading(true);
    setPaymentSuccessMsg('');
    setPixData(null);

    try {
      const res = await fetch('/api/mercadopago.php?action=create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey: selectedPlanKey,
          userId: user ? user.id : 1,
          email: user ? user.email : 'cliente@tvcorp.com'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPixData(data);
      } else {
        alert(data.error || 'Erro ao gerar cobrança PIX');
      }
    } catch (err) {
      console.error('Erro na requisição Mercado Pago:', err);
      alert('Não foi possível se conectar ao gateway de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  // Simulação de confirmação instantânea de pagamento Webhook
  const handleSimulatePaymentConfirm = async () => {
    if (!pixData || !pixData.payment_id) return;
    setLoading(true);

    try {
      const res = await fetch('/api/webhook.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payment.created',
          data: { id: pixData.payment_id },
          type: 'payment'
        })
      });

      const data = await res.json();
      if (data.status === 'ok') {
        setPaymentSuccessMsg('🎉 Pagamento Aprovado com Sucesso via Mercado Pago!');
        setPixData(null);
        if (onRefreshSubscription) onRefreshSubscription();
      }
    } catch (err) {
      console.error('Erro ao simular webhook:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content subscription-modal" style={{ maxWidth: '640px' }}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        
        <h2 className="modal-title">💳 Minha Assinatura & Checkout Mercado Pago</h2>
        
        {/* STATUS DA ASSINATURA ATUAL */}
        <div className="current-sub-box">
          <div className="sub-info">
            <span className="sub-label">Plano Ativo:</span>
            <span className="sub-value font-bold">{subscription ? subscription.plan_name : 'Trial 7 Dias'}</span>
          </div>
          <div className="sub-info">
            <span className="sub-label">Limite de Telas:</span>
            <span className="sub-value badge-limit">{subscription ? subscription.screen_limit : 1} Telas</span>
          </div>
          <div className="sub-info">
            <span className="sub-label">Status:</span>
            <span className={`sub-status-tag ${subscription && subscription.status === 'active' ? 'active' : 'pending'}`}>
              {subscription && subscription.status === 'active' ? '🟢 Ativo' : '🟡 Pendente'}
            </span>
          </div>
          <div className="sub-info">
            <span className="sub-label">Vencimento:</span>
            <span className="sub-value">{subscription ? subscription.expires_at : 'Em breve'}</span>
          </div>
        </div>

        {paymentSuccessMsg && (
          <div className="alert-success" style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#10b981',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            {paymentSuccessMsg}
          </div>
        )}

        {/* SELEÇÃO DE PLANO */}
        {!pixData && (
          <div className="plan-selection-area">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>1. Selecione o Plano Desejado:</h3>
            <div className="plan-options-grid" style={{ display: 'grid', gap: '8px', marginBottom: '1.25rem' }}>
              {plans.map((p) => (
                <div
                  key={p.key}
                  className={`plan-option-card ${selectedPlanKey === p.key ? 'selected' : ''}`}
                  onClick={() => setSelectedPlanKey(p.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: selectedPlanKey === p.key ? '2px solid #7b61ff' : '1px solid rgba(255,255,255,0.1)',
                    background: selectedPlanKey === p.key ? 'rgba(123, 97, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="opt-name" style={{ fontWeight: '700', fontSize: '1rem' }}>{p.name}</span>
                    <span className="opt-desc" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{p.desc}</span>
                  </div>
                  <span className="opt-price" style={{ fontWeight: '800', color: '#7b61ff', fontSize: '1.1rem' }}>{p.formattedPrice}</span>
                </div>
              ))}
            </div>

            {/* SELEÇÃO DO MÉTODO DE PAGAMENTO (ABAS) */}
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>2. Escolha o Método de Pagamento:</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem' }}>
              <button
                type="button"
                className={`btn-tab ${paymentMethodTab === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethodTab('card')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: paymentMethodTab === 'card' ? '2px solid #7b61ff' : '1px solid rgba(255,255,255,0.1)',
                  background: paymentMethodTab === 'card' ? '#7b61ff' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                💳 Cartão de Crédito
              </button>
              <button
                type="button"
                className={`btn-tab ${paymentMethodTab === 'pix' ? 'active' : ''}`}
                onClick={() => setPaymentMethodTab('pix')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: paymentMethodTab === 'pix' ? '2px solid #00f2fe' : '1px solid rgba(255,255,255,0.1)',
                  background: paymentMethodTab === 'pix' ? '#00f2fe' : 'rgba(255,255,255,0.05)',
                  color: paymentMethodTab === 'pix' ? '#000' : '#fff',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ⚡ PIX Instantâneo
              </button>
            </div>

            {/* FORMULÁRIO DE CARTÃO DE CRÉDITO */}
            {paymentMethodTab === 'card' && (
              <form onSubmit={handlePayWithCard} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Número do Cartão *</label>
                  <input
                    type="text"
                    name="number"
                    placeholder="4532 •••• •••• 8892"
                    value={cardForm.number}
                    onChange={handleCardFormChange}
                    maxLength={19}
                    required
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: '#0f172a', color: '#fff' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Nome Impresso no Cartão *</label>
                  <input
                    type="text"
                    name="holder"
                    placeholder="NOME COMO NO CARTÃO"
                    value={cardForm.holder}
                    onChange={handleCardFormChange}
                    required
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: '#0f172a', color: '#fff' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Validade *</label>
                    <input
                      type="text"
                      name="expiry"
                      placeholder="MM/AA"
                      value={cardForm.expiry}
                      onChange={handleCardFormChange}
                      maxLength={5}
                      required
                      style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: '#0f172a', color: '#fff' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>CVV *</label>
                    <input
                      type="password"
                      name="cvv"
                      placeholder="123"
                      value={cardForm.cvv}
                      onChange={handleCardFormChange}
                      maxLength={4}
                      required
                      style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: '#0f172a', color: '#fff' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Parcelas</label>
                    <select
                      name="installments"
                      value={cardForm.installments}
                      onChange={handleCardFormChange}
                      style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: '#0f172a', color: '#fff' }}
                    >
                      <option value="1">1x à vista ({currentSelectedPlan.formattedPrice})</option>
                      <option value="2">2x de R$ {(currentSelectedPlan.price / 2).toFixed(2)}</option>
                      <option value="3">3x de R$ {(currentSelectedPlan.price / 3).toFixed(2)}</option>
                      <option value="6">6x de R$ {(currentSelectedPlan.price / 6).toFixed(2)}</option>
                      <option value="12">12x de R$ {(currentSelectedPlan.price / 12).toFixed(2)}</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #7b61ff 0%, #00f2fe 100%)',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '1rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Processando Cartão no Mercado Pago...' : `Confirmar Pagamento de ${currentSelectedPlan.formattedPrice} 💳`}
                </button>
              </form>
            )}

            {/* BOTÃO PARA GERAR PIX */}
            {paymentMethodTab === 'pix' && (
              <button 
                className="btn-primary btn-checkout-mp" 
                onClick={handleGeneratePix}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#00f2fe',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '1rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Gerando PIX Mercado Pago...' : `Gerar QR Code PIX (${currentSelectedPlan.formattedPrice}) ⚡`}
              </button>
            )}
          </div>
        )}

        {/* TELA DE EXIBIÇÃO DO PIX GERADO */}
        {pixData && (
          <div className="pix-checkout-box">
            <h3>Quase lá! Escaneie o QR Code PIX para ativar:</h3>
            <p className="pix-amount">Valor: <strong>R$ {pixData.price?.toFixed(2)}</strong></p>

            <div className="qr-code-wrapper" style={{ textCenter: 'center', margin: '1rem 0' }}>
              <img src={pixData.qr_code_base64} alt="QR Code PIX Mercado Pago" className="qr-code-img" style={{ maxWidth: '180px' }} />
            </div>

            <div className="pix-copia-cola-box">
              <label>Código PIX Copia e Cola:</label>
              <textarea readOnly value={pixData.qr_code} className="pix-input-textarea" rows={3}></textarea>
              <button 
                className="btn-secondary btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(pixData.qr_code);
                  alert('Código PIX copiado!');
                }}
              >
                Copiar Chave PIX 📋
              </button>
            </div>

            <div className="checkout-sim-area" style={{ marginTop: '1rem' }}>
              <p className="sim-text">💡 <em>Ambiente de Testes Sandbox Ativo:</em></p>
              <button className="btn-primary btn-sim-pay" onClick={handleSimulatePaymentConfirm} disabled={loading}>
                {loading ? 'Confirmando...' : 'Simular Confirmação Instantânea de Pagamento 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
" </div>
        )}
      </div>
    </div>
  );
}
