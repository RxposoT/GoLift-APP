import { useEffect } from "react";
import { router } from "expo-router";

// Esta página foi removida. O resumo foi integrado no fluxo de feedback.
export default function WorkoutSummaryRedirect() {
  useEffect(() => {
    router.replace("/");
  }, []);
  return null;
}
