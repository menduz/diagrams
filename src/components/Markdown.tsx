import React, {
  useRef,
  useCallback,
  ReactNode,
  MouseEvent as ReactMouseEvent,
  useState,
  useEffect,
  useLayoutEffect,
} from "react";
import { graphviz } from "@hpcc-js/wasm";
import type * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import { DownloadSvg } from "./DownloadSvg";
import { SequenceDiagram } from "src/diagrams";
declare var monaco: typeof monacoEditor;

var escapeReplacements: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
};

function unescape(token: { text: string }) {
  return token.text.replace(/&(amp|lt|gt|quot|#39);/g, function (_, r) {
    return escapeReplacements[r];
  });
}

function Code($: { language: string; code: string }) {
  const theRef = useRef<HTMLPreElement>(null);
  const [language, setLanguage] = useState<string>("txt");
  const [code, setCode] = useState<string>("");

  useLayoutEffect(() => {
    if (theRef.current) {
      monaco.editor
        .colorize(code || "", language || "text", {
          tabSize: 2,
        })
        .then(
          ($) => {
            theRef.current!.innerHTML = $;
          },
          (e) => {
            debugger;
            console.error(e);
          }
        );
    }
  }, [theRef, code, language]);

  useEffect(() => {
    if ($.code != code) setCode($.code);
    if ($.language != language) setLanguage($.language);
  });

  return (
    <pre ref={theRef} className="vs">
      {code}
    </pre>
  );
}

function Dot(props: { code: string }) {
  const [html, setHtml] = useState("Loading...");
  const [error, setError] = useState<string>();

  useEffect(() => {
    graphviz
      .dot(props.code, "svg", { wasmFolder: "wasm" })
      .then(($) => {
        setError("");
        setHtml($);
      })
      .catch((e) => {
        setError(e.message);
      });
  }, [props.code]);

  return (
    <>
      {error && <pre>{error}</pre>}

      <DownloadSvg dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

export function renderMarkdown($: marked.Token, key: number = 0): any {
  if ("type" in $) {
    if ($.type === "heading") {
      switch ($.depth) {
        case 1:
          return <h1 key={key}>{unescape($)}</h1>;
        case 2:
          return <h2 key={key}>{unescape($)}</h2>;
        case 3:
          return <h3 key={key}>{unescape($)}</h3>;
        case 4:
          return <h4 key={key}>{unescape($)}</h4>;
        case 5:
          return <h5 key={key}>{unescape($)}</h5>;
        default:
          return <h6 key={key}>{unescape($)}</h6>;
      }
    } else if ($.type === "code") {
      if ($.lang == "sequence") {
        return <SequenceDiagram key={key} input={unescape($) || ""} />;
      } else if ($.lang == "dot") {
        return <Dot key={key} code={unescape($) || ""} />;
      }
      return <Code key={key} language={$.lang || ""} code={unescape($)!} />;
    } else if ($.type === "paragraph") {
      if ("tokens" in $) {
        return <p key={key}>{($ as any).tokens.map(renderMarkdown)}</p>;
      }
      return <p key={key}>{unescape($)}</p>;
    } else if ($.type === "blockquote") {
      if ("tokens" in $) {
        return (
          <blockquote key={key}>
            {($ as any).tokens.map(renderMarkdown)}
          </blockquote>
        );
      }
      return <blockquote key={key}>{unescape($)}</blockquote>;
    } else if ($.type === "em") {
      if ("tokens" in $) {
        return <em key={key}>{($ as any).tokens.map(renderMarkdown)}</em>;
      }
      return <em key={key}>{unescape($)}</em>;
    } else if ($.type === "strong") {
      if ("tokens" in $) {
        return <b key={key}>{($ as any).tokens.map(renderMarkdown)}</b>;
      }
      return <b key={key}>{unescape($)}</b>;
    } else if ($.type === "html") {
      return <span key={key}>{JSON.stringify($.raw, null, 2)}</span>;
    } else if ($.type === "text") {
      if ("tokens" in $) {
        return <span key={key}>{($ as any).tokens.map(renderMarkdown)}</span>;
      }
      return <span key={key}>{unescape($)}</span>;
    } else if ($.type === "codespan") {
      return <code key={key}>{unescape($)}</code>;
    } else if ($.type === "link") {
      return <span key={key}>{unescape($)}</span>;
    } else if ($.type === "space") {
      return <div key={key} className="my-2" />;
    } else if ($.type === "escape") {
      return <span key={key}>{unescape($)}</span>;
    } else if ($.type === "hr") {
      return <hr key={key} />;
    } else if ($.type === "list_item") {
      if ("tokens" in $) {
        return <li key={key}>{($ as any).tokens.map(renderMarkdown)}</li>;
      }
      return <li key={key}>{unescape($)}</li>;
    } else if (($.type as any) === "list") {
      const l = $ as marked.Tokens.List;
      if (l.ordered) {
        return (
          <ol key={key} start={(l.start as any) as number}>
            {l.items.map(renderMarkdown)}
          </ol>
        );
      }
      return <ul key={key}>{l.items.map(renderMarkdown)}</ul>;
    } else {
      return (
        <span key={key} style={{ color: "red!important" }}>
          {process.env.NODE_ENV == "production"
            ? $.raw
            : JSON.stringify($, null, 2)}
        </span>
      );
    }
  }

  return (
    <code key={key} style={{ color: "orange!important" }}>
      {JSON.stringify($, null, 2)}
    </code>
  );
}
