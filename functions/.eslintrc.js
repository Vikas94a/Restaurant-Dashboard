module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "lib/**/*", // Ignore built files
    "node_modules/**/*" // Ignore node_modules
  ],
  plugins: [
    "@typescript-eslint"
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  },
};
