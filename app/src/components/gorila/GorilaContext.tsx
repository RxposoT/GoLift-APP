import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react'
import { GorilaMessage, GorilaState, FALLBACK_MESSAGES } from './gorilaAnimations'

interface QueueItem extends GorilaMessage {
  id: string
}

interface GorilaContextValue {
  message: QueueItem | null
  isVisible: boolean
  show: (msg: GorilaMessage) => void
  say: (texto: string, estado?: GorilaState) => void
  hide: () => void
  celebrar: (texto: string) => void
}

const GorilaContext = createContext<GorilaContextValue>({
  message: null,
  isVisible: false,
  show: () => {},
  say: () => {},
  hide: () => {},
  celebrar: () => {},
})

let idCounter = 0

export function GorilaProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<QueueItem | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsVisible(false)
    setMessage(null)
  }, [])

  const show = useCallback((msg: GorilaMessage) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const item: QueueItem = { ...msg, id: `gorila_${++idCounter}` }
    setMessage(item)
    setIsVisible(true)
    msg.onShow?.()

    if (msg.autoFechar && msg.autoFechar > 0) {
      timerRef.current = setTimeout(() => {
        hide()
        msg.onDismiss?.()
      }, msg.autoFechar)
    }
  }, [hide])

  const say = useCallback((texto: string, estado: GorilaState = 'talking') => {
    show({ estado, texto, autoFechar: 3000 })
  }, [show])

  const celebrar = useCallback((texto: string) => {
    show({ estado: 'celebrating', texto, autoFechar: 4000 })
  }, [show])

  return (
    <GorilaContext.Provider value={{ message, isVisible, show, say, hide, celebrar }}>
      {children}
    </GorilaContext.Provider>
  )
}

export function useGorila() {
  return useContext(GorilaContext)
}
