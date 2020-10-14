import type * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";

const setUpInstances = new Set<any>();

export function setupMonaco(monaco: typeof monacoEditor) {
  if (setUpInstances.has(monaco)) return;
  setUpInstances.add(monaco);

  monaco.editor.defineTheme("enabled", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "invalid", foreground: "ff0000", fontStyle: "bold italic underline" },
    ],
    colors: {},
  });

  monaco.editor.defineTheme("disabled", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "invalid", foreground: "ff0000", fontStyle: "bold italic underline" },
    ],

    colors: {
      "editor.background": "#eeeeee",
    },
  });

  monaco.languages.register({
    id: "dot",
    extensions: [".dot", ".xdot", ".viz"],
    aliases: ["dot", "graphviz"],
  });

  monaco.languages.setMonarchTokensProvider("dot", monarchDot());

  monaco.languages.register({
    id: "sequence",
    extensions: [".sequence"],
    aliases: ["sequence"],
  });

  monaco.languages.setMonarchTokensProvider("sequence", monarchSequence());
}

export function monarchSequence(): monacoEditor.languages.IMonarchLanguage &
  any {
  return {
    operators: ["->", "->>", "-->", "-->>"],
    actor: /(?:[a-zA-Z_][^\->:,\r\n"]*|"[^"]*")/,
    tokenizer: {
      root: [
        [
          /([Pp]articipant\s+)(@actor)(\sas\s+)(@actor)$/,
          ["keyword", "string", "keyword", "source"],
        ],
        [/([Pp]articipant\s+)(@actor)$/, ["keyword", "source"]],
        [/([Tt]itle)(:)(.*)$/, ["keyword", "operators", "string"]],
        [
          /(Note\s+)(over\s+|left of\s+|right of\s+)(@actor(?:,\s*@actor\s*)*)(:)(.+)$/,
          ["keyword", "keyword", "source", "operators", "string"],
        ],
        [
          /([Nn]ote\s+)([^:]+)(:)(.+)$/,
          ["keyword", "invalid", "operators", "string"],
        ],
        [/#(.+)$/, "comment"],
        [
          /(@actor\s*)([->]+)(\s*@actor)(:)(.*)$/,
          [
            { token: "source" },
            { cases: { "@operators": "keyword", "@default": "invalid" } },
            { token: "source" },
            { token: "operator" },
            { token: "string" },
          ],
        ],

        [/./, "invalid"],
      ],
    },
  };
}

export function monarchDot(): monacoEditor.languages.IMonarchLanguage & any {
  // Difficulty: Easy
  // Dot graph language.
  // See http://www.rise4fun.com/Agl
  return {
    // Set defaultToken to invalid to see what you do not tokenize yet
    // defaultToken: 'invalid',

    keywords: [
      "strict",
      "graph",
      "digraph",
      "node",
      "edge",
      "subgraph",
      "rank",
      "abstract",
      "n",
      "ne",
      "e",
      "se",
      "s",
      "sw",
      "w",
      "nw",
      "c",
      "_",
      "->",
      ":",
      "=",
      ",",
    ],

    builtins: [
      "rank",
      "rankdir",
      "ranksep",
      "size",
      "ratio",
      "label",
      "headlabel",
      "taillabel",
      "arrowhead",
      "samehead",
      "samearrowhead",
      "arrowtail",
      "sametail",
      "samearrowtail",
      "arrowsize",
      "labeldistance",
      "labelangle",
      "labelfontsize",
      "dir",
      "width",
      "height",
      "angle",
      "fontsize",
      "fontcolor",
      "same",
      "weight",
      "color",
      "bgcolor",
      "style",
      "shape",
      "fillcolor",
      "nodesep",
      "id",
    ],

    attributes: [
      "doublecircle",
      "circle",
      "diamond",
      "box",
      "point",
      "ellipse",
      "record",
      "inv",
      "invdot",
      "dot",
      "dashed",
      "dotted",
      "filled",
      "back",
      "forward",
    ],

    // we include these common regular expressions
    symbols: /[=><!~?:&|+\-*\/\^%]+/,

    // The main tokenizer for our languages
    tokenizer: {
      root: [
        // identifiers and keywords
        [
          /[a-zA-Z_\x80-\xFF][\w\x80-\xFF]*/,
          {
            cases: {
              "@keywords": "keyword",
              "@builtins": "predefined",
              "@attributes": "constructor",
              "@default": "identifier",
            },
          },
        ],

        // whitespace
        { include: "@whitespace" },

        // html identifiers
        [
          /<(?!@symbols)/,
          { token: "string.html.quote", bracket: "@open", next: "html" },
        ],

        // delimiters and operators
        [/[{}()\[\]]/, "@brackets"],
        [
          /@symbols/,
          { cases: { "@keywords": "keyword", "@default": "operator" } },
        ],

        // delimiter
        [/[;,]/, "delimiter"],

        // numbers
        [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
        [/0[xX][0-9a-fA-F]+/, "number.hex"],
        [/\d+/, "number"],

        // strings
        [/"([^"\\]|\\.)*$/, "string.invalid"], // non-teminated string
        [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],
      ],

      comment: [
        [/[^\/*]+/, "comment"],
        [/\/\*/, "comment", "@push"], // nested comment
        [/\\*\//, "comment", "@pop"],
        [/[\/*]/, "comment"],
      ],

      html: [
        [/[^<>&]+/, "string.html"],
        [/&\w+;/, "string.html.escape"],
        [/&/, "string.html"],
        [/</, { token: "string.html.quote", bracket: "@open", next: "@push" }], //nested bracket
        [/>/, { token: "string.html.quote", bracket: "@close", next: "@pop" }],
      ],

      string: [
        [/[^\\"&]+/, "string"],
        [/\\"/, "string.escape"],
        [/&\w+;/, "string.escape"],
        [/[\\&]/, "string"],
        [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
      ],

      whitespace: [
        [/[ \t\r\n]+/, "white"],
        [/\/\*/, "comment", "@comment"],
        [/\/\/.*$/, "comment"],
        [/#.*$/, "comment"],
      ],
    },
  };
}
