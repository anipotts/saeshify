import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      "_archive/**",
      ".next/**",
      ".open-next/**",
      ".wrangler/**",
      "worker-configuration.d.ts"
    ]
  }
];

export default eslintConfig;

