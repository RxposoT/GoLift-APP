import { useEffect, useRef } from "react";
import { Animated, View, ViewStyle } from "react-native";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.backgroundTertiary,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── Skeletons compostos para cada ecrã ──────────────────────────────────────

export function HomeScreenSkeleton() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 24, paddingTop: safeTop + 16 }}>
      {/* Greeting */}
      <Skeleton width={120} height={14} borderRadius={6} style={{ marginBottom: 10 }} />
      <Skeleton width={200} height={38} borderRadius={8} style={{ marginBottom: 24 }} />

      {/* Week strip */}
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 36 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 8 }}>
            <Skeleton width={20} height={10} borderRadius={4} />
            <Skeleton height={36} borderRadius={10} />
          </View>
        ))}
      </View>

      {/* Hero stat card */}
      <Skeleton height={160} borderRadius={24} style={{ marginBottom: 12 }} />

      {/* Two secondary cards */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 36 }}>
        <Skeleton height={100} borderRadius={24} style={{ flex: 1 }} />
        <Skeleton height={100} borderRadius={24} style={{ flex: 1 }} />
      </View>

      {/* Recent workouts header */}
      <Skeleton width={180} height={22} borderRadius={6} style={{ marginBottom: 14 }} />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} height={78} borderRadius={18} style={{ marginBottom: 10 }} />
      ))}
    </View>
  );
}

export function WorkoutsScreenSkeleton() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 24, paddingTop: safeTop + 16 }}>
      {/* Header */}
      <Skeleton width={140} height={36} borderRadius={8} style={{ marginBottom: 24 }} />

      {/* Filter chips */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
        {[80, 100, 90, 110].map((w, i) => (
          <Skeleton key={i} width={w} height={34} borderRadius={17} />
        ))}
      </View>

      {/* Workout cards */}
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} height={100} borderRadius={18} style={{ marginBottom: 12 }} />
      ))}
    </View>
  );
}

export function ProfileScreenSkeleton() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: safeTop + 16 }}>
      {/* Hero */}
      <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
        <Skeleton height={180} borderRadius={28} />
      </View>

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 24, marginBottom: 24 }}>
        <Skeleton height={80} borderRadius={18} style={{ flex: 1 }} />
        <Skeleton height={80} borderRadius={18} style={{ flex: 1 }} />
        <Skeleton height={80} borderRadius={18} style={{ flex: 1 }} />
      </View>

      {/* Options section */}
      <View style={{ paddingHorizontal: 24 }}>
        <Skeleton width={120} height={16} borderRadius={6} style={{ marginBottom: 14 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={56} borderRadius={14} style={{ marginBottom: 8 }} />
        ))}
      </View>
    </View>
  );
}

export function MetricsScreenSkeleton() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 24, paddingTop: safeTop + 16 }}>
      <Skeleton width={140} height={36} borderRadius={8} style={{ marginBottom: 24 }} />

      {/* Stats grid */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
        <Skeleton height={90} borderRadius={18} style={{ flex: 1 }} />
        <Skeleton height={90} borderRadius={18} style={{ flex: 1 }} />
      </View>
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
        <Skeleton height={90} borderRadius={18} style={{ flex: 1 }} />
        <Skeleton height={90} borderRadius={18} style={{ flex: 1 }} />
      </View>

      {/* Bar chart */}
      <Skeleton height={120} borderRadius={18} style={{ marginBottom: 24 }} />

      {/* Records */}
      <Skeleton width={160} height={20} borderRadius={6} style={{ marginBottom: 14 }} />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} height={64} borderRadius={14} style={{ marginBottom: 8 }} />
      ))}
    </View>
  );
}
