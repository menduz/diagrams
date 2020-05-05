import typescript from "rollup-plugin-typescript2";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import globals from "rollup-plugin-node-globals";
import json from "rollup-plugin-json";
import { terser } from "rollup-plugin-terser";
import replace from "rollup-plugin-replace";
import { string } from "rollup-plugin-string";

const PROD = process.env.BUILD === "production";

console.log(`production: ${PROD}`);

const plugins = [
  typescript({
    verbosity: 2,
    clean: true,
  }),
  replace({
    "process.env.NODE_ENV": JSON.stringify(PROD ? "production" : "development"),
  }),
  resolve({
    browser: true,
    preferBuiltins: false,
  }),
  string({
    include: "public/bin/ww-shell.js",
  }),
  commonjs({
    ignoreGlobal: true,
    include: [/node_modules/],
    namedExports: {
      react: [
        "Children",
        "Component",
        "PropTypes",
        "createElement",
        "useEffect",
        "useState",
        "useRef",
      ],
      "react-dom": ["render"],
      "react-is": ["isValidElementType"],
    },
  }),

  PROD && terser({}),
  globals({}),
  json(),
];

const banner = `/*! Menduz diagrams */
const buildInformation = ${JSON.stringify(
  {
    date: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || "HEAD",
    ref: process.env.GITHUB_REF || "?",
  },
  null,
  2
)};`;

export default {
  input: "./src/index.ts",
  context: "document",
  plugins,
  output: [
    {
      file: "./docs/index.js",
      format: "iife",
      name: "Arduz",
      sourcemap: !PROD,
      banner,
    },
  ],
  external: ["buildInformation"],
};
