module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@sentry/.*|react-native-.*|@react-native-.*/.*)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^test-renderer$": "<rootDir>/__mocks__/test-renderer.js",
  },
};
