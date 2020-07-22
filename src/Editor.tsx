import Monaco from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import React, { useState, useRef, useEffect } from "react";
import { useRouteMatch } from "react-router-dom";
import { getExampleRef } from "./firebase";
import { parseMD, Content } from "./md";
import { SequenceDiagram } from "./diagrams";
import { DEFAULT_EXAMPLE } from "./example";
import { renderGraphviz } from "./VizWorker";
import UseAnimations from "react-useanimations";

import skipForward from "react-useanimations/lib/skipForward";
import skipBack from "react-useanimations/lib/skipBack";

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
    renderGraphviz(props.code)
      .then(($) => {
        setError("");
        setHtml($);
      })
      .catch((e) => {
        setError(e.message);
      });
  }, [props.code]);

  if (error) {
    return <pre>{error}</pre>;
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
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

export function Editor() {
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor>();
  const [firebaseRef, setFirebaseRef] = useState<any>(null);
  const [firepad, setFirepad] = useState<any>(null);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [md, setMd] = useState<Content[]>([]);
  const match = useRouteMatch<{ notepadId: string }>();

  const theme = "light";
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
    setFirebaseRef(getExampleRef(match.params.notepadId));
    console.log(`Loading notepad ${match.params.notepadId}`);
  }, [match.params.notepadId]);

  useEffect(() => {
    if (editorRef.current) {
      if (firepad) {
        firepad.dispose();
        editorRef.current.setValue("");
      }
      setFirepad(
        Firepad.fromMonaco(firebaseRef, editorRef.current, {
          defaultText: DEFAULT_EXAMPLE,
        })
      );
    }
  }, [editorRef.current, firebaseRef]);

  useEffect(() => {
    console.log(`New firepad instance`, firepad);
  }, [firepad]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.render(true);
    }
  }, [fullscreen]);

  const c = md.map(render);

  return (
    <div className={fullscreen ? "fullscreen" : ""}>
      {/* <div className="tools">
        {firebaseRef && <Users users={firebaseRef.child("users")} />}
      </div> */}
      <div className="editor">
        <Monaco
          theme={theme}
          language={language}
          loading={<div>Loading editor...</div>}
          value={""}
          editorDidMount={handleEditorDidMount}
          options={{ lineNumbers: "on", minimap: { enabled: false } }}
        />
      </div>
      <div className="content">
        <div className="content-bar">
          <UseAnimations
            animation={fullscreen ? skipForward : skipBack}
            size={32}
            wrapperStyle={{ margin: "8px" }}
            strokeColor="#586069"
            onClick={() => {
              setFullscreen(!fullscreen);
            }}
          />
        </div>
        <div className="scroll">
          <div className="markdown-body">{c}</div>
        </div>
      </div>
    </div>
  );
}
