import Monaco, { monaco as tmonaco } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import React, { useState, useRef, useEffect } from "react";
import { useRouteMatch, useLocation } from "react-router-dom";
import { getExampleRef } from "./firebase";
import { parseMD, Content } from "./md";
import { SequenceDiagram } from "./diagrams";
import { DEFAULT_EXAMPLE } from "./example";
import { graphviz } from "@hpcc-js/wasm";
import { DropdownShare } from "./components/Dropdown";
import {
  ScreenFullIcon,
  ScreenNormalIcon,
  ShareAndroidIcon,
  LinkIcon,
  RepoForkedIcon,
  AlertIcon,
} from "@primer/octicons-react";
import { copyTextToClipboard, generateStaticLink } from "./helpers";
import UseAnimations from "react-useanimations";
import skipForward from "react-useanimations/lib/skipForward";
import skipBack from "react-useanimations/lib/skipBack";
import { navigateTo } from "./Nav";
import { DownloadSvg } from "./components/DownloadSvg";
declare var Firepad: any;
declare var monaco: typeof monacoEditor;

function Code($: { language: string; code: string }) {
  const [coloredCode, setColoredCode] = useState($.code);

  useEffect(() => {
    monaco.editor
      .colorize($.code || "", $.language, { tabSize: 2 })
      .then((html: string) => setColoredCode(html));
  }, [$.code, $.language]);

  return <pre dangerouslySetInnerHTML={{ __html: coloredCode }}></pre>;
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

function render($: Content, key: number = 0): any {
  if ($.type === "title") {
    switch ($.level) {
      case 1:
        return <h1 key={key}>{$.text}</h1>;
      case 2:
        return <h2 key={key}>{$.text}</h2>;
      case 3:
        return <h3 key={key}>{$.text}</h3>;
      case 4:
        return <h4 key={key}>{$.text}</h4>;
      case 5:
        return <h5 key={key}>{$.text}</h5>;
      default:
        return <h6 key={key}>{$.text}</h6>;
    }
  } else if ($.type === "file") {
    return (
      <div key={key}>
        {render($.fileName)}
        <section>{render($.codeBlock)}</section>
      </div>
    );
  } else if ($.type === "code") {
    if ($.language == "sequence") {
      return <SequenceDiagram key={key} input={$.text || ""} />;
    } else if ($.language == "dot") {
      return <Dot key={key} code={$.text || ""} />;
    }
    return <Code key={key} language={$.language} code={$.text!} />;
  } else if ($.type === "text") {
    return <p key={key}>{$.text}</p>;
  } else {
    return <pre key={key}>{JSON.stringify($, null, 2)}</pre>;
  }
}

function Users(props: { users: any }) {
  return <></>;
}

export function Editor(props: { readonly?: boolean }) {
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor>();
  const [fullscreen, setFullscreen] = useState<boolean>(
    props.readonly || false
  );
  const [firebaseRef, setFirebaseRef] = useState<any>(null);
  const [loadingCopy, setLoadingCopy] = useState<boolean>(false);
  const [loadingSave, setLoadingSave] = useState<boolean>(false);
  const [firepad, setFirepad] = useState<any>(null);
  const [md, setMd] = useState<Content[]>([]);
  const match = useRouteMatch<{ notepadId: string }>();
  const location = useLocation();

  const [staticContent, setStaticContent] = useState<string>();

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    setStaticContent(qs.get("t") || "");
    if (qs.has("open")) {
      setFullscreen(false);
    }
  }, [location.search]);

  const theme = props.readonly ? "vs-disabled" : "vs";

  const language = "markdown";
  const [, setIsEditorReady] = useState(false);

  function handleEditorDidMount(_getEditorValue: any, editor: any) {
    editorRef.current = editor;
    setIsEditorReady(true);

    editorRef.current!.onDidChangeModelContent((ev) => {
      const x = parseMD(editorRef.current!.getValue());
      setMd(x);
    });
  }

  useEffect(() => {
    if (!props.readonly) {
      setFirebaseRef(getExampleRef(match.params.notepadId));
    } else {
      setFirebaseRef(null);
    }
  }, [match.params.notepadId]);

  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.defineTheme("vs-disabled", {
        base: "vs",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#eeeeee",
        },
      });
      monaco.editor.setTheme(theme);
      editorRef.current.render();

      if (firepad) {
        firepad.dispose();
        editorRef.current.setValue("");
      }

      if (firebaseRef) {
        editorRef.current.setValue("");
        setFirepad(
          Firepad.fromMonaco(firebaseRef, editorRef.current, {
            defaultText: DEFAULT_EXAMPLE,
          })
        );
      } else if (props.readonly) {
        setFirepad(null);
        editorRef.current.setValue(staticContent || "<Empty>");
      }
    }
  }, [editorRef.current, firebaseRef, staticContent]);

  useEffect(() => {
    if (firepad) {
      firepad.on("synced", function (isSynced: boolean) {
        setLoadingSave(!isSynced);
      });
    }
  }, [firepad]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [fullscreen]);

  function makeCopy() {
    setLoadingCopy(true);

    const ref = getExampleRef();

    const val = editorRef.current!.getValue();

    const headless = new Firepad.Headless(ref);
    headless.setText(val, function (data: any, succeed: boolean) {
      setLoadingCopy(false);
      if (succeed) {
        setFullscreen(false);
        navigateTo(`/editor/${ref.key}`);
      }
    });
  }

  let hadTitle = false;

  for (let elem of md) {
    if (elem.type == "title") {
      document.title = elem.text + " - Diagrams";
      hadTitle = true;
      break;
    }
  }

  if (!hadTitle) {
    document.title = "Untitled document - Diagrams";
  }

  const c = md.map(render);

  return (
    <div className={fullscreen ? "fullscreen" : ""}>
      {/* <div className="tools">
        {firebaseRef && <Users users={firebaseRef.child("users")} />}
      </div> */}
      <div className="editor">
        {props.readonly && (
          <div
            className="readonly-notice"
            style={{ borderBottom: "1px solid #dbdbda" }}
          >
            <div
              className="Toast Toast--warning"
              style={{
                maxWidth: 1000,
                width: "auto",
              }}
            >
              <span className="Toast-icon">
                <AlertIcon size={16} />
              </span>
              <span className="Toast-content">
                This is a read-only page.{" "}
                <a onClick={makeCopy} style={{ cursor: "pointer" }}>
                  Make a copy
                  {loadingCopy && <span className="AnimatedEllipsis"></span>}
                </a>{" "}
                to edit the document.
              </span>
            </div>
          </div>
        )}
        <Monaco
          theme={theme}
          language={language}
          loading={<div>Loading editor...</div>}
          value={""}
          editorDidMount={handleEditorDidMount}
          options={{
            lineNumbers: "on",
            minimap: { enabled: false },
            readOnly: !!props.readonly,
            automaticLayout: true,
          }}
        />
      </div>
      <div className="content">
        <div className="content-bar d-flex p-2">
          <button
            className="btn btn-octicon tooltipped tooltipped-se mr-2"
            aria-label="Show or hide the code editor."
            onClick={() => {
              setFullscreen(!fullscreen);
            }}
          >
            <UseAnimations
              reverse={fullscreen}
              animation={skipBack}
              size={24}
              strokeColor="#586069"
              onClick={() => {
                setFullscreen(!fullscreen);
              }}
            />
          </button>
          <button
            className="btn tooltipped tooltipped-se mr-2"
            aria-label="Copies a read-only &amp; static link to the clipboard."
            onClick={() => {
              copyTextToClipboard(
                generateStaticLink(editorRef.current!.getValue()!)
              ).then(() => {
                editorRef.current!.focus();
              });
            }}
          >
            <ShareAndroidIcon size={16} />
            <span>Share read-only</span>
          </button>
          {props.readonly || (
            <button
              className="btn tooltipped tooltipped-se mr-2"
              aria-label="Copies this page's editable link to the clipboard."
              onClick={() => {
                copyTextToClipboard(document.location.toString()).then(() => {
                  editorRef.current!.focus();
                });
              }}
            >
              <LinkIcon size={16} />
              <span>Share editable</span>
            </button>
          )}

          <button
            className="btn tooltipped tooltipped-se mr-2"
            aria-label="Makes a copy"
            onClick={makeCopy}
          >
            <RepoForkedIcon size={16} />
            <span>
              Make a copy
              {loadingCopy && <span className="AnimatedEllipsis"></span>}
            </span>
          </button>
          {loadingSave && (
            <span className="m-1">
              <span>Saving</span>
              <span className="AnimatedEllipsis"></span>
            </span>
          )}
        </div>
        <div className="scroll">
          <div className="markdown-body">{c}</div>
        </div>
        {/* {loading && <></div> } */}
      </div>
    </div>
  );
}
