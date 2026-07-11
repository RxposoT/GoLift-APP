export type GorilaState = 'idle' | 'greeting' | 'talking' | 'celebrating' | 'concerned' | 'challenging' | 'sleeping' | 'sad' | 'angry'

export interface GorilaAction {
  label: string
  primary?: boolean
  onPress: () => void
}

export interface GorilaMessage {
  estado: GorilaState
  texto: string
  acoes?: GorilaAction[]
  /** Usa escolhas empilhadas quando a conversa pede mais de duas respostas. */
  presentation?: 'actions' | 'choices'
  autoFechar?: number
  onShow?: () => void
  onDismiss?: () => void
}

export const GORILA_ANIMATIONS: Record<GorilaState, { scale: number; rotate: string; translateY: number }> = {
  idle:        { scale: 1,    rotate: '0deg',  translateY: 0 },
  greeting:    { scale: 1.05, rotate: '0deg',  translateY: -10 },
  talking:     { scale: 1,    rotate: '2deg',  translateY: 0 },
  celebrating: { scale: 1.1,  rotate: '-3deg', translateY: -15 },
  concerned:   { scale: 0.95, rotate: '5deg',  translateY: 5 },
  challenging: { scale: 1.08, rotate: '0deg',  translateY: -5 },
  sleeping:    { scale: 0.9,  rotate: '10deg', translateY: 10 },
  sad:         { scale: 0.94, rotate: '7deg',  translateY: 8 },
  angry:       { scale: 1.08, rotate: '-4deg', translateY: -4 },
}

export const FALLBACK_MESSAGES: Record<GorilaState, string[]> = {
  idle:        ['Pronto para o próximo treino?'],
  greeting:    ['Bom dia! Bora treinar?', 'Olá! Hoje vai ser um grande dia.', 'Pronto para mais um treino?'],
  talking:     ['Estou a analisar os teus dados...', 'Já vi o teu progresso desta semana.'],
  celebrating: ['Grande treino!', 'Mais um treino feito!', 'Bom trabalho! Continuas a evoluir.'],
  concerned:   ['Dormiste bem esta noite?', 'Os teus treinos estão mais leves esta semana. Está tudo bem?'],
  challenging: ['Vamos aumentar a carga hoje!', 'Estás pronto para mais um desafio?'],
  sleeping:    ['...'],
  sad:         ['Hoje pode custar mais. Vamos ajustar o plano.'],
  angry:       ['Isto não está a correr como devia. Vamos resolver.'],
}
