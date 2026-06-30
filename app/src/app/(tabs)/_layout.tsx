import { Tabs, usePathname } from "expo-router";
import { View, TouchableOpacity, StyleSheet, Pressable, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../styles/theme";

function CustomTabBar({ state, descriptors, navigation, hideTabBar }: any) {
  const theme = useTheme();
  const { bottom: safeBottom } = useSafeAreaInsets();
  const tabBarBottom = Math.max(safeBottom + 10, 30);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  if (hideTabBar) return null;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: false,
      }),
      Animated.spring(translateYAnim, {
        toValue: -8,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: false,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const iconNameMap = {
    index: "home" as const,
    communities: "people" as const,
    metrics: "stats-chart" as const,
    profile: "person" as const,
  };

  const getTabComponent = (route: any, index: number, isFocused: boolean) => {
    const iconName = (iconNameMap[route.name as keyof typeof iconNameMap] || "home") as keyof typeof Ionicons.glyphMap;
    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity key={route.key} onPress={onPress} style={styles.tab}>
        <View
          style={{
            backgroundColor: isFocused ? theme.accent + "20" : "transparent",
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <Ionicons name={iconName as any} size={24} color={isFocused ? theme.accent : theme.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.tabBarContainer, { bottom: tabBarBottom }]}>
      <BlurView intensity={35} style={[styles.blurContainer, { borderColor: theme.border }]}>
        <View style={[styles.tabBar, { backgroundColor: "rgba(0,0,0,0.1)" }]}>
      {/* Esquerda: Home */}
          <View style={styles.tabGroup}>
            {state.routes.slice(0, 1).map((route: any, index: number) => {
              const isFocused = state.index === index;
              return getTabComponent(route, index, isFocused);
            })}
          </View>

          {/* Centro-Esquerda: Communities */}
          <View style={styles.tabGroup}>
            {state.routes.slice(1, 2).map((route: any, index: number) => {
              const isFocused = state.index === index + 1;
              return getTabComponent(route, index + 1, isFocused);
            })}
          </View>

          {/* Centro: Play Button */}
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => router.push("/(tabs)/workouts")}
          >
            <Animated.View
              style={[
                styles.centerButton,
                { backgroundColor: theme.accent },
                {
                  transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
                },
              ]}
            >
              <Ionicons name="play" size={24} color="white" />
            </Animated.View>
          </Pressable>

          {/* Centro-Direita: Metrics */}
          <View style={styles.tabGroup}>
            {state.routes.slice(3, 4).map((route: any, index: number) => {
              const isFocused = state.index === 3;
              return getTabComponent(route, 3, isFocused);
            })}
          </View>

          {/* Direita: Profile */}
          <View style={styles.tabGroup}>
            {state.routes.slice(4, 5).map((route: any, index: number) => {
              const isFocused = state.index === 4;
              return getTabComponent(route, 4, isFocused);
            })}
          </View>
        </View>
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  const pathname = usePathname();
  const hideTabBar = pathname.includes("community/");

  return (
    <Tabs
      tabBar={(props: any) => <CustomTabBar {...props} hideTabBar={hideTabBar} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{}}
      />
      <Tabs.Screen 
        name="communities" 
        options={{}}
      />
      <Tabs.Screen 
        name="workouts" 
        options={{}}
      />
      <Tabs.Screen 
        name="metrics" 
        options={{}}
      />
      <Tabs.Screen 
        name="profile" 
        options={{}}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 30, // overridden dynamically with safeBottom
    left: 20,
    right: 20,
  },
  blurContainer: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
  },
  tabBar: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});

