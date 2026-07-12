// React 19 requires globalThis.IS_REACT_ACT_ENVIRONMENT to be true for act() to work.
// @testing-library/react-native v14 only sets it inside its own act wrapper, which isn't
// enough for React 19 — effects fire after act completes and still need this flag.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
