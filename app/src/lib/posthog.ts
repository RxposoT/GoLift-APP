import PostHog from "posthog-react-native";

const posthogProjectToken = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN ?? "";
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
const fallbackProjectToken = posthogHost;

const isPostHogConfigured = Boolean(posthogProjectToken);

export const posthog = new PostHog(posthogProjectToken || fallbackProjectToken, {
  host: posthogHost,
  disabled: !isPostHogConfigured,
  captureAppLifecycleEvents: true,
  flushAt: 20,
  flushInterval: 10000,
  maxBatchSize: 100,
  maxQueueSize: 1000,
  preloadFeatureFlags: true,
  sendFeatureFlagEvent: true,
  featureFlagsRequestTimeoutMs: 10000,
  requestTimeout: 10000,
  fetchRetryCount: 3,
  fetchRetryDelay: 3000,
});

export { isPostHogConfigured };
