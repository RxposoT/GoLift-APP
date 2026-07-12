# Superprompt GoLift × DuoLingo — Redesign Completo (Stitch)

> Prompt para alimentar o Stitch (Google AI Design Tool) com o redesign total do frontend GoLift.

---

## 1. Identidade do Produto

**GoLift** é um companheiro de treino premium. A app acompanha treinos de ginásio, séries, repetições, peso, métricas de progresso, streaks, XP/níveis, comunidades sociais, e planos de treino gerados por IA.

**Público-alvo:** Entusiastas de fitness de língua portuguesa (PT-PT), uso diário, mobile-first. Usam a app no ginásio (condições de pouca luz) e em casa.

**Personalidade da marca:** "The Quiet Powerhouse" — Sleek · Modern · Premium. Inspirado no Apple Fitness+ mas orientado a dados. Direto, motivador, nunca gimmick. Recusa a estética "fitness bro" (neon, silhouettes, agressividade) e recusa o SaaS warm-neutral genérico.

**ADVERTÊNCIA AO STITCH:** Este redesign NÃO substitui a personalidade existente — evolui-a. O DuoLingo é referência de INTERAÇÃO e MOTIVAÇÃO, NÃO de estilo visual. O GoLift mantém-se premium, escuro, tipográfico, com azul como único acento. O que mudamos é o padrão de interação: de estático para reativo, de utilitário para encantador.

---

## 2. Inspiração DuoLingo — O Que Roubar (e o Que Ignorar)

### ✅ ROUBAR (Interaction Patterns)

| Padrão DuoLingo | Como Aplicar no GoLift |
|---|---|
| **Mascote reativo a tudo** | O Gorila reage a cada ação do utilizador — treino concluído (celebração), streak perdido (preocupado), novo recorde (festa), check-in matinal (saudação), dias sem treino (challenge). |
| **Sequências e streaks gamificados** | Streak visual com raios/fogos animados. XP a subir numericamente. Níveis com badges visíveis. "Dia 7 — continua!" |
| **Micro-feedback imediato** | Cada botão, cada série concluída, cada check-in tem feedback animado + háptico. Nada é silencioso. |
| **Progressão visível em todo o lado** | Barras de progresso, círculos, percentagens. Cada ecrã mostra "onde estás" na tua jornada. |
| **Linguagem divertida mas direta** | "Boa, esses bíceps não sabem o que os espera!" em vez de "Sessão de treino #42 concluída". |
| **Onboarding progressivo** | Funcionalidades desbloqueiam-se conforme o utilizador avança (não aparece tudo de repente). |
| **"Streak Freeze" / "Reviver"** | Mecânica de salvar o streak com moedas virtuais (ou como bónus Pro). |

### ❌ IGNORAR (Visual Style)

- NÃO usar paleta verde DuoLingo
- NÃO usar ilustrações planas coloridas estilo DuoLingo
- NÃO usar tipografia display/custom font
- NÃO usar卡通/mascote infantilizado — o Gorila é estilizado, premium, "quiet powerhouse"
- NÃO usar gamificação excessiva estilo brinquedo infantil

### 🔀 TRANSFORMAR (Adaptações)

- DuoLingo tem "lições" → GoLift tem "treinos"
- DuoLingo tem "lingots" → GoLift tem "XP"
- DuoLingo tem "crowns" → GoLift tem "badges" (bronze→prata→ouro→diamante)
- DuoLingo tem "hearts" → GoLift tem "streak" (não vidas, mas consistência)
- DuoLingo tem "leaderboard" → GoLift tem "comunidades" (já existe)

---

## 3. O Gorila — O Coração do Redesign

O Gorila é a mascote da app, com 7 estados emocionais animados. NO redesign, o Gorila passa de "funcionalidade extra" para "centro da experiência".

### Estados do Gorila

| Estado | Quando Aparece | Animação | Tom de Voz |
|---|---|---|---|
| `greeting` | Ao abrir a app / check-in matinal | Scale 1.05, levanta -10px, bounce suave | "Bom dia! Hoje vamos destruir?" |
| `idle` | Ecrã principal, à espera | Ligeiro breathing animation (scale 1↔1.02) | "Pronto para o próximo treino?" |
| `talking` | A dar dicas, explicar algo | Rotação 2deg, fala | "Sabias que... hoje é dia de pernas?" |
| `celebrating` | Treino concluído, recorde, streak里程碑 | Scale 1.1, -15px, festa (confetti?) | "GRANDE TREINO! Mais um nível!" |
| `concerned` | Streak em risco, treinos mais leves | Scale 0.95, inclinado 5deg | "Está tudo bem? Os treinos estão mais leves..." |
| `challenging` | Novo PR, proposta de aumento de carga | Scale 1.08, sobrancelha franzida | "Vamos aumentar 2.5kg hoje. Acredita em ti." |
| `sleeping` | App aberta de madrugada / sem atividade | Scale 0.9, 10deg, olhos fechados | "Zzz... Não são horas de treinar?" |

### Regras de Implementação do Gorila

1. **Aparece em ecrãs-chave:** Home, check-in, resumo de treino, perfil, e estratégicamente nos outros (canto inferior ou popup)
2. **Reage a ações do utilizador em tempo real:** Cada série concluída, cada treino salvo, cada check-in
3. **Nunca interfere com ação primária:** Posicionado num canto, expansível. Não bloqueia CTAs.
4. **Voz consistente:** Motivador direto, personal trainer amigável, sem gírias forçadas
5. **Animação suave:** Spring animations (damping 10-12), transições de 350ms, nunca agressivo
6. **Pode ser ignorado/dismissed:** Toque no Gorila fecha a mensagem. Não há mensagens obrigatórias.

---

## 4. Filosofia de Interação ("DuoLingofied")

### 4.1 Micro-interações em Tudo

| Elemento | Interação |
|---|---|
| Botão "Concluir série" | Check animado + haptic + Gorila diz "Mais uma!" |
| Check-in diário | Animação sequencial: sleep → energy → pain → Gorila celebra |
| Streak atualizado | Número sobe com animação de contador + Gorila celebra (se ≥3 dias) |
| Recorde batido | Confetti + ecrã fullscreen de celebração + badge animation |
| Nova comunidade | Entrada animada na lista + Gorila greeting |
| Peso atualizado | Gráfico animado + marcador de novo mínimo/máximo |
| Treino concluído | Fullscreen celebration (similar ao DuoLingo lesson complete) |

### 4.2 Padrão de Feedback em 3 Camadas

Cada ação do utilizador recebe:

1. **Haptic** (imediato — `expo-haptics`)
2. **Visual** (350ms — animação no elemento)
3. **Gorila** (opcional — reação contextual)

### 4.3 Gamificação (sem ser infantil)

| Sistema | Onde Aparece | Visual |
|---|---|---|
| **XP / Nível** | Home (destaque) + Profile | Barra de progresso horizontal com nível atual. Gorila celebra ao subir. |
| **Streak** | Home (topo) + Profile | 7 dias visíveis. Pill animados. Fogo/raio no streak ≥7. |
| **Badges** | Profile (grelha) + Home (destaque) | Ícones estilizados, raridade por cor. Efeito de desbloqueio. |
| **Recordes Pessoais** | Metrics (tab Recordes) + Home | Medalhas ouro/prata/bronze. Animação de subida no ranking. |
| **Treino do Dia** | Home | Card destacado com progresso de conclusão. "Treino de hoje: completo a 60%" |

### 4.4 Onboarding Progressivo (DuoLingo-style)

- Novo utilizador vê apenas Home + Workouts + Profile
- Communities e AI Plan desbloqueiam após N treinos concluídos
- Cada desbloqueio é acompanhado pelo Gorila: "Agora que já tens ritmo, que tal juntares-te a uma comunidade?"
- Funcionalidades bloqueadas aparecem com preview e "Disponível após 3 treinos"

---

## 5. Arquitetura de Ecrãs (Todas as Páginas)

> Nota: O Stitch deve gerar designs COMPLETOS para TODOS estes ecrãs. Cada um com estados de loading, vazio, erro, e sucesso.

### 5.1 Login (`/login`)
- **Atual:** Formulário simples, validation inline
- **Refactor:** Fundo com gradiente escuro (dark mode first). Gorila `idle` no topo. Inputs com glow no focus. Botão com loading animation (não só spinner — botão "respira"). "Entrar com Google" (opcional). Haptic em erro de validação.

### 5.2 Registo (`/register`) — 3 Passos
- **Refactor:** Wizard estilo DuoLingo. Steps visuais (bolinhas numeradas). Gorila `talking` em cada passo. Passo 1: Conta (email/password). Passo 2: Perfil (nome, idade). Passo 3: Objetivo (nível, equipamento, meta). Transições animadas entre passos. Botão "Seguinte" com loading. Check animado no final com Gorila `celebrating`.

### 5.3 Forgot Password (`/forgot-password`)
- **Refactor:** Minimalista. Gorila `concerned`. Input com validação. "Enviamos link para o teu email" com animação de carta/avião.

### 5.4 Home (`/(tabs)/`) ⭐ — Ecrã Principal
- **Layout Novo:**
  1. **Topo:** Streak + nível + XP (horizontal bar compacta). Gorila `greeting` ou `idle` no canto.
  2. **"Bom dia, Nome"** — saudação dinâmica (bom dia/boa tarde/boa noite) com base na hora.
  3. **Card "Treino de Hoje"** — Se existe treino planeado: progresso circular, nome, "Continuar" CTA. Se não: "Nenhum treino planeado — criar um?".
  4. **Check-in rápido** — Se ainda não fez hoje: Card com 3 sliders (sono, energia, dor). Após check-in: substituído por resumo.
  5. **Últimos Treinos** — Lista horizontal (scroll) com cards compactos: data, nome, duração, séries. Animação de fade-in em lista.
  6. **Treino Rápido** — FAB ou card "Iniciar treino vazio" — atalho para começar a treinar sem plano.
  7. **Gorila Widget** — Gorila no canto inferior direito. Tap expande mensagem contextual.
- **Loading state:** Skeleton personalizado com Gorila `idle` no centro.
- **Empty state (sem treinos):** Gorila `talking` "Vamos começar? Cria o teu primeiro treino!"

### 5.5 Workouts (`/(tabs)/workouts`)
- **Layout Novo:**
  - **Topo:** Search bar + filtros (grupo muscular, equipamento).
  - **"Os Teus Treinos"** — Lista vertical com cards expansíveis. Swipe para editar/eliminar.
  - **"Planos IA"** — Card destacado se utilizador tem Pro. "Plano de Junho — 75% completo".
  - **FAB** "+" para criar treino.
  - **Drag-to-reorder** exercícios (gesture handler).
- **Interações:** Pull-to-refresh com Gorila `talking` "A atualizar...". Long-press em card para menu de contexto.

### 5.6 Workout Ativo (`/workout/[id]`)
- **Refactor:** Modo "imersivo" — barra de estado escondida, fundo escuro. Timer grande no topo. Gorila no canto dá dicas durante descanso. Cada série é um card que "vira" ao completar. Inputs de peso/reps com + e -. Ao concluir tudo: ecrã de celebração com Gorila + confetti. Rest timer visual com anel circular.

### 5.7 Workout Summary (`/workout/summary`)
- **Refactor:** Card principal com nome, duração, data. Gráfico de barras de intensidade por exercício. Recordes batidos destacados. Gorila `celebrating` se foi bom treino, `talking` se normal. Botão "Partilhar" (comunidade/screenshot). Botão "Feedback IA" (se Pro).

### 5.8 Workout Feedback (`/workout/feedback`)
- **Refactor:** Chat UI com Gorila. Gorila pergunta "Como foi o treino?" e utilizador responde (voz/texto). IA gera feedback. Loading state com Gorila `talking` "A analisar o teu treino...". Resposta aparece com typewriter animation.

### 5.9 Metrics (`/(tabs)/metrics`)
- **Refactor:** 3 Tabs (Progresso, Calendário, Recordes) com animated tab bar.
  - **Progresso:** Meta semanal (barra circular), progresso de peso (gráfico linha), tendências (barras).
  - **Calendário:** Mês visual, dias com treino destacados (bolinhas), tap para ver treino desse dia (modal).
  - **Recordes:** Lista vertical, ranking 1º/2º/3º com medalhas animadas, grouped por exercício.
- **Gorila:** Aparece em cada tab — "Estás a 3 treinos de bater o teu recorde do mês!"

### 5.10 Profile (`/(tabs)/profile`)
- **Layout Novo (DuoLingo-profile inspired):**
  1. **Header:** Foto + nome + nível + streak (grande). Botão "Editar" com ícone.
  2. **Métrica rápida:** IMC, dias de treino este mês, recordes.
  3. **Badges:** Grelha 3-colunas com badges desbloqueados/bloqueados. Tap abre detalhe.
  4. **Notificações:** Toggle para lembretes diários, som, treino do dia.
  5. **Settings:** Lista de opções (Conta, Tema, Apoio, Sair).
  6. **Gorila:** Canto inferior, mensagem personalizada.

### 5.11 Comunidades (`/(tabs)/communities`)
- **Refactor:** 2 Tabs (As Minhas Comunidades, Descobrir). Cada comunidade é um card com foto, nome, membros, últimas mensagens. Swipe para sair. "Descobrir" tem search + categorias. Ao entrar: ecrã de chat com mensagens em bubbles, real-time.

### 5.12 Community Chat (`/community/[id]`)
- **Refactor:** Chat UI padrão (bubbles, input no fundo). Avatar dos membros. "A escrever..." indicator. Gorila NÃO aparece aqui (espaço social, não pessoal). Badge de membros online.

### 5.13 AI Plan (`/ai-plan`) — 6 Steps
- **Refactor:** Wizard progressivo estilo registo. Gorila guia cada passo. Step 1: Dias/semana. Step 2: Duração. Step 3: Foco. Step 4: Equipamento. Step 5: Revisão. Step 6: Gerar (com loading animation + Gorila "A criar o teu plano personalizado..."). Resultado: preview do plano com scroll vertical.

### 5.14 AI Report (`/ai-report`)
- **Refactor:** Card DIN A4 (simulado). Resumo semanal com gráficos. Gorila `talking` destaca pontos-chave. "Esta semana treinaste 4 dias — 20% mais que a anterior!"

### 5.15 Check-in (`/checkin`)
- **Refactor:** Experiência tipo "como te sentes hoje?". 3 ecrãs swipeáveis (Sono, Energia, Dor). Em cada um: Gorila pergunta, slider visual com emojis/ícones. Ao fim: Gorila `celebrating`. Se dor reportada: Gorila `concerned` "Vamos com calma hoje."

### 5.16 Settings/Account (`/settings`, `/account`, `/edit-profile`)
- **Settings:** Formulário limpo com sections. Toggles animados. Dark/light mode preview.
- **Account:** Gestão de conta, eliminar (com confirmação e Gorila `concerned`).
- **Edit Profile:** Inputs, foto, selects. Gorila `talking` "Atualiza o teu peso para melhores recomendações."

### 5.17 Upgrade (`/upgrade`)
- **Refactor:** Ecrã de vendas — cards comparativos (Free vs Pro). Gorila `challenging` "Imagina o que consegues com planos IA!" Botão "GoLift Pro — 9.99€/mês" com destaque. Benefit list com checkmarks animados.

### 5.18 User Profile (`/user/[id]`)
- **Refactor:** Perfil público: foto, nome, badges (públicos), streak, recordes. Sem Gorila. Ações: "Adicionar amigo", "Desafiar".

### 5.19 Exercise Progress (`/exercise-progress/[id]`)
- **Refactor:** Gráfico de linha (SVG) com progresso de peso/reps. Timeline de treinos onde fez este exercício. Recorde pessoal destacado. Gorila `challenging` "O teu recorde é 80kg — vamos bater hoje?"

### 5.20 `_layout.tsx` — Root Layout
- **Refactor:** Transições de ecrã animadas (slide horizontal). Splash screen com Gorila `idle` + loading. Stack navigator com gestos de swipe back.

### 5.21 `(tabs)/_layout.tsx` — Custom Tab Bar
- **Refactor:** Tab bar flutuante (já existe) com animações: ícone "salta" ao selecionar, badge de notificações, indicador de progresso no tab "Home". Haptic em cada troca de tab.

---

## 6. Temas Visuals (Manter do Design Atual)

### Cores
```js
// Dark Mode (primary canvas)
background: '#080808',        // Canvas principal — muito escuro
backgroundSecondary: '#1C1C1E', // Cards, superfícies elevadas
backgroundTertiary: '#2C2C2E',  // Inputs, campos

text: '#FFFFFF',
textSecondary: '#8E8E93',
textTertiary: '#48484A',

primary: '#0A84FF',  // Único acento azul (≤15% do ecrã)
accentGreen: '#30D158',
streakOrange: '#FF9F0A',
danger: '#FF3B30',

// Light Mode
background: '#F2F2F7',
backgroundSecondary: '#FFFFFF',
primary: '#005CE6',
// ... resto adaptado
```

### Tipografia
- System font apenas (SF Pro em iOS, Roboto em Android)
- 10 níveis: Display (52/800), Title1 (28/700), Title2 (22/700), Title3 (20/700), Headline (17/600), Body (15/400), Callout (16/400), Subhead (15/400), Footnote (13/400), Caption (11/700, uppercase)
- Tracking negativo em tamanhos ≥20px (display -2, title -0.5)
- Caption sempre uppercase +1 tracking

### Elevação
- Cards: `backgroundSecondary` (já diferenciado por cor) — flat, sem shadow
- Modais: elevation-3 (`0 4px 12px rgba(0,0,0,0.30)`)
- Botão primário: elevation-2 (`0 2px 4px rgba(0,0,0,0.10)`)
- Regra: flat-at-rest, shadow só para hierarquia

### Corner Radius
- Cards: 20px
- Botões: 10-14px
- Inputs: 10px
- Gorila container: 20px (se card) ou circular (se avatar)

---

## 7. Padrões de Animação

### Timing
| Animação | Duração | Easing |
|---|---|---|
| Entrance | 350ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Press | 100ms | spring (damping 10) |
| Gorila state change | 300ms | spring (damping 12) |
| List stagger | 50ms delay per item | — |
| Confetti/celebration | 800ms | spring |
| Skeleton shimmer | 800ms cycle | linear |
| Streak counter | 500ms count-up | — |

### Onde Animar
- **Entrance de ecrã:** Fade-in + translateY 20px (350ms)
- **Lista de treinos:** Stagger fade-in (50ms/item)
- **Check-in completo:** Escala + fade no card, Gorila celebra
- **Botão primário:** Scale 0.97 no press
- **Tab switch:** Ícone scale 1.15 → 1.0 + haptic
- **Streak update:** Número conta visualmente para cima
- **Badge unlock:** Brilho + scale animation

---

## 8. Estados de Cada Componente

Cada ecrã no Stitch deve ter:

| Estado | Descrição |
|---|---|
| **Loading** | Skeleton loader (per-screen, personalizado) + Gorila `idle` animado |
| **Empty** | Ilustração/ícone + "Nada aqui ainda" + CTA + Gorila `talking` |
| **Error** | "Algo correu mal" + botão "Tentar de novo" + Gorila `concerned` |
| **Success** | Dados visíveis + estado normal + Gorila contextual |
| **Offline** | Banner no topo "Estás offline" + dados em cache + Gorila `sleeping` |

---

## 9. Fluxo de Onboarding Progressivo (Detalhado)

```
Dia 1 (App instalada):
  → Ecrã de boas-vindas com Gorila
  → Registo (3 passos)
  → Home vazia com CTA "Criar primeiro treino"
  → Profile: streak não iniciado, sem badges

Dia 1 (após 1º treino):
  → Streak inicia (dia 1)
  → Badge "Primeiro Passo" desbloqueado
  → Gorila celebra
  → Tab Communities aparece

Dia 3:
  → Badge "Consistente" desbloqueado
  → AI Plan desbloqueado (após 3 treinos)
  → Gorila: "Já tens ritmo! Queres um plano feito para ti?"

Dia 7:
  → Streak 7 dias — animação especial
  → Badge "Uma Semana" (raro)
  → Feature "Desafiar Amigos" desbloqueado

Dia 30:
  → Badge "Dedicação" (épico)
  → Gorila celebra com confetti
```

---

## 10. Anexos Técnicos

### Ficheiros Atuais (Referência)

```
app/src/app/                           — 24 ecrãs no total
app/src/components/ui/                 — 12 componentes UI
app/src/components/gorila/             — Gorila mascote (context, dialog, animations)
app/src/contexts/AuthContext.tsx        — Autenticação
app/src/contexts/CommunitiesContext.tsx — Comunidades
app/src/styles/themes.ts               — Tema dark/light
app/src/styles/tokens.ts               — Design tokens (spacing, radius, shadow)
app/src/styles/colors.ts               — Cores semânticas (badges, IMC, streak)
app/src/hooks/useAnimations.ts         — useFadeIn, useBounceIn
app/src/hooks/useNetworkStatus.ts      — Online/offline
```

### Tecnologias
- React Native 0.81 + Expo 54
- Expo Router (file-based routing)
- NativeWind / TailwindCSS
- react-native-reanimated (animações)
- expo-haptics (feedback tátil)
- expo-linear-gradient (gradientes)
- expo-image (imagens)
- expo-notifications (push)

---

## 11. Instruções Finais ao Stitch

1. **Gera TODOS os ecrãs listados** — não omitas nenhum
2. **Cada ecrã com dark mode E light mode** (dark mode é o primário)
3. **Cada ecrã com estados:** loading, empty, error, success
4. **Mobile-first** — iOS e Android (375×812 até 414×896)
5. **Gorila presente em:** Login, Register, Home, Check-in, Workout Summary, AI Plan, AI Report, Metrics, Profile, Upgrade, Exercise Progress, Edit Profile, Workout Feedback
6. **Gorila AUSENTE em:** Community Chat, User Profile (outros utilizadores), Settings (normal)
7. **Tom de voz Gorila:** PT-PT, direto, motivador, personal trainer amigável
8. **Respeitar design tokens existentes:** não inventar novas cores, não adicionar fontes, não mudar corner radii
9. **Cada ecrã deve ter micro-interações descritas** — o que anima, o que faz haptic, como o Gorila reage
10. **Entregar como Design System + Screen Library** — não apenas mockups avulso

---

> **Prompt end.** O Stitch deve usar este documento como o brief completo de produto, interação, e visual para gerar o redesign total do GoLift.
