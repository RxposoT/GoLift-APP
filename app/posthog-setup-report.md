<wizard-report>
# PostHog post-wizard report

The wizard completed the Expo PostHog setup by moving initialization to a shared PostHog client, keeping Expo Router manual screen tracking and touch autocapture in the root layout, and wiring the app to the configured EU project through environment variables. Auth flows continue to identify signed-in users on restore and login, and analytics coverage now spans registration, login, subscription checkout, daily readiness, AI plan generation and imports, AI reports, profile updates, and workout lifecycle actions. Error capture was also added around workout persistence and existing critical client flows remain instrumented.

| Event | Description | File |
| --- | --- | --- |
| `user_logged_in` | Captured when an athlete successfully signs in with email credentials. | `src/contexts/AuthContext.tsx` |
| `user_registered` | Captured when an athlete completes account registration. | `src/contexts/AuthContext.tsx` |
| `subscription_checkout_started` | Captured when a user starts the GoLift Pro checkout flow. | `src/app/upgrade.tsx` |
| `subscription_checkout_completed` | Captured when checkout verification confirms a successful subscription. | `src/app/upgrade.tsx` |
| `daily_checkin_completed` | Captured when a user saves a daily readiness check-in. | `src/app/checkin.tsx` |
| `ai_plan_generated` | Captured when an AI training plan is successfully generated. | `src/app/ai-plan.tsx` |
| `ai_plan_day_imported` | Captured when a generated AI plan day is imported into workouts. | `src/app/ai-plan.tsx` |
| `ai_report_generated` | Captured when a weekly AI report is generated or refreshed. | `src/app/ai-report.tsx` |
| `profile_updated` | Captured when an athlete saves profile changes. | `src/app/account.tsx` |
| `workout_created` | Captured when a user creates a workout successfully. | `src/services/api/workouts.ts` |
| `workout_updated` | Captured when a user updates an existing workout. | `src/services/api/workouts.ts` |
| `workout_deleted` | Captured when a user deletes a workout. | `src/services/api/workouts.ts` |
| `workout_session_saved` | Captured when a workout session and its sets are saved. | `src/services/api/workouts.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- Dashboard: https://eu.posthog.com/project/219464/dashboard/804658
- Insight: Registrations and logins (wizard) — https://eu.posthog.com/project/219464/insights/ih5hdhlJ
- Insight: Subscription funnel (wizard) — https://eu.posthog.com/project/219464/insights/R82fdqLm
- Insight: Workout creation and completion (wizard) — https://eu.posthog.com/project/219464/insights/SdNR9uUE
- Insight: AI feature usage (wizard) — https://eu.posthog.com/project/219464/insights/TAyaHLMv
- Insight: Daily check-ins completed (wizard) — https://eu.posthog.com/project/219464/insights/6iHZ3fpY

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add the exact PostHog env var names you added to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Confirm the returning-visitor path also calls `identify` — a handler that only identifies on fresh login can leave returning sessions on anonymous distinct IDs.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
