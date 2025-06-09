# #️⃣ Beto Amparo
## Universidade
Universidade Federal do Tocantins
## Curso
Ciência da Computação
## Disciplina
Projeto de Sistemas
## Semestre
1º semestre de 2025
## Professor
Edeílson Milhomem
<h2>Integrantes do Projeto</h2>
  <table>
    <tr>
      <td>Gabriel Martiliano</td>
    </tr>
    <tr>
      <td>Ester Arraiz de Matos</td>
    </tr>
    <tr>
      <td>Neci Oneides da Silva</td>
    </tr>
    <tr>
      <td>Heloisa Rolins Ribeiro</td>
    </tr>
    <tr>
      <td>Dallyla de Moraes Sousa</td>
    </tr>
  </table>

## 📊 Validação da Ideia

Para validar a necessidade do sistema Beto Amparo, realizamos uma pesquisa via Forms com pequenos empreendedores que utilizam o WhatsApp como canal de atendimento e vendas. Os principais resultados foram:

- 🔁 **64,3%** dos entrevistados já **perderam vendas** por conta da demora no atendimento.
- 🕒 **50%** levam de **5 a 30 minutos** para responder mensagens de clientes.
- ⚡ Apenas **35,7%** respondem **em menos de 5 minutos**.

Esses dados mostram uma demanda real por soluções que automatizem o primeiro contato com o cliente e agilizem pedidos e agendamentos, reforçando a relevância da proposta.

## 🧩 Canvas do Projeto Beto Amparo

| **Seção**                 | **Descrição** |
|---------------------------|--------------|
| **Proposta de Valor**     | Criar um sistema híbrido de atendimento humanizado que combina WhatsApp Business (para interação inicial) e uma plataforma web (para funcionalidades avançadas), permitindo atendimento, pedidos e agendamentos de forma prática e eficiente. |
| **Segmento de Clientes**  | Pequenos negócios e empreendedores que utilizam WhatsApp para vendas e atendimento. Clientes que desejam realizar pedidos e agendamentos sem necessidade de interação humana inicial. |
| **Canais**                | WhatsApp Business (mensagens automáticas com links para o site). Plataforma web responsiva (Next.js + Supabase). Progressive Web App (PWA) para acesso facilitado pelo celular. |
| **Relacionamento com Clientes** | Autoatendimento via WhatsApp e site. Dashboard para acompanhamento de pedidos. Notificações automáticas para manter o cliente informado. |
| **Atividades-Chave**      | Desenvolvimento da plataforma web (Next.js + Supabase). Integração com WhatsApp Business. Implementação do sistema de pedidos e agendamentos. Criação de um dashboard para gerenciamento dos pedidos. Implementação de PWA para donos de negócio. |
| **Recursos Principais**   | Plataforma web com sistema de pedidos e agendamentos. Banco de dados no Supabase para armazenar pedidos e clientes. WhatsApp Business API para envio de mensagens automáticas. Infraestrutura de hospedagem na Vercel. |
| **Parcerias Principais**  | Instituições como SEBRAE para captação de clientes. Donos de pequenos negócios que desejam digitalizar seus atendimentos. |
| **Estrutura de Custos**   | Hospedagem na Vercel (plano gratuito ou pago dependendo da demanda). Uso do Supabase (plano gratuito inicialmente, podendo escalar conforme necessário). Eventual aquisição de domínio personalizado. Investimento em marketing para atrair usuários. |
| **Fontes de Receita**     | Modelo de assinatura paga com três planos: **Básico** (plano mais acessível, funcionalidades essenciais). **Intermediário** (mais funcionalidades que o básico, como personalização básica e relatórios simples). **Avançado** (acesso completo, incluindo automação avançada e relatórios detalhados). Taxa sobre pedidos gerados pela plataforma. Publicidade ou parcerias estratégicas. |

## 💰 Precificação

A monetização da plataforma será feita por meio de um **modelo de assinatura mensal**, dividido em três planos com diferentes funcionalidades.

Todos os planos contam com **7 dias gratuitos** para experimentação, sem compromisso.

### Planos e Valores

| Plano            | Recursos Inclusos                                                                 | Preço Estimado (R$) |
|------------------|------------------------------------------------------------------------------------|----------------------|
| **Básico**       | Página de pedidos e agendamentos, dashboard simples, mensagens automáticas         | R$ 29,90 / mês       |
| **Intermediário**| Tudo do Básico + personalização visual + relatórios simples                        | R$ 49,90 / mês       |
| **Avançado**     | Tudo do Intermediário + relatórios avançados, filtros, integrações adicionais      | R$ 69,90 / mês       |

> 📌 **Observações:**
> - Todos os planos incluem **7 dias grátis** para teste.
> - Os preços são estimativas iniciais e poderão ser ajustados com base no feedback dos usuários após os testes com o MVP.
  
## 🛠️ Escopo do Projeto Beto Amparo</h1>
### Objetivo: Criar um sistema híbrido de atendimento humanizado que combina WhatsApp Business (para interação inicial) + plataforma web (para funcionalidades avançadas), atendimento, pedidos e agendamentos.
## 🧪 Beto Amparo - MVP e User Stories

## Funcionalidades Principais
**Site Externo** (Next.js + Supabase)  
**Formulário de pedidos e agendamentos**  
**Dashboard** para o dono do negócio visualizar demandas  
**Integração Indireta com WhatsApp**  
**Mensagens automáticas** (via WhatsApp Business App) com links para o site  
**PWA (Progressive Web App)**  
**Opção de instalação** no celular do dono do negócio  
## MVP (Mínimo Produto Viável)

| **Funcionalidade**      | **Descrição** |
|-------------------------|--------------|
| **Site de Pedidos**     | Página com formulário simples (produto, quantidade, contato). |
| **Dashboard Básico**    | Lista de pedidos recebidos (Supabase). |
| **Links no WhatsApp**   | Mensagem automática com link para o site (ex.: "Peça aqui: [link]"). |
| **PWA Opcional**        | Instalação do site como app (para donos de negócio). |
## Detalhamento das User Stories

### 1. Cliente
| **ID**  | **User Story** |
|---------|--------------|
| **US-01** | Como cliente, quero acessar um link no WhatsApp para fazer pedidos sem falar com um humano. |
| **US-02** | Como cliente, quero agendar horários via site sem precisar ligar. |

### 2. Dono do Negócio
| **ID**  | **User Story** |
|---------|--------------|
| **US-03** | Como dono, quero receber pedidos em um dashboard para organizar demandas. |
| **US-04** | Como dono, quero configurar mensagens automáticas no WhatsApp com links para o site. |

### 3. Admin
| **ID**  | **User Story** |
|---------|--------------|
| **US-05** | Como admin, quero que o site funcione offline (PWA) para donos sem internet estável. |
## Iteração 1: Site Básico + Supabase

| **Dev** | **Tarefa** | **Dependência** |
|--------|-----------|---------------|
| **Dallyla** | Criar frontend de Adicionar Produto e um pouco do backend | - |
| **Heloisa Rolins** | Configurar Supabase (tabelas pedidos, clientes) + front e banck de cadastrar empresa + front de login| - |
| **Gabriel Martiliano** | Integrar formulário com Supabase | D1, D2 |
| **Ester Arraiz** | Deploy na Vercel + configurar HTTPS | D1 |
| **Neci Silva** | Criar páginas: logout + listar produtos | D1 |
| **Todos** | Testes manuais e ajustes | Todos |

### **Entregável**  
✅ Site no ar com formulário e dashboard funcional.

## Iteração 2: Experiência do Cliente

| Dev | Tarefa | Descrição | Dependência | Feito |
|-----|--------|-----------|-------------|-------|
|  **Ester Arraiz**   | Criar página home do cliente (Next.js) | Desenvolver a home do cliente (`fotos/Home%20Sem%20Login.png`) com nome fantasia da loja (de `business_settings`), lista de produtos (miniaturas ou nomes) e botão "Fazer Pedido". Otimizar para mobile. | Adicionar Produto, Supabase (Iteração 1) | Sim |
| **Neci Silva** | Criar formulário de pedido e integração com o backend | Implementar formulário de pedidos (`fotos/Formulário%20de%20pedido.png`) com campos: produto (dropdown de `products`), quantidade, nome, telefone. Salvar em `orders`. Suportar pré-seleção via URL (ex.: `?productId=123`). Validar campos. | Adicionar Produto, Supabase | Sim |
|**gabriel martiliano**     | Desenvolver página de produto individual + seção de avaliação | Criar página de produto (`fotos/7%20-%20A%20-%20Advertising%20Banner.png`) com nome, preço, descrição, imagem e botão "Adicionar ao Pedido". Adicionar seção de avaliações (1-5 estrelas, comentário opcional), salvando em `reviews`. | Adicionar Produto, Supabase | Sim |
| **Heloisa Rolins**    | Implementar carrinho de compras | Criar funcionalidade de carrinho (`fotos/card.png`, `resumo.png`) para adicionar múltiplos produtos (usar estado ou localStorage). Mostrar resumo antes de enviar ao formulário de pedido. Salvar como JSON em `orders.products`. | Adicionar Produto, Supabase | Sim |
|**Dallyla**     | Personalização da loja | Desenvolver página para donos personalizarem a loja (`fotos/Cadastro%20empresa.png`) com campo para nome fantasia, atalho para adicionar produtos (link ou lista de produtos) e geração de link personalizado (ex.: `seusite.com/loja/nome-da-loja`). Salvar em `business_settings`. Exibir nome fantasia na home do cliente. | Supabase, Adicionar Produto | Sim |
|     | Testes manuais e ajustes | Simular fluxo: cliente acessa home via link personalizado, vê produtos, visualiza produto individual, adiciona avaliação, usa carrinho e faz pedido. Testar responsividade, erros e exibição do nome fantasia. | Todas | Sim |

## Entregável
✅ Home do cliente, formulário de pedido, página de produto individual com seção de avaliação, carrinho de compras e personalização da loja.

## Iteração 3: Dashboard e Melhorias no Fluxo

| Dev | Tarefa | Descrição | Dependência | Feito |
|-----|--------|-----------|-------------|-------|
|  **Dallyla**   | Criar Meus produtos do dono | Criar meus produtos dono, funcionalidades para editar produto, adicionar produto, inativar e ativar produto. | Formulário de Pedido, Supabase, Login/Signup (Iteração 2, 1) | Sim |
|   **Ester Arraiz**    | Criar área do dono | Criar hub de navegação (`fotos/Área%20do%20dono.svg`) com links para dashboard, adicionar produtos, personalização da loja, e notificações. Usar menu lateral ou superior, com Tailwind CSS, responsivo. Proteger com Supabase Auth. Centraliza funcionalidades do dono, destacando notificações. | Personalização da Loja, Adicionar Produto, Login/Signup (Iteração 2, 1) | Sim |
|  **Heloisa**     | Desenvolver página de confirmação de pedido | Criar página pós-pedido (`fotos/resumo.png`) com resumo (produtos, quantidade, valor), status (“Pedido recebido”), e instruções (“Entraremos em contato”). Redirecionar do formulário de pedido após salvar em `orders`. Integrar com carrinho. Estilizar com Tailwind CSS. Aumenta confiança do cliente. | Formulário de Pedido, Carrinho (Iteração 2) | Sim |
|  **Gabriel**   | Implementar notificações na área do dono | Adicionar notificações na área do dono (`fotos/Área%20do%20dono.svg`) para novos pedidos e mudanças de status do dashboard (ex.: “Pedido #123 em preparação”). Consultar `orders` via Supabase. Mostrar badge no menu (ex.: “3” pendentes) e permitir marcar como lidas. Usar localStorage para futura PWA. Estilizar com Tailwind CSS. Mantém donos informados. | Formulário de Pedido, Área do Dono, Dashboard, Supabase (Iteração 2, 3) | Não |
|  **Neci**   | Implementar finalizar pedido | Adicionar funcionalidade no dashboard para donos confirmarem status “enviado”. Incluir modal (acionado por botão na tabela) para atualizar `orders` e adicionar rastreio ou nota de entrega. Estilizar com Tailwind CSS, integrar com Supabase. Gera notificação na área do dono. Completa o ciclo de pedidos. | Formulário de Pedido, Dashboard, Área do Dono, Supabase (Iteração 2, 3) | Não |
|     | Testes manuais e ajustes | Simular fluxo: cliente envia pedido, vê confirmação; dono acessa área do dono, vê notificações, altera status no dashboard, finaliza pedidos. Testar responsividade, notificações, status, e erros (ex.: status inválido). Corrigir bugs e ajustar UI. Garante integração e qualidade do MVP. | Todas | Não |

# Iteração 4: Melhorias no Dashboard, Controle de Estoque e Suporte ao Cliente

| Dev | Tarefa | Descrição | Dependência | Feito |
|-----|--------|-----------|-------------|-------|
| **Dallyla**    | Melhorar dashboard do dono | Aprimorar dashboard (`fotos/Dashboard%20do%20dono.svg`) para incluir histórico de vendas (lista detalhada de pedidos passados com ID, cliente, produtos, valor, data), gráficos de vendas (ex.: Chart.js para vendas por semana), relatórios (ex.: total por período) e Controle de Estoque (visualizar/gerenciar inventário, ajustar quantidades, adicionar/remover itens). Manter tabela de pedidos com status (pendente, em preparação, enviado, concluído, cancelado). Consultar `orders` e `products` (para estoque) no Supabase, filtrar por `business_id`. Estilizar com Tailwind CSS, responsivo. | Dashboard do Dono, Supabase, Login/Signup (Iteração 3, 1) | Não |
|  **Heloisa**   | Adicionar recuperação de senha e edição de personalização | Implementar recuperação de senha (`fotos/recuperacao_de_senha.png`) com formulário de e-mail e link de redefinição via Supabase Auth, e edição de personalização da loja (nome fantasia, logo, link personalizável) em uma seção na sidebar do OwnerSidebar (`fotos/Área%20do%20dono.svg`). Salvar em `business_settings`. Estilizar com Tailwind CSS, responsivo. | Login/Signup, Personalização da Loja, Área do Dono, Supabase (Iteração 3, 2, 1) | Não |
| **Gabriel**   | Criar sistema de agendamentos | Desenvolver formulário de agendamento (`fotos/Agendamentos.png`) para clientes reservarem horários (ex.: data, hora, serviço). Salvar em tabela `appointments` no Supabase. Integrar ao dashboard para gestão (ex.: confirmar/cancelar). Estilizar com Tailwind CSS, responsivo. Atende US-17. | Supabase, Dashboard do Dono (Iteração 3, 1) | Não |
| **Neci**    | Suporte a múltiplas lojas | Adicionar suporte para gerenciar várias lojas por empresa na sidebar do OwnerSidebar (`fotos/Área%20do%20dono.svg`). Incluir dropdown para alternar entre `business_id`. Permitir que empresas recomendem outras lojas suas nos links das lojas (ex.: `seusite.com/loja/nome`), exibindo-as como sugestões para clientes na página da loja. Atualizar consultas Supabase para filtrar por `business_id` selecionado e listar lojas do mesmo `user_id`. Estilizar com Tailwind CSS. | Área do Dono, Supabase, Autenticação, Personalização da Loja (Iteração 3, 2, 1) | Não |
|   **Ester Arraiz**    | Implementar suporte ao cliente | Criar funcionalidade de suporte ao cliente, permitindo que clientes solicitem o cancelamento de pedidos (status “pendente” ou “em preparação”) via interface na Home do Cliente (`fotos/Home%20Sem%20Login.png`). Salvar solicitações em `order_cancellations` no Supabase. Integrar ao dashboard para donos aprovarem/rejeitarem. Estilizar com Tailwind CSS, responsivo. Melhora experiência do cliente. | Home do Cliente, Dashboard do Dono, Supabase, Formulário de Pedido (Iteração 3, 2, 1) | Não |
|     | Testes manuais e ajustes | Simular fluxos: cliente faz agendamento, solicita cancelamento, dono vê histórico/gráficos no dashboard, alterna lojas, vê recomendações, edita personalização, recupera senha, gerencia estoque. Testar responsividade, validações, e erros. Corrigir bugs e ajustar UI. Garante qualidade. | Todas | Não |

# Iteração 5: Features Adicionais com Suporte a PWA

| Dev | Tarefa | Descrição | Dependência | Feito |
|-----|--------|-----------|-------------|-------|
|     | Implementar Gamificação: Missões de Vendas e Configurações Avançadas do Dashboard|Modo “Fechado para Pedidos" e Adicionar sistema de missões no dashboard do dono (`fotos/Dashboard%20do%20dono.svg`), onde ele ganha emblemas ou níveis ao completar tarefas (ex.: “Primeira Venda do Dia”, “10 Agendamentos Confirmados”). Criar tabela `achievements` no Supabase. Exibir missões em cards (Tailwind CSS: `bg-green-100 p-4`). Cachear progresso offline via PWA (`next-pwa`, `localStorage`) para acesso no dashboard. Notificar via badge na sidebar do OwnerSidebar (`fotos/Área%20do%20dono.svg`). | Dashboard, Supabase, Notificações (Iteração 4, 3) | Não |
|     | Personalização com Temas de Loja Divertidos | Permitir que donos escolham temas visuais temáticos (ex.: “Festa Junina”, “Natal”, “Geek”) para suas lojas, com cores, fontes, e ícones, salvos em `business_settings` no Supabase. Adicionar seletor na sidebar do OwnerSidebar (`fotos/Área%20do%20dono.svg`). Cachear temas offline via PWA for página da loja (`seusite.com/loja/nome`) e Home do Cliente (`fotos/Home%20Sem%20Login.png`). Estilizar com Tailwind CSS. | Personalização, Supabase (Iteração 2) | Não |
|     | Implementar Analytics Simples para Donos | Criar painel de métricas no dashboard (`fotos/Dashboard%20do%20dono.svg`) com insights (ex.: “Top 5 produtos vendidos”, “Taxa de cancelamento”, “Vendas por dia”) usando Chart.js. Consultar `orders` e `order_cancellations` no Supabase. Cachear métricas offline via PWA para acesso no dashboard. Estilizar com Tailwind CSS. | Dashboard, Supabase (Iteração 4) | Não |
| **Heloisa**    | Implementar Programa de Fidelidade para Clientes | Criar sistema de pontos para clientes frequentes (ex.: “A cada 5 pedidos, 10% de desconto”), com tabela `loyalty` no Supabase. Exibir pontos na Home do Cliente (`fotos/Home%20Sem%20Login.png`) e aplicar descontos no formulário de pedido. Cachear pontos offline via PWA para Home do Cliente. Estilizar com Tailwind CSS. | Pedidos, Supabase (Iteração 2) | Não |
|     | Implementar Recomendações e Você pode gostar desse produto na Loja do Cliente |Desenvolver sistema de recomendação de produtos na página da loja do cliente (/loja/nome). Exibir seção com produtos similares ou populares com base em compras anteriores, categorias mais acessadas e produtos mais vendidos, usando dados da tabela orders no Supabase. Exibir sugestão como “Você pode gostar” com cards estilizados em Tailwind CSS (rounded-xl, shadow, hover:scale-105). Otimizar para dispositivos móveis. Cachear sugestões via PWA para acesso offline. | Pedidos, Supabase (Iteração 2) | Não |
|     | Testes Manuais e Ajustes | Simular fluxos: dono completa missões, aplica temas, vê métricas; cliente acumula pontos. Testar PWA offline (dashboard, loja, Home do Cliente), responsividade, e erros. Corrigir bugs e ajustar UI. Garante qualidade. | Todas | Não |

# Implementação de PWA por Página

| Dev | Tarefa | Descrição | Dependência | Feito |
|-----|--------|-----------|-------------|-------|
| Dallyla | Implementar PWA para Adicionar Produto, Personalização, Meus Produtos, e Dashboard | Configurar PWA (`next-pwa`, `manifest.json`, service worker) para `/produtos/adicionar`, `/dono/personalizacao`, `/dono/meus-produtos`, e `/dashboard` (com estoque, gráficos). Cachear `products`, `business_settings`, e `orders` em `localStorage` para acesso offline. Otimizar para mobile (Tailwind CSS: `sm:flex`). Garante experiência app-like com instalação. | Adicionar Produto, Personalização, Meus Produtos, Dashboard (Iteração 4, 3, 2, 1) | Não |
| Heloísa | Implementar PWA para Cadastro de Empresa, Login, Carrinho, Confirmação de Pedido, Recuperação de Senha | Configurar PWA para `/cadastro-empresa`, `/login`, `/carrinho`, `/pedido/[id]/resumo`, e `/recuperar-senha`. Cachear `business_settings`, `orders`, e formulários em `localStorage` para acesso offline. Otimizar para mobile (Tailwind CSS). Suporta login e pedidos offline, com sincronização ao reconectar. | Cadastro de Empresa, Login, Carrinho, Confirmação de Pedido, Recuperação de Senha (Iteração 4, 3, 2, 1) | Não |
| Gabriel | Implementar PWA para Produto Individual, Notificações, e Agendamentos | Configurar PWA para `/produto/[id]`, `/dono` (notificações), e `/agendamentos`. Cachear `products`, `reviews`, `notifications`, e `appointments` em `localStorage` para acesso offline. Otimizar para mobile (Tailwind CSS). Permite ver produtos e agendamentos offline. | Produto Individual, Notificações, Agendamentos (Iteração 4, 3, 2) | Não |
| Ester | Implementar PWA para Home do Cliente e Área do Dono | Configurar PWA para `/` (Home do Cliente) e `/dono` (Área do Dono). Cachear `business_settings`, `products`, `orders`, e `notifications` em `localStorage` para acesso offline, incluindo cancelamentos. Otimizar para mobile (Tailwind CSS). Garante navegação offline na loja e área do dono. | Home do Cliente, Área do Dono, Suporte ao Cliente (Iteração 4, 3, 2) | Não |
| Neci | Implementar PWA para Listar Produtos, Logout, Formulário de Pedido, e Múltiplas Lojas | Configurar PWA para `/produtos`, `/logout`, `/pedido`, e `/loja/[custom_url]` (recomendações). Cachear `products`, `orders`, e `business_settings` em `localStorage` para acesso offline. Otimizar para mobile (Tailwind CSS). Suporta listagem e pedidos offline. | Listar Produtos, Logout, Formulário de Pedido, Múltiplas Lojas (Iteração 4, 3, 2, 1) | Não |
|     | Testes Manuais e Ajustes | Simular fluxos offline: acessar dashboard, Home, produtos, agendamentos, carrinho, personalização, e pedidos. Testar instalação como app, responsividade, e sincronização ao reconectar. Corrigir bugs e ajustar UI. Garante qualidade do PWA. | Todas | Não |

## Detalhes das Tarefas

### 1. Implementar PWA para Adicionar Produto, Personalização, Meus Produtos, e Dashboard (Dallyla)
- **Descrição**: Transformar `/produtos/adicionar`, `/dono/personalizacao`, `/dono/meus-produtos`, e `/dashboard` em um app mobile com PWA, permitindo acesso offline.
- **Implementação**:
  - Configurar `next-pwa` em `next.config.js`:
    ```javascript
    const withPWA = require('next-pwa');
    module.exports = withPWA({
      pwa: { dest: 'public', register: true, skipWaiting: true },
    });
    ```
  - Cachear `products`, `business_settings`, `orders` com service worker (`workbox.strategies.StaleWhileRevalidate`).
  - Otimizar UI para mobile (Tailwind: `sm:flex`, `max-w-screen-sm`).
- **Esforço**: Médio (1-2 semanas).
- **Impacto**: Garante gestão offline para donos.

### 2. Implementar PWA para Cadastro de Empresa, Login, Carrinho, Confirmação de Pedido, Recuperação de Senha (Heloísa)
- **Descrição**: Transformar `/cadastro-empresa`, `/login`, `/carrinho`, `/pedido/[id]/resumo`, e `/recuperar-senha` em um app mobile com PWA.
- **Implementação**:
  - Cachear formulários e `business_settings` em `localStorage`.
  - Sincronizar pedidos offline ao reconectar.
  - Otimizar para mobile (Tailwind: `flex-col sm:flex-row`).
- **Esforço**: Médio-alto (2 semanas).
- **Impacto**: Melhora acessibilidade para novos usuários e clientes.

### 3. Implementar PWA para Produto Individual, Notificações, e Agendamentos (Gabriel)
- **Descrição**: Transformar `/produto/[id]`, `/dono` (notificações), e `/agendamentos` em um app mobile com PWA.
- **Implementação**:
  - Cachear `products`, `reviews`, `notifications`, `appointments`.
  - Otimizar para mobile (Tailwind: `w-full sm:w-1/2`).
- **Esforço**: Médio (1-2 semanas).
- **Impacto**: Permite acesso offline a produtos e agendamentos.

### 4. Implementar PWA para Home do Cliente e Área do Dono (Ester)
- **Descrição**: Transformar `/` e `/dono` em um app mobile com PWA.
- **Implementação**:
  - Cachear `business_settings`, `products`, `orders`, `notifications`.
  - Otimizar para mobile (Tailwind: `grid grid-cols-1 sm:grid-cols-2`).
- **Esforço**: Médio (1-2 semanas).
- **Impacto**: Garante navegação offline na loja e área do dono.

### 5. Implementar PWA para Listar Produtos, Logout, Formulário de Pedido, e Múltiplas Lojas (Neci)
- **Descrição**: Transformar `/produtos`, `/logout`, `/pedido`, e `/loja/[custom_url]` em um app mobile com PWA.
- **Implementação**:
  - Cachear `products`, `orders`, `business_settings`.
  - Otimizar para mobile (Tailwind: `flex flex-col sm:flex-row`).
- **Esforço**: Médio (1-2 semanas).
- **Impacto**: Suporta compras e gestão de lojas offline.

### 6. Testes Manuais e Ajustes
- **Descrição**: Validar PWA offline, responsividade, instalação como app, e sincronização.
- **Implementação**: Testar fluxos offline; corrigir bugs.
- **Esforço**: Médio (1 semana).
- **Impacto**: Garante qualidade do PWA.


## Home 
![Home sem login](fotos/Home%20Sem%20Login.png)
![Home logado](fotos/Home%20Logado.png)

## Login
![Login](https://github.com/user-attachments/assets/e170a99a-4259-4b74-8439-30b79ab8a8fc)

## Logout
![Logout](fotos/Logout.png)

## Recuperação de senha
![Recuperação de Senha](fotos/recuperacao_de_senha.png)

## Cadastro de empresa
![Cadastro empresa](https://github.com/user-attachments/assets/891fe8e3-5f94-4726-8479-863a71991837)

## Planos
![Planos](fotos/Planos.png)

## Dashboard do dono
![Texto alternativo](fotos/Dashboard%20do%20dono.svg)

## Área do dono
![Texto alternativo](fotos/Área%20do%20dono.svg)
![Texto alternativo](fotos/Área%20do%20dono%20(1).svg)

## Adicionar produto
![Texto alternativo](fotos/Adicionar%20produto.svg)

## Agendamentos
![Texto alternativo](fotos/Agendamentos%20(4).svg)
![Texto alterantivo](fotos/Agendamentos%20(1).svg)
![Texto alternativo](fotos/Agendamentos.png)

## Configurações de Respostas

![Respostas Automáticas](fotos/Respostas%20automáticas.png)

## Formulário de pedido
![Formulário de pedido](https://github.com/user-attachments/assets/57a78691-255d-4083-af70-0d805a1b9975)

## Pedidos recentes
![Texto alternativo](fotos/Pedidos%20recentes.png)

## Carrinho
![card](fotos/card.png)
![resumo](fotos/resumo.png)
![ordem](fotos/ordem.png)
![erro](fotos/ordem%20Erro.png)

## Produto individual
![individual](fotos/7%20-%20A%20-%20Advertising%20Banner.png)

## Cliente
![cliente](fotos/Cliente.png)
