import React, { useState, useEffect } from 'react';

// Ícones SVG Inline Premium para a Landing Page
const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>
);

const TvIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
);

const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);

const ShieldCheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
);

const PlayCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

export default function LandingPage({ onSelectPlan, onOpenRegister, onOpenLogin, onGoToApp }) {
  // Estado do Demonstrador Interativo do Player
  const [demoIndex, setDemoIndex] = useState(0);
  const demoMediaList = [
    {
      title: 'Boas-vindas à TvCorp',
      type: 'Imagem Corporativa',
      url: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=800&auto=format&fit=crop',
      tag: 'Comunicados'
    },
    {
      title: 'Indicadores Mensais de Vendas',
      type: 'Dashboard em Tempo Real',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
      tag: 'Metas & Resultados'
    },
    {
      title: 'Portal de Notícias Corporativas',
      type: 'Web Page Integrada',
      url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop',
      tag: 'Endomarketing'
    }
  ];

  // Troca automática de mídias na demonstração
  useEffect(() => {
    const timer = setInterval(() => {
      setDemoIndex((prev) => (prev + 1) % demoMediaList.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing-container">
      {/* 1. HERO BANNER */}
      <header className="landing-hero">
        <div className="hero-badge">
          <SparklesIcon /> Plataforma SaaS de TV Corporativa N° 1
        </div>
        <h1 className="hero-title">
          Comunicação Interna Inteligente <br />
          <span className="gradient-text">Em Todas as Suas Telas</span>
        </h1>
        <p className="hero-subtitle">
          Gerencie a programação das suas TVs em tempo real. Crie playlists personalizadas, 
          envie alertas instantâneos, monitore seus players e engaje seus colaboradores em minutos.
        </p>

        <div className="hero-actions">
          <button className="btn-primary btn-hero-cta" onClick={() => onOpenRegister()}>
            Começar Teste Grátis de 7 Dias 🚀
          </button>
          <a href="#demo-section" className="btn-secondary btn-hero-demo">
            <PlayCircleIcon /> Ver Demonstrador Ao Vivo
          </a>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-num">99.9%</span>
            <span className="stat-label">Disponibilidade dos Players</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-num">&lt; 3s</span>
            <span className="stat-label">Atualização de Conteúdo</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-num">100%</span>
            <span className="stat-label">Nuvem e Sem Hardware Caro</span>
          </div>
        </div>
      </header>

      {/* 2. DEMONSTRADOR AO VIVO (LIVE DEMO PLAYER SIMULATOR) */}
      <section id="demo-section" className="landing-section demo-section">
        <div className="section-header">
          <span className="section-tag">Demonstração Interativa</span>
          <h2 className="section-title">Veja Como Funciona o Player da TvCorp</h2>
          <p className="section-subtitle">
            Simulador em tempo real de como o conteúdo é renderizado na TV do seu escritório ou loja.
          </p>
        </div>

        <div className="demo-player-container">
          <div className="demo-tv-frame">
            <div className="tv-header-bar">
              <div className="tv-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <span className="tv-status-badge">🟢 ONLINE • TV Recepção Principal (1080p)</span>
            </div>

            <div className="tv-screen-viewport">
              <img 
                src={demoMediaList[demoIndex].url} 
                alt={demoMediaList[demoIndex].title} 
                className="tv-media-img fade-in"
              />
              <div className="tv-overlay-info">
                <span className="tv-media-tag">{demoMediaList[demoIndex].tag}</span>
                <h3 className="tv-media-title">{demoMediaList[demoIndex].title}</h3>
                <span className="tv-media-type">{demoMediaList[demoIndex].type}</span>
              </div>
              <div className="tv-ticker-bar">
                <span className="ticker-label">COMUNICADO URGENTE:</span>
                <span className="ticker-text">Reunião Geral de Alinhamento às 16h no Auditório B • Meta do mês atingida com sucesso! 🎉</span>
              </div>
            </div>
          </div>

          <div className="demo-controls-panel">
            <h4 className="controls-title">Mídias em Exibição na Playlist:</h4>
            <div className="controls-list">
              {demoMediaList.map((media, idx) => (
                <button
                  key={idx}
                  className={`demo-media-btn ${demoIndex === idx ? 'active' : ''}`}
                  onClick={() => setDemoIndex(idx)}
                >
                  <span className="btn-index">{idx + 1}</span>
                  <div className="btn-text">
                    <span className="btn-title">{media.title}</span>
                    <span className="btn-type">{media.type}</span>
                  </div>
                  {demoIndex === idx && <span className="playing-indicator">Exibindo 🔴</span>}
                </button>
              ))}
            </div>
            <div className="demo-footer-callout">
              <p>💡 Você pode parear qualquer Smart TV, TV Box Android ou Raspberry Pi em apenas 30 segundos!</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. RECURSOS DO SAAS */}
      <section className="landing-section features-section">
        <div className="section-header">
          <span className="section-tag">Recursos SaaS</span>
          <h2 className="section-title">Tudo o que sua Empresa Precisa</h2>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><TvIcon /></div>
            <h3>Pareamento em 6 Digitos</h3>
            <p>Conecte novas TVs instantaneamente digitando o código de pareamento gerado na tela.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><ZapIcon /></div>
            <h3>Instant Takeover (Alertas)</h3>
            <p>Interrompa a programação de todas as TVs instantaneamente para avisos de emergência ou comemorações.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><ShieldCheckIcon /></div>
            <h3>Monitoramento RDM & Print da Tela</h3>
            <p>Veja o que está passando na TV em tempo real com capturas automáticas e alertas de status online/offline.</p>
          </div>
        </div>
      </section>

      {/* 4. TABELA DE PREÇOS E PACOTES COMERCIAIS */}
      <section className="landing-section pricing-section" id="pacotes">
        <div className="section-header">
          <span className="section-tag">Pacotes & Planos</span>
          <h2 className="section-title">Escolha o Plano Ideal para a Sua Rede</h2>
          <p className="section-subtitle">Sem taxa de adesão ou fidelidade. Cancele quando quiser.</p>
        </div>

        <div className="pricing-grid">
          {/* Plano Trial */}
          <div className="pricing-card">
            <div className="card-header">
              <h3 className="plan-name">Trial Grátis</h3>
              <p className="plan-desc">Ideal para testar o sistema em sua empresa</p>
              <div className="plan-price">
                <span className="currency">R$</span>
                <span className="price">0</span>
                <span className="period">/ 7 dias</span>
              </div>
            </div>
            <ul className="plan-features">
              <li><CheckIcon /> 1 Tela Conectada</li>
              <li><CheckIcon /> Playlists e Mídias Ilimitadas</li>
              <li><CheckIcon /> Suporte via E-mail</li>
              <li><CheckIcon /> Sem cartão de crédito necessário</li>
            </ul>
            <button className="btn-secondary btn-plan" onClick={() => onOpenRegister()}>
              Criar Conta Grátis
            </button>
          </div>

          {/* Plano Start */}
          <div className="pricing-card">
            <div className="card-header">
              <h3 className="plan-name">Plano Start</h3>
              <p className="plan-desc">Pequenos escritórios e recepções</p>
              <div className="plan-price">
                <span className="currency">R$</span>
                <span className="price">39</span>
                <span className="cents">,00</span>
                <span className="period">/ mês</span>
              </div>
            </div>
            <ul className="plan-features">
              <li><CheckIcon /> <strong>2 Telas</strong> Conectadas</li>
              <li><CheckIcon /> Suporte a Imagens, Vídeos e Sites</li>
              <li><CheckIcon /> Captura de Tela RDM</li>
              <li><CheckIcon /> Suporte Prioritário</li>
            </ul>
            <button className="btn-secondary btn-plan" onClick={() => onSelectPlan('start')}>
              Assinar Start (PIX)
            </button>
          </div>

          {/* Plano Pro (Destaque) */}
          <div className="pricing-card featured">
            <div className="featured-badge">⭐ Mais Escolhido</div>
            <div className="card-header">
              <h3 className="plan-name">Plano Pro</h3>
              <p className="plan-desc">Empresas em expansão e franquias</p>
              <div className="plan-price">
                <span className="currency">R$</span>
                <span className="price">89</span>
                <span className="cents">,00</span>
                <span className="period">/ mês</span>
              </div>
            </div>
            <ul className="plan-features">
              <li><CheckIcon /> <strong>5 Telas</strong> Conectadas</li>
              <li><CheckIcon /> Instant Takeover (Alertas Urgentes)</li>
              <li><CheckIcon /> Gestão por Grupos de TVs</li>
              <li><CheckIcon /> Suporte 24/7 Dedicado</li>
            </ul>
            <button className="btn-primary btn-plan" onClick={() => onSelectPlan('pro')}>
              Assinar Pro (PIX Mercado Pago)
            </button>
          </div>

          {/* Plano Enterprise */}
          <div className="pricing-card">
            <div className="card-header">
              <h3 className="plan-name">Enterprise</h3>
              <p className="plan-desc">Grandes redes, indústrias e varejo</p>
              <div className="plan-price">
                <span className="currency">R$</span>
                <span className="price">199</span>
                <span className="cents">,00</span>
                <span className="period">/ mês</span>
              </div>
            </div>
            <ul className="plan-features">
              <li><CheckIcon /> <strong>15 Telas</strong> Conectadas</li>
              <li><CheckIcon /> Domínio Personalizado</li>
              <li><CheckIcon /> SLA 99.9% com Garantia</li>
              <li><CheckIcon /> Gerente de Conta Dedicado</li>
            </ul>
            <button className="btn-secondary btn-plan" onClick={() => onSelectPlan('enterprise')}>
              Assinar Enterprise
            </button>
          </div>
        </div>
      </section>

      {/* 5. FAQ */}
      <section className="landing-section faq-section">
        <div className="section-header">
          <h2 className="section-title">Perguntas Frequentes</h2>
        </div>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>Qual hardware preciso para usar o TvCorp?</h4>
            <p>Qualquer Smart TV com navegador web, TV Box Android, Fire TV Stick ou Raspberry Pi. Não é necessário hardware proprietário caro.</p>
          </div>
          <div className="faq-item">
            <h4>Como funciona o pagamento via Mercado Pago?</h4>
            <p>Você pode assinar diretamente via PIX com ativação instantânea ou cartão de crédito através da nossa integração segura com o Mercado Pago.</p>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">📺 TvCorp SaaS</div>
          <p>© {new Date().getFullYear()} TvCorp Inc. Todos os direitos reservados. Plataforma de TV Corporativa Inteligente.</p>
        </div>
      </footer>
    </div>
  );
}
