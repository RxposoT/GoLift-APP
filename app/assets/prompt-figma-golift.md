# 🦍 Mega Prompt Figma — GoLift App Design

---

## 1. VISÃO GERAL

**App:** GoLift — Personal Trainer de IA com mascote gorila
**Plataforma:** iOS (iPhone 15 Pro/16) primeiro, Android depois
**Público:** Portugueses 18-40 que vão ao ginásio sozinhos
**Tom:** Amigo próximo, humano, simples, motivador mas sem exageros
**Concorrência visual:** Duolingo (personalidade) + Hevy (limpeza) + Apple Fitness (fluidez)

---

## 2. DESIGN SYSTEM

### 2.1 Cores

```json
{
  "Light Mode": {
    "background": "#F2F2F7",
    "backgroundSecondary": "#FFFFFF",
    "backgroundTertiary": "#E5E5EA",
    "text": "#000000",
    "textSecondary": "#6C6C70",
    "textTertiary": "#AEAEB2",
    "primary": "#005CE6",
    "accentGreen": "#34C759",
    "accentOrange": "#FF9F0A",
    "accentRed": "#FF3B30",
    "border": "#E5E5EA",
    "gorilaBorder": "#005CE6"
  },
  "Dark Mode": {
    "background": "#080808",
    "backgroundSecondary": "#1C1C1E",
    "backgroundTertiary": "#2C2C2E",
    "text": "#FFFFFF",
    "textSecondary": "#8E8E93",
    "textTertiary": "#48484A",
    "primary": "#0A84FF",
    "accentGreen": "#30D158",
    "accentOrange": "#FF9F0A",
    "accentRed": "#FF453A",
    "border": "#2C2C2E",
    "gorilaBorder": "#0A84FF"
  }
}
```

### 2.2 Tipografia

- **Display:** 52px, 800 wght, -2 tracking (raramente usado)
- **Title1:** 32px, 800 wght, -1 tracking (ecrãs principais)
- **Title2:** 24px, 800 wght, -0.5 tracking
- **Title3:** 20px, 700 wght, -0.3 tracking
- **Headline:** 17px, 600 wght, -0.2 tracking
- **Body:** 15px, 400 wght
- **Callout:** 14px, 400
- **Subhead:** 13px, 500
- **Footnote:** 12px, 400
- **Caption:** 11px, 700, uppercase, 1 tracking

Font: Inter (system font fallback)

### 2.3 Componentes Base (criar no Figma como components)

#### Botões
- **Primário:** border-radius 14px, cor primary, texto branco, 15px semibold, padding vertical 14px
- **Secundário:** border-radius 14px, cor backgroundTertiary, texto text
- **Ícone:** 22px, Ionicons outline (arredondados, consistentes)

#### Cards
- border-radius 16px, backgroundSecondary, shadow suave
- padding 16-20px

#### Inputs
- border-radius 12px, border 1px solid border, background backgroundSecondary
- altura 44px, padding horizontal 16px

#### Bottom Sheet (Gorila Dialog)
- border-radius 28px (apenas topo), altura ~260px
- handle no topo: 36x4px, border-radius 2px, cor textTertiary
- **Gorila**: círculo 90x90px, posicionado a -45px do topo (metade dentro, metade fora), border 3px primary, overflow hidden

#### Tab Bar
- Altura ~85px (incluindo safe area)
- Itens: 5 (Home, Treinos, Métricas, Comunidades, Perfil)
- Ícone ativo com cor primary, inativo com textTertiary
- FAB (botão "+") ao centro para criar treino rápido
- BlurView no fundo (estilo iOS)

---

## 3. ECRÃS (Design em detalhe)

### 3.1 Home (primeiro ecrã após login)

**Layout:**
```
Status Bar (transparente)
┌─────────────────────────────┐
│                             │
│  🔥 5 dias  ●  Nível 7     │  ← Streak + nível (row)
│  ████████████░░░░ 450/800   │  ← XP bar (altura 6px, border-radius 3px)
│                             │
│  ┌───────────────────────┐  │
│  │ PRÓXIMO TREINO        │  │  ← Card principal
│  │ 💪 Push A              │  │
│  │ Hoje às 18:00          │  │
│  │ [▶ TREINAR]            │  │  ← Botão grande CTA
│  └───────────────────────┘  │
│                             │
│  Seg  Ter  Qua  Qui  Sex   │  ← Streak calendar (row)
│  [✅] [✅] [🔲] [✅] [🔲]  │  ← 38x38px quadrados, border-radius 12px
│                             │
│  "Cada treino é um passo.   │  ← Frase do gorila (italic, textSecondary)
│   Hoje é o teu dia."        │
│                             │
│  ──── ÚLTIMOS TREINOS ────  │  ← Section header
│  ┌───────────────────────┐  │
│  │ Ontem │ Supino 42kg 🆕│  │  ← Card small
│  └───────────────────────┘  │
│                             │
│                      [🦍]  │  ← Gorila mini (estático) no canto
│                             │
│  [Tab Bar: Home Treinos ...]│
└─────────────────────────────┘
```

**Estado vazio (primeira vez):**
- Em vez do card "Próximo treino", mostrar:
  - Ilustração do gorila a apontar para baixo
  - "Ainda não tens treinos! Vamos criar um?"
  - Botão [CRIAR PRIMEIRO TREINO]

**Micro-interações:**
- Streak calendar: quadrados preenchem com animação ao completar treino
- XP bar: anima com spring quando XP aumenta
- Card "Próximo treino": bounce sutil ao aparecer

---

### 3.2 Treinos (lista)

**Layout:**
```
┌─────────────────────────────┐
│  Treinos           [+ Novo] │  ← + Novo abre criação
│                             │
│  🔍 [Pesquisar treinos...]  │  ← Search bar
│                             │
│  ┌───────────────────────┐  │
│  │ 💪 Push A             │  │  ← Card de treino
│  │ 4 exercícios • 45 min  │  │
│  │ Último: ontem          │  │  ← Texto pequeno
│  │ ── ▸ ▸ ▸               │  │  ← Preview dos exercícios em row
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 🦵 Pull B             │  │
│  │ 5 exercícios • 50 min  │  │
│  │ Último: há 3 dias      │  │
│  │ ── ▸ ▸ ▸ ▸ ▸           │  │
│  └───────────────────────┘  │
│                             │
│  [Tab Bar]                  │
└─────────────────────────────┘
```

**Criar Treino (modal ou ecrã):**
- Se FREE: ecrã de criação manual (selecionar exercícios de lista)
- Se PREMIUM: diálogo com gorila → "Quantos dias? Que split?" → gorila gera plano → user aprova

**Design de seleção de exercícios:**
- Grid de cards com ícone do grupo muscular
- Cada card: nome + grupo muscular + ícone
- Search no topo + filtros
- Resultados com checkmark ao lado

---

### 3.3 Treino Ativo (ecrã mais importante)

**Layout:**
```
Status Bar (transparente, texto branco se dark)
┌─────────────────────────────┐
│  💪 Push A          ⏱ 23:45│  ← Header: nome + timer total
│                      ⌛ 1:30│  ← Rest timer (countdown)
│                             │
│  ┌───────────────────────┐  │
│  │ SUPINO RETO           │  │  ← Nome exercício (title3)
│  │ ████░░░░░░  3/4       │  │  ← Progresso (altura 4px)
│  │                       │  │
│  │  #  Peso    Reps   ✅  │  │  ← Header da tabela
│  │  1  40kg    12    ✅  │  │
│  │  2  40kg    10    ✅  │  │  ← Série completa (check verde)
│  │  3  40kg    11    ✅  │  │
│  │  4  [40]    [10]  ☐   │  │  ← Série atual (input ativo)
│  │                       │  │
│  │  Último treino:       │  │  ← Comparação
│  │  40kg x 10 reps       │  │
│  └───────────────────────┘  │
│                             │
│  ◀ Anterior     ▶ Próximo   │  ← Navegação de exercícios
│                             │
│  [⏹ TERMINAR TREINO]        │  ← Botão vermelho, borda arredondada
│                             │
└─────────────────────────────┘
```

**Design dos inputs de peso/reps:**
- Inputs grandes e tocáveis (não campos de texto pequenos)
- +/- buttons ao lado para ajuste rápido
- Ao completar última série do exercício: vibração + transição suave para próximo

**Timer de descanso:**
- Círculo com contagem decrescente
- Texto grande do tempo restante
- Animação de anel progresso
- Botão "SKIP" para saltar

**Estado sem exercícios registados:**
- Gorila no centro: "Pronto para começar? Vamos aquecer!"
- Botão grande [COMEÇAR TREINO]

---

### 3.4 Gorila Dialog (overlay global)

**Layout (sobre QUALQUER ecrã):**
```
┌─────────────────────────────┐
│                             │
│                             │
│                             │  ← Ecrã atual visível aqui
│                             │
│                             │
│         ┌──────┐            │
│         │  🦍  │            │  ← Gorila 90px, metade fora
│         └──────┘            │  ← Borda 3px primary
│  ───────┴──────── ═══ ──── │  ← Topo da sheet (border-radius 28)
│       ───   ───             │
│        (handle)             │
│  ┌───────────────────────┐  │
│  │ "Grande treino!       │  │  ← Balão de texto
│  │  3 dias de streak!"   │  │  ← backgroundTertiary
│  └───────────────────────┘  │
│                             │
│  [Ver progresso] [Fechar]   │  ← Botões de ação (row)
│                             │
└─────────────────────────────┘
```

**Estados visuais do gorila (ilustrações Lottie/Animated):**
- **idle:** Sentado, olhos piscam
- **greeting:** Espreguiça, sorri, olho aberto
- **talking:** Lábios mexem, gestos suaves
- **celebrating:** Dança, pula, feliz
- **concerned:** Cabeça inclinada, preocupado
- **challenging:** Postura forte, punho
- **sleeping:** A dormir, balão "zzz"

**Quando aparece (contextos):**
1. Ao abrir a app → greeting ("Bom dia! Bora treinar?")
2. Check-in sono baixo → concerned ("Só 5h de sono? Vou ajustar.")
3. Pós-treino → celebrating ("Grande treino! 3 dias de streak!")
4. Badge novo → celebrating ("Ganhaste o badge Consistente!")
5. Inatividade 3+ dias → concerned ("Senti a tua falta. Vamos hoje?")
6. Plateau detetado → talking ("O teu supino estagnou. Vamos mudar?")
7. Upgrade premium → greeting ("Bem-vindo ao premium!")

---

### 3.5 Métricas / Progresso

**Layout:**
```
┌─────────────────────────────┐
│  Progresso                  │
│                             │
│  🦍 "Esta semana: 4 treinos!│  ← Card de insight do gorila
│      70% mais que anterior" │  ← backgroundTertiary
│                             │
│  ┌───┬───┬───┬───┬───┬───┐  │
│  │   │ █ │ █ │   │ █ │ █ │  │  ← Calendar heatmap
│  │ S │ T │ Q │ Q │ S │ S │  │  (quadrados 40x40, rounded 8px)
│  └───┴───┴───┴───┴───┴───┘  │
│                             │
│  Esta sem.     Este mês     │  ← Stats cards row
│  ┌─────────┐ ┌─────────┐   │
│  │ 4 treinos│ │14 treinos│  │
│  │ ↑70%    │ │          │   │
│  └─────────┘ └─────────┘   │
│                             │
│  RECORDES PESSOAIS          │  ← Section
│  🏆 Supino      42kg 🆕    │  ← Card com ícone
│  🏆 Agachamento 60kg       │
│  🏆 Puxada      55kg       │
│                             │
│  ┌───┬───┬───┬───┬───┬───┐  │
│  │███│███│   │███│███│   │  │  ← Gráfico carga semanal
│  └───┴───┴───┴───┴───┴───┘  │  (barras largas, rounded 6px)
│                             │
│  [VER RELATÓRIO SEMANAL 🦍] │  ← Botão que abre gorila com insights
│                             │
└─────────────────────────────┘
```

---

### 3.6 Perfil

```
┌─────────────────────────────┐
│  Perfil                     │
│                             │
│  [🖼]  Nome do User         │  ← Avatar circular 80px + nome
│        Membro desde Jun 2026│
│                             │
│  🔥 5 dias     Nível 7      │  ← Streak + nível
│  ████████████░░  450/800 XP │  ← XP bar
│                             │
│  🏅🏅🏅🏅░░░░  4/8 badges   │  ← Badges row (circular 44px)
│                             │
│  ──── ESTATÍSTICAS ────     │
│  Total treinos     47       │
│  Volume total   152,450 kg  │
│  Tempo total   42h 30min    │
│                             │
│  [UPGRADE PARA PREMIUM 🦍]  │  ← Botão CTA (se free)
│  [⚙ Settings] [Ajuda] [Sair]│
│                             │
└─────────────────────────────┘
```

**Badges (ícones em círculo):**
- 🏅 PrimeiroTreino — tocha
- 🏅 Consistente — corrente (7 dias)
- 🏅 ForçaTotal — halteres (peso total 10.000kg)
- 🏅 Maratonista — ténis (50 treinos)
- 🏅 Comunitario — pessoas (entrar em comunidade)
- 🏅 Explorador — bússola (10 exercícios diferentes)
- 🏅 Veterano — escudo (nível 20)
- 🏅 Dedicado — coroa (treinar 2 dias seguidos no mesmo grupo)

---

### 3.7 Onboarding (3 passos)

**Passo 1 — Objetivo:**
```
┌─────────────────────────────┐
│                             │
│  🦍 "Vamos definir o teu   │
│      plano! Quantos dias    │
│      por semana?"           │
│                             │
│  [3️⃣]  [4️⃣]  [5️⃣]  [6️⃣]   │  ← 4 botões grandes, rounded 16px
│                             │
│  E qual o teu objetivo?     │
│  ┌───────────────────────┐  │
│  │ 💪 Ganhar massa       │  │  ← Opções com ícone
│  │ 🔥 Perder gordura     │  │
│  │ 🏋️ Força              │  │
│  │ 🧘 Saúde geral        │  │
│  └───────────────────────┘  │
│                             │
│  [CONTINUAR →]              │
└─────────────────────────────┘
```

**Passo 2 — Dados:**
```
┌─────────────────────────────┐
│  O teu corpo                │
│                             │
│  Peso   [72] kg   ▲▼        │  ← Picker vertical estilizado
│  Altura [175] cm  ▲▼        │
│                             │
│  Data nascimento  [15/05/99]│
│                             │
│  [CONTINUAR →]              │
└─────────────────────────────┘
```

**Passo 3 — Conta:**
```
┌─────────────────────────────┐
│  Criar conta                │
│                             │
│  [CONTINUAR COM APPLE]      │  ← Botões sociais (iOS)
│  [CONTINUAR COM GOOGLE]     │
│                             │
│  ──────── ou ────────       │
│                             │
│  [Email]                    │
│  [Password]                 │
│                             │
│  [CRIAR CONTA]              │
│                             │
│  Já tens conta? [Entrar]    │
└─────────────────────────────┘
```

---

### 3.8 Premium / Upgrade

```
┌─────────────────────────────┐
│  🦍 GoLift Premium         │
│                             │
│  O teu PT pessoal com IA    │
│                             │
│  ┌───────────────────────┐  │
│  │ ✅ Treinos adaptativos │  │  ← Feature list
│  │ ✅ Gorila personal     │  │
│  │ ✅ Apple Health sync   │  │
│  │ ✅ Progressive overload│  │
│  │ ✅ Relatórios semanais │  │
│  │ ✅ Planos mensais IA   │  │
│  └───────────────────────┘  │
│                             │
│  [ASSINAR — €7,99/mês]      │  ← Botão CTA grande
│  [Experimentar 7 dias grátis]│
│                             │
│  🔒 Apple Pay • Pagamento   │
│     seguro • Cancela quando │
│     quiseres                │
└─────────────────────────────┘
```

---

## 4. ANIMAÇÕES E MICRO-INTERAÇÕES

| Elemento | Animação | Tipo |
|----------|----------|------|
| Home → Treino | Slide up (modal fullscreen) | Transição |
| Completar série | Vibração + checkmark com bounce | Feedback |
| XP aumentar | Barra anima da esquerda para a direita | Spring |
| Badge ganho | Badge escala 0→1 com bounce + glow | Spring |
| Gorila aparece | Desliza de baixo + bounce do gorila | Spring |
| Gorila estado | Escala + rotação consoante estado | Spring |
| Streak calendar | Quadrado preenche com cor verde | Timing |
| Tab bar ícone | Ícone ativo escala ligeiramente | Spring |
| Pull-to-refresh | Skeleton shimmer nos cards | Timing |
| Transição ecrãs | Slide left/right (stack navigation) | iOS native |

---

## 5. TIPOS DE FICHEIROS NECESSÁRIOS

Para o programador implementar, preciso dos seguintes exports do Figma:

1. **Design System:**
   - Color tokens (light + dark)
   - Typography styles (10 níveis)
   - Spacing scale (4, 8, 12, 16, 20, 24, 28, 32)

2. **Assets:**
   - Gorila ilustrações: 7 estados (idle, greeting, talking, celebrating, concerned, challenging, sleeping)
     - Formato: Lottie JSON (After Effects + Bodymovin)
     - Viewbox: 200x200px
     - Fundo transparente
     - Apenas gorila da cintura para cima (para efeito de "espreitar")
   - Ícones de exercícios: 8 grupos musculares (Peito, Costas, Ombros, Bíceps, Tríceps, Pernas, Abdômen, Cardio)
   - Badge ícones: 8 badges
   - Splash screen
   - App icon (diferentes tamanhos)
   - Ilustração onboarding

3. **Componentes:**
   - Botão primário, secundário, ghost, ícone
   - Card de treino, card de exercício, card de métrica
   - Input, search bar, picker
   - Tab bar com FAB
   - Bottom sheet (gorila dialog)
   - Progress bar, circular timer
   - Skeleton loader (home, workouts, metrics, profile)

4. **Ecrãs (design completo light + dark):**
   - Home (com dados + vazio)
   - Treinos (lista + criação)
   - Treino Ativo (com timer + sets + descanso)
   - Métricas (com heatmap + records + gráfico)
   - Perfil (com badges + stats)
   - Onboarding (3 passos)
   - Login / Register
   - Upgrade Premium
   - Community list + chat
   - Settings

---

## 6. NOTAS DE DESIGN

- **Safe areas:** respeitar notch + dynamic island (topo) e home indicator (fundo)
- **One-handed use:** elementos principais no terço inferior, alcançáveis com o polegar
- **Dark mode priority:** 70% dos users de ginásio usam modo escuro (ginásios têm luz baixa)
- **Animações:** todas devem ser com `react-native-reanimated` (spring para consistência iOS)
- **Gestos:** swipe para voltar, swipe down para fechar modal, long-press em sets para editar
- **Haptics:** feedback tátil em: completar set, terminar treino, ganhar badge, mudar estado do gorila
- **Loading:** skeletons em vez de spinners em todo o lado
- **Empty states:** cada lista vazia tem uma ilustração + call-to-action
- **Font:** Inter como custom font, fallback system font se não carregar
