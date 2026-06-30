import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Wrapper centralizado para safe area insets.
 * Garante paddingTop/paddingBottom correcto em dispositivos Android com
 * edgeToEdgeEnabled: true (gesture navigation bar, status bar, etc.)
 */
export function useAndroidInsets() {
  const insets = useSafeAreaInsets();
  const safeTop = insets.top + 8;
  const safeBottom = insets.bottom;
  return {
    safeTop,
    safeBottom,
    // backward compat aliases
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    insets,
  };
}
