# Memória do Projeto: TvCorp — Plataforma SaaS de TV Corporativa

> **Status Atual:** 100% Operacional (Benchmark ScreenCloud & 360Studio)  
> **Última Atualização:** 18 de Agosto de 2026  
> **Squad:** A-Team (PO: Mario Henrique / Agent: Antigravity AI)  
> **Tagline Oficial:** *"TvCorp — Transforme Suas Smart TVs em Hubs de Comunicação e Mídia Indoor"*

---

## 📌 1. Visão Geral & Arquitetura de Camadas

O **TvCorp** é a plataforma inteligente para Gestão de Mídia Indoor, TV Corporativa, Mural Digital, Transmissão em Smart TVs/TV Boxes e Comunicação Interna Corporativa, alinhada às melhores práticas dos líderes globais de software (**ScreenCloud**).

### Camadas de Páginas (HTML5 / Vanilla JS / CSS3 / PHP PDO):
1. **Landing Page Pública ([`index.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/index.html)):**
   * Nome limpo e unificado **TvCorp** com a Tagline Oficial.
   * **Menu Superior Alinhado:** Links para *Recursos*, *Casos de Uso*, *Planos*, *Tutoriais & Ajuda*, *Entrar* e *Testar 7 Dias Grátis*.
   * **Hero Section ScreenCloud-Style:** Badge de destaque, estatísticas chave do player (`99.9% Disponibilidade`, `< 3s Atualização Remota`, `100% Nuvem`).
   * **Simulador de TV em Tempo Real (Studio CMS):** Renderização de comunicados, widgets RSS ao vivo, hora certa e clima tempo local.
   * **Vitrine Completa de Recursos:** Pareamento 6 dígitos, Agendamento Inteligente (Smart Scheduling), Widgets RSS/Clima, Instant Takeover de emergência, Print remoto da TV e Gestão Multi-lojas.
   * **Casos de Uso por Indústria:** Escritórios & Endomarketing, Varejo & Mídia Indoor, Lobbies & Recepções, Indústria & Dashboards.
   * **Seção de Planos 360Studio + Matriz Comparativa Detalhada:** Seletor Mensal / Anual (-20% desc), 4 Cards (*Start*, *Pro*, *Enterprise*, *Master Franchise*) e Tabela Comparativa de Recursos estilo ScreenCloud.
2. **Central de Tutoriais & Ajuda ([`help.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/help.html)):**
   * Guias passo a passo para instalação em Samsung Tizen, LG WebOS, Android TV, Fire TV e TV Box.
   * Manual de pareamento em 6 dígitos, montagem de playlists e solução de dúvidas técnicas.
3. **Área Privada Operacional do Assinante ([`app.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/app.html)):**
   * Sidebar 360Studio com 5 abas funcionais (*Minhas Telas*, *Playlists & Mídias*, *Minha Assinatura*, *Tutoriais & Ajuda*, *Meu Perfil*).
4. **Painel Administrativo & Gestão SaaS ([`admin.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/admin.html)):**
   * KPIs SaaS em tempo real (MRR, Total Clientes, Ativos, Trial, Expirados e Telas) e gestão de assinaturas via `api/admin.php`.
5. **Autenticação SaaS ([`login.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/login.html)):**
   * Login e Registro com ativação automática do **Trial Grátis de 7 Dias**.
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
* 🎬 **Player Produção:** [https://tvcorp.hubdigital360.com/player/](https://tvcorp.hubdigital360.com/player/)

---

## 🚀 4. Comandos de Deploy FTP Direto

- **Homologação:** `powershell.exe -ExecutionPolicy Bypass -File deploy-hml.ps1`
- **Produção:** `powershell.exe -ExecutionPolicy Bypass -File deploy-prod.ps1`
