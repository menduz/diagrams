import type * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";

const setUpInstances = new Set<any>();

export function setupMonaco(monaco: typeof monacoEditor) {
  if (setUpInstances.has(monaco)) return;
  setUpInstances.add(monaco);

  monaco.editor.defineTheme("enabled", {
    base: "vs",
    inherit: true,
    rules: [
      {
        token: "invalid",
        foreground: "ff0000",
        fontStyle: "bold italic underline",
      },
    ],
    colors: {},
  });

  monaco.editor.defineTheme("disabled", {
    base: "vs",
    inherit: true,
    rules: [
      {
        token: "invalid",
        foreground: "ff0000",
        fontStyle: "bold italic underline",
      },
    ],

    colors: {
      "editor.background": "#eeeeee",
    },
  });

  registerSequence(monaco);
  registerDot(monaco);
  registerProtobuf(monaco);
}

function registerSequence(monaco: typeof monacoEditor): void {
  monaco.languages.register({
    id: "sequence",
    extensions: [".sequence"],
    aliases: ["sequence"],
  });

  monaco.languages.setMonarchTokensProvider("sequence", {
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
  } as any);
}

function registerProtobuf(monaco: typeof monacoEditor) {
  monaco.languages.register({
    id: "protobuf",
    extensions: [".proto"],
    aliases: ["protobuf"],
  });
  monaco.languages.setMonarchTokensProvider("protobuf", {
    keywords: [
      "import",
      "option",
      "message",
      "package",
      "service",
      "optional",
      "rpc",
      "returns",
      "return",
      "repeated",
      "true",
      "false",
    ],
    typeKeywords: [
      "double",
      "float",
      "int32",
      "int64",
      "uint32",
      "uint64",
      "sint32",
      "sint64",
      "fixed32",
      "fixed64",
      "sfixed32",
      "sfixed64",
      "bool",
      "string",
      "bytes",
    ],
    operators: [
      "=",
      ">",
      "<",
      "!",
      "~",
      "?",
      ":",
      "==",
      "<=",
      ">=",
      "!=",
      "&&",
      "||",
      "++",
      "--",
      "+",
      "-",
      "*",
      "/",
      "&",
      "|",
      "^",
      "%",
      "<<",
      ">>",
      ">>>",
      "+=",
      "-=",
      "*=",
      "/=",
      "&=",
      "|=",
      "^=",
      "%=",
      "<<=",
      ">>=",
      ">>>=",
    ],
    symbols: /[=><!~?:&|+\-*\/^%]+/,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        [
          /[a-z_$][\w$]*/,
          {
            cases: {
              "@typeKeywords": "keyword",
              "@keywords": "keyword",
              "@default": "identifier",
            },
          },
        ],
        [/[A-Z][\w\$]*/, "type.identifier"],
        { include: "@whitespace" },

        // delimiters and operators
        [/[{}()\[\]]/, "@brackets"],
        [/[<>](?!@symbols)/, "@brackets"],
        [
          /@symbols/,
          {
            cases: {
              "@operators": "operator",
              "@default": "",
            },
          },
        ],
        // @ annotations.
        [
          /@\s*[a-zA-Z_\$][\w\$]*/,
          { token: "annotation", log: "annotation token: $0" },
        ],
        // numbers
        [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
        [/0[xX][0-9a-fA-F]+/, "number.hex"],
        [/\d+/, "number"],
        // delimiter: after number because of .\d floats
        [/[;,.]/, "delimiter"],
        // strings
        [/"([^"\\]|\\.)*$/, "string.invalid"], // non-teminated string
        [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],
        // characters
        [/'[^\\']'/, "string"],
        [/(')(@escapes)(')/, ["string", "string.escape", "string"]],
        [/'/, "string.invalid"],
      ],
      comment: [
        [/[^\/*]+/, "comment"],
        [/\/\*/, "comment", "@push"], // nested comment
        [/\\*\//, "comment", "@pop"],
        [/[\/*]/, "comment"],
      ],
      string: [
        [/[^\\"]+/, "string"],
        [/@escapes/, "string.escape"],
        [/\\./, "string.escape.invalid"],
        [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
      ],
      whitespace: [
        [/[ \t\r\n]+/, "white"],
        [/\/\*/, "comment", "@comment"],
        [/\/\/.*$/, "comment"],
      ],
    },
  } as monacoEditor.languages.IMonarchLanguage & any);
}

export function registerDot(monaco: typeof monacoEditor): void {
  // Difficulty: Easy
  // Dot graph language.
  // See http://www.rise4fun.com/Agl

  monaco.languages.register({
    id: "dot",
    extensions: [".dot", ".xdot", ".viz"],
    aliases: ["dot", "graphviz"],
  });

  monaco.languages.setMonarchTokensProvider("dot", {
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
  } as monacoEditor.languages.IMonarchLanguage & any);
}
