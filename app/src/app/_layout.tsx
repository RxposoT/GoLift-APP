import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from "expo-notifications";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PostHogProvider } from "posthog-react-native";
import { AuthProvider } from "../contexts/AuthContext";
import { CommunitiesProvider } from "../contexts/CommunitiesContext";
import { ThemeProvider, useTheme, useThemePreference } from "../contexts/ThemeContext";
import { GorilaProvider } from "../components/gorila/GorilaContext";
import GorilaDialog from "../components/gorila/GorilaDialog";
import "../styles/global.css";

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "";
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

function RootLayoutContent() {
  const theme = useTheme();
  const { isDark } = useThemePreference();

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(theme.background);
      NavigationBar.setButtonStyleAsync("light");
    }
  }, [theme.background]);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.screen) {
        // Future: deep link to specific screens
      }
    });

    return () => sub.remove();
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
        <PostHogProvider apiKey={POSTHOG_API_KEY} options={{ host: POSTHOG_HOST }}>
          <RootLayoutContent />
        </PostHogProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
