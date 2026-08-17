# Memória do Projeto: TvCorp — Plataforma SaaS de TV Corporativa

> **Status Atual:** 100% Operacional (Padrão HubDigital360)  
> **Última Atualização:** 17 de Agosto de 2026  
> **Squad:** A-Team (PO: Mario Henrique / Agent: Antigravity AI)

---

## 📌 1. Visão Geral & Arquitetura de Camadas (Padrão HubDigital360)

O **TvCorp** é um ecossistema SaaS completo para Gestão de Mídia Indoor, Mural Digital, Transmissão em Smart TVs/TV Boxes e Comunicação Interna Corporativa.

### Camadas de Páginas (HTML5 / Vanilla JS / CSS3 / PHP PDO):
1. **Landing Page Pública ([`index.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/index.html)):**
   * Padrão visual HubDigital360 com **Dark Glassmorphism Neon**.
   * **Simulador de Smart TV em Tempo Real:** Renderização ao vivo de comunicados, widgets de notícias RSS e clima tempo.
   * **4 Planos em Loop Scroll Infinito:** Esteira animada contínua com *Start* (R$ 39), *Pro* (R$ 89), *Enterprise* (R$ 199) e *Master Franchise* (R$ 399).
   * Accordion de FAQ interativo e Footer institucional completo.
2. **Central de Tutoriais & Ajuda ([`help.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/help.html)):**
   * Guias passo a passo para instalação em Samsung Tizen, LG WebOS, Android TV, Fire TV e TV Box.
   * Manual de pareamento em 6 dígitos, montagem de playlists e solução de dúvidas técnicas com suporte via WhatsApp.
3. **Área Privada Operacional do Assinante ([`app.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/app.html)):**
   * Sidebar 360 com 5 abas funcionais:
     - 🖥️ **Minhas Telas:** Pareamento em 6 dígitos, monitoramento online/offline, print remoto da TV.
     - 📋 **Playlists & Mídias:** Gestão de conteúdo e ordem de exibição.
     - 💳 **Minha Assinatura & Faturas:** Visualização do plano ativo, limite de telas, vencimento e checkout Mercado Pago.
     - ❓ **Tutoriais & Ajuda:** Central de ajuda integrada.
     - 👤 **Meu Perfil:** Cadastro e empresa.
4. **Painel Administrativo & Gestão SaaS ([`admin.html`](file:///g:/Meu%20Drive/Dev's/TvCorp/admin.html)):**
   * KPIs SaaS em tempo real (MRR, Total Clientes, Ativos, Trial, Expirados e Telas).
   * Tabela dinâmica de assinantes alimentada por `api/admin.php` com busca por texto, filtros por status e ações rápidas (Extender Trial +7d, Alterar Plano, Activar/Suspender).
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
