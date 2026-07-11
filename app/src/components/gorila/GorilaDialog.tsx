import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useGorila } from './GorilaContext'
import { useTheme } from '../../contexts/ThemeContext'
import { GORILA_ANIMATIONS } from './gorilaAnimations'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const GORILA_SIZE = 120
const GORILA_PEEK = 100
const GORILA_DENTRO = GORILA_SIZE - GORILA_PEEK

export default function GorilaDialog() {
  const { message, isVisible, hide } = useGorila()
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const [contentHeight, setContentHeight] = useState(200)

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const gorilaBounce = useRef(new Animated.Value(0)).current

  const prevId = useRef<string | null>(null)
  const isClosing = useRef(false)

  useEffect(() => {
    if (isVisible && message) {
      isClosing.current = false
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 100, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()

      if (message.id !== prevId.current) {
        prevId.current = message.id
        Animated.sequence([
          Animated.timing(gorilaBounce, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.spring(gorilaBounce, { toValue: 0, damping: 8, stiffness: 80, useNativeDriver: true }),
        ]).start()
      }
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start()
    }
  }, [isVisible, message?.id])

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0 && !isClosing.current) slideAnim.setValue(g.dy)
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100 || g.vy > 0.5) {
          isClosing.current = true
          hide()
        } else {
          Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 100, useNativeDriver: true }).start()
        }
      },
    })
  ).current

  const gorilaBounceInterp = gorilaBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  })

  function onContentLayout(e: LayoutChangeEvent) {
    setContentHeight(e.nativeEvent.layout.height)
  }

  if (!isVisible || !message) return null

  const expressao = GORILA_ANIMATIONS[message.estado]

  return (
    <Animated.View
      style={[styles.overlay, { opacity: fadeAnim }]}
      pointerEvents="box-none"
    >
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={hide} activeOpacity={1} />

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.backgroundSecondary,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Gorila a espreitar */}
        <Animated.Image
          source={require('../../../assets/images/Gorila.png')}
          style={[
            styles.gorilaImagem,
            {
              transform: [
                { translateY: Animated.add(gorilaBounceInterp, expressao.translateY) },
                { rotate: expressao.rotate },
                { scale: expressao.scale },
              ],
            },
          ]}
          resizeMode="contain"
        />

        {/* Handle + conteúdo colado ao topo */}
        <View style={styles.header}>
          <View style={[styles.handle, { backgroundColor: theme.textTertiary }]} />
        </View>

        {/* Conteúdo dinâmico */}
        <View style={styles.content} onLayout={onContentLayout}>
          <View style={[styles.balao, { backgroundColor: theme.backgroundTertiary }]}>
            <Text style={[styles.texto, { color: theme.text }]}>
              {message.texto}
            </Text>
          </View>

          {message.acoes && message.acoes.length > 0 && (
            <View style={[styles.acoes, message.presentation === 'choices' && styles.escolhas]}>
              {message.acoes.map((acao, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.botao,
                    message.presentation === 'choices' && styles.botaoEscolha,
                    acao.primary
                      ? { backgroundColor: theme.primary }
                      : { backgroundColor: theme.backgroundTertiary },
                  ]}
                  onPress={() => { hide(); acao.onPress() }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.botaoTexto, { color: acao.primary ? '#FFFFFF' : theme.text }]}>
                    {acao.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {(!message.acoes || message.acoes.length === 0) && (
            <TouchableOpacity onPress={hide} style={{ paddingVertical: 6 }}>
              <Text style={[styles.fecharTexto, { color: theme.textTertiary }]}>Fechar</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 16,
  },
  gorilaImagem: {
    position: 'absolute',
    top: -GORILA_PEEK,
    right: 16,
    width: GORILA_SIZE,
    height: GORILA_SIZE,
    zIndex: 10,
  },
  header: {
    paddingTop: GORILA_DENTRO + 4,
    alignItems: 'center',
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  balao: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
    justifyContent: 'center',
  },
  texto: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
  },
  acoes: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  escolhas: {
    flexDirection: 'column',
  },
  botao: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  botaoEscolha: {
    flex: 0,
    width: '100%',
  },
  botaoTexto: {
    fontSize: 15,
    fontWeight: '600',
  },
  fecharTexto: {
    fontSize: 14,
    fontWeight: '500',
  },
})
