# Memória do Projeto: TvCorp — Plataforma SaaS de TV Corporativa

> **Status Atual:** 100% Operacional (Benchmark ScreenCloud & 360Studio)  
> **Última Atualização:** 09 de Setembro de 2026  
> **Squad:** A-Team (PO: Product Owner / Agent: Antigravity AI)  
> **Tagline Oficial:** *"TvCorp — Transforme Suas Smart TVs em Hubs de Comunicação e Mídia Indoor"*

---

## 📌 1. Visão Geral & Arquitetura de Camadas

O **TvCorp** é a plataforma inteligente para Gestão de Mídia Indoor, TV Corporativa, Mural Digital, Transmissão em Smart TVs/TV Boxes e Comunicação Interna Corporativa, alinhada às melhores práticas dos líderes globais de software (**ScreenCloud** & **Anorak Technology**).

### Credenciais Padrão do Super Admin:
* **E-mail:** `admin@tvcorp.com`
* **Usuário:** `mariozinhocs`
* **Senha:** `admin123`
* **Painel Admin:** [`admin.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/admin.html)

### Camadas de Páginas (HTML5 / Vanilla JS / CSS3 / PHP PDO):
1. **Landing Page Pública ([`index.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/index.html)):**
   * Nome limpo e unificado **TvCorp** com a Tagline Oficial e estética **Anoraks Technology Studio**.
   * **Menu Superior Alinhado Glassmorphic (Fixado no Topo):** Links para *Plataformas*, *Engenharia & Recursos*, *Casos de Uso*, *Planos*, *Tutoriais & Ajuda*, *Entrar*, *Testar 7 Dias Grátis* e botão flutuante *Back to Top*.
   * **Hero Section Anorak Benchmark:** Eyebrow pill badge (`⚡ SMART TV & DIGITAL SIGNAGE PLATFORM`), título de alta conversão, subtítulo focado em estabilidade (Offline-first, <3s atualização) e barra de ecossistema de hardware (Samsung Tizen, LG webOS, Android TV, Fire TV, Windows).
   * **Barra de Estatísticas chave:** `99.9% Disponibilidade`, `< 3s Atualização Remota`, `100% Nuvem e Offline-First`.
   * **Simulador de TV em Tempo Real (Live Studio CMS Simulator):** Player animado nativo em CSS/JS com rotação automática de 3 slides (Endomarketing, Dashboard de KPIs e Mídia Indoor com QR Code), relógio ao vivo, clima local e ticker RSS.
   * **Grid de Recursos & Engenharia Anorak:** Pareamento 6 dígitos, Agendamento Inteligente (Smart Scheduling), Feeds RSS/Clima, Instant Takeover de emergência, Print remoto/Proof of Play e Gestão Multi-lojas.
   * **Casos de Uso por Indústria:** Escritórios & Endomarketing, Varejo & Mídia Indoor, Lobbies & Recepções, Indústria & Dashboards.
   * **Seção de Planos 360Studio + Matriz Comparativa Detalhada:** Seletor Mensal / Anual (-20% desc), 4 Cards (*Start*, *Pro*, *Enterprise*, *Master Franchise*) e Tabela Comparativa de Recursos estilo ScreenCloud/Anorak.
2. **Central de Tutoriais & Ajuda ([`help.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/help.html)):**
   * Guias passo a passo para instalação em Samsung Tizen, LG WebOS, Android TV, Fire TV e TV Box.
   * Manual de pareamento em 6 dígitos, montagem de playlists e solução de dúvidas técnicas.
3. **Área Privada Operacional do Assinante ([`app.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/app.html)):**
   * Sidebar 360Studio com 5 abas funcionais (*Minhas Telas*, *Playlists & Mídias*, *Minha Assinatura*, *Tutoriais & Ajuda*, *Meu Perfil*).
4. **Painel Administrativo & Gestão SaaS ([`admin.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/admin.html)):**
   * KPIs SaaS em tempo real (MRR, Total Clientes, Ativos, Trial, Expirados e Telas) e gestão de assinaturas via `api/admin.php`.
5. **Autenticação SaaS ([`login.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/login.html)):**
   * Tela de Registro reformulada com campos *Nome Completo*, *Nome de Usuário*, *E-mail*, *Senha* e ativação automática do **Trial Grátis de 7 Dias**.
6. **Instalador de Banco ([`db_installer.php`](file:///g:/Meu%20Drive/Dev's/TvCorp/db_installer.php)):**
   * Instalador Web automático para criação/migração de tabelas no banco de dados.

---

## 💳 2. Gateway de Pagamento Mercado Pago

* **Métodos Suportados:** ⚡ **PIX Instantâneo** (QR Code + Chave Copia e Cola) e 💳 **Cartão de Crédito** (Parcelado em até 12x).
* **Endpoints:** `api/mercadopago.php`, `api/admin.php` e `api/webhook.php`.

---

## 🌐 3. URLs Ativas dos Ambientes

* 🧪 **Homologação (`/hml`):** [https://tvcorp.hubdigital360.com/hml/index.html](https://tvcorp.hubdigital360.com/hml/index.html)
* 🎬 **Player Homologação:** [https://tvcorp.hubdigital360.com/hml/player/](https://tvcorp.hubdigital360.com/hml/player/)
* 🌐 **Produção (Raiz `/`):** [https://tvcorp.hubdigital360.com/index.html](https://tvcorp.hubdigital360.com/index.html)
* 🎬 **Player Produção:** [https://tvcorp.hubdigital360.com/index.html](https://tvcorp.hubdigital360.com/index.html)

---

## 🚀 4. Comandos de Deploy FTP Direto

- **Homologação:** `powershell.exe -ExecutionPolicy Bypass -File deploy-hml.ps1`
- **Produção:** `powershell.exe -ExecutionPolicy Bypass -File deploy-prod.ps1`
