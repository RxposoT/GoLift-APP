export { authApi } from "./api/auth";
export { userApi } from "./api/user";
export { exerciseApi } from "./api/exercises";
export { workoutApi } from "./api/workouts";
export { metricsApi } from "./api/metrics";
export { communitiesApi } from "./api/communities";
export { planoApi } from "./api/plano";

import { authApi } from "./api/auth";
import { userApi } from "./api/user";
import { exerciseApi } from "./api/exercises";
import { workoutApi } from "./api/workouts";
import { metricsApi } from "./api/metrics";
import { communitiesApi } from "./api/communities";
import { planoApi } from "./api/plano";

export default {
  auth: authApi,
  user: userApi,
  exercise: exerciseApi,
  workout: workoutApi,
  metrics: metricsApi,
  communities: communitiesApi,
  plano: planoApi,
};
