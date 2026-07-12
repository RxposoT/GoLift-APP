import { useEffect, useRef } from "react";
import { Animated } from "react-native";

/**
 * Anima opacity + translateY quando o componente monta.
 * @param index Para escalonar múltiplos itens (delay = index * 60ms)
 */
export function useFadeIn(index = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { opacity, translateY };
}

/**
 * Anima scale quando o componente monta (útil para badges/ícones).
 */
export function useBounceIn(index = 0) {
  const scale = useRef(new Animated.Value(0.01)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 120,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  return { scale };
}
