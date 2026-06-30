import { Stack } from "expo-router";
import { useTheme } from "../../../styles/theme";

export default function CommunityLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
