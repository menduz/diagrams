import typescript from "rollup-plugin-typescript2";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import globals from "rollup-plugin-node-globals";
import json from "rollup-plugin-json";
import { terser } from "rollup-plugin-terser";
import replace from "rollup-plugin-replace";
import { string } from "rollup-plugin-string";
import scss from "rollup-plugin-scss";
const fixtslib = require("./fix-rollup");

const PROD = process.env.BUILD === "production";

console.log(`production: ${PROD}`);

const plugins = [
  fixtslib(),
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
        "useContext",
        "useMemo",
        "useDebugValue",
        "useCallback",
        "useLayoutEffect",
        "PureComponent",
        "createContext",
      ],
      "prop-types": [
        "object",
        "func",
        "oneOfType",
        "node",
        "bool",
        "any",
        "arrayOf",
        "string",
      ],
      tslib: [
        "__extends",
        "__assign",
        "__rest",
        "__decorate",
        "__param",
        "__metadata",
        "__awaiter",
        "__generator",
        "__exportStar",
        "__values",
        "__read",
        "__spread",
        "__spreadArrays",
        "__await",
        "__asyncGenerator",
        "__asyncDelegator",
        "__asyncValues",
        "__makeTemplateObject",
        "__importStar",
        "__importDefault",
        "__classPrivateFieldGet",
        "__classPrivateFieldSet",
      ],
      idb: ["openDb", "deleteDb"],
      "node_modules/idb/build/idb.js": ["openDb", "deleteDb"],
      "react-dom": ["render", "createPortal"],
      "react-is": ["isValidElementType", "isElement", "typeOf"],
      "@monaco-editor/react": ["monaco"],
    },
  }),

  PROD && terser({}),
  globals({}),
  json(),
  scss(),
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
