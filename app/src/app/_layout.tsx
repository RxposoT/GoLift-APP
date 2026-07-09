import { Stack, router, useGlobalSearchParams, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { AuthProvider } from "../contexts/AuthContext";
import { CommunitiesProvider } from "../contexts/CommunitiesContext";
import { ThemeProvider, useTheme, useThemePreference } from "../contexts/ThemeContext";
import { GorilaProvider } from "../components/gorila/GorilaContext";
import GorilaDialog from "../components/gorila/GorilaDialog";
import { Text } from "../components/ui";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { posthog } from "../lib/posthog";
import "../styles/global.css";

function ScreenTracker() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const posthog = usePostHog();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [params, pathname, posthog]);

  return null;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function normalizeRouteFromNotificationData(data?: Record<string, unknown>): string | null {
  const candidate =
    typeof data?.path === "string"
      ? data.path
      : typeof data?.route === "string"
        ? data.route
        : typeof data?.url === "string"
          ? data.url
          : null;

  if (!candidate) return null;

  if (candidate.startsWith("http://") || candidate.startsWith("https://") || candidate.startsWith("exp://")) {
    const parsed = Linking.parse(candidate);
    if (!parsed.path) return null;
    return `/${parsed.path}`;
  }

  return candidate.startsWith("/") ? candidate : `/${candidate}`;
}

function routeFromNotification(data?: Record<string, unknown>) {
  const route = normalizeRouteFromNotificationData(data);
  if (!route) return;

  try {
    router.push(route as never);
  } catch {
    // noop
  }
}

function RootLayoutContent() {
  const theme = useTheme();
  const { isDark } = useThemePreference();
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(theme.background);
      NavigationBar.setButtonStyleAsync("light");
    }
  }, [theme.background]);

  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      routeFromNotification(response.notification.request.content.data as Record<string, unknown>);
    });

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          routeFromNotification(response.notification.request.content.data as Record<string, unknown>);
        }
      })
      .catch(() => {});

    return () => {
      responseListener.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <GorilaProvider>
        <CommunitiesProvider>
          <StatusBar style={isDark ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.background },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="account" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="workout/[id]"
              options={{
                presentation: "fullScreenModal",
                animation: "slide_from_bottom"
              }}
            />
            <Stack.Screen
              name="user/[id]"
              options={{
                presentation: "card",
                animation: "slide_from_right"
              }}
            />
            <Stack.Screen
              name="upgrade"
              options={{
                presentation: "card",
                animation: "slide_from_bottom"
              }}
            />
            <Stack.Screen
              name="ai-report"
              options={{
                presentation: "card",
                animation: "slide_from_right"
              }}
            />
            <Stack.Screen
              name="ai-plan"
              options={{
                presentation: "card",
                animation: "slide_from_right"
              }}
            />
            <Stack.Screen
              name="exercise-progress/[id]"
              options={{
                presentation: "card",
                animation: "slide_from_right"
              }}
            />
            <Stack.Screen
              name="workout/summary"
              options={{
                presentation: "fullScreenModal",
                animation: "slide_from_bottom"
              }}
            />
          </Stack>
          {!isOnline && (
            <View style={{ backgroundColor: "#FF3B30", paddingVertical: 6, alignItems: "center" }}>
              <Text variant="subhead" style={{ color: "#fff", fontWeight: "600" }}>
                Sem ligação à internet — dados em cache
              </Text>
            </View>
          )}
          <GorilaDialog />
        </CommunitiesProvider>
      </GorilaProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PostHogProvider
          client={posthog}
          autocapture={{
            captureScreens: false,
            captureTouches: true,
            propsToCapture: ["testID"],
            maxElementsCaptured: 20,
          }}
        >
          <ScreenTracker />
          <RootLayoutContent />
        </PostHogProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
