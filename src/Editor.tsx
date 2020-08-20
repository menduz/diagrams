import Monaco, { monaco as tmonaco } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import React, { useState, useRef, useEffect } from "react";
import { useRouteMatch, useLocation } from "react-router-dom";
import { logEvent, openByHash, newNotebook } from "./firebase";
import { parseMD, Content } from "./md";
import { SequenceDiagram, monospaceFont } from "./diagrams";
import { DEFAULT_EXAMPLE } from "./example";
import { graphviz } from "@hpcc-js/wasm";
import { DropdownShare, closeMenu } from "./components/Dropdown";
import app from "firebase/app";
import {
  ShareAndroidIcon,
  LinkIcon,
  RepoForkedIcon,
  AlertIcon,
  LogoGistIcon,
  MarkGithubIcon,
} from "@primer/octicons-react";
import { copyTextToClipboard, generateStaticLink } from "./helpers";
import UseAnimations from "react-useanimations";
import skipBack from "react-useanimations/lib/skipBack";
import { navigateTo } from "./Nav";
import { DownloadSvg } from "./components/DownloadSvg";
import { useAuth, GitHubUser } from "./Auth";
import { ResizeableSidebar } from "./components/Resize";
import { UserList } from "./components/UserList";
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

function defaultExpandedSize() {
  return window.innerWidth * 0.3;
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

function UserMenu() {
  const auth = useAuth();

  console.log("auth", auth);

  if (!auth.data) {
    return (
      <>
        <details className="dropdown details-reset details-overlay d-inline-block mr-2">
          <summary aria-haspopup="true">
            <span
              className="btn btn-invisible user-name"
              style={{ color: "#000" }}
            >
              <span className="mr-2">Anonymous</span>
              <img
                className="avatar avatar-small"
                alt="Anonymous"
                src="https://user-images.githubusercontent.com/334891/29999089-2837c968-9009-11e7-92c1-6a7540a594d5.png"
                width="20"
                height="20"
                aria-label="Sign in"
              />
              <div className="dropdown-caret"></div>
            </span>
          </summary>

          <ul className="dropdown-menu dropdown-menu-sw">
            <li>
              <a
                className="dropdown-item"
                href={document.location.toString()}
                onClick={() => {
                  auth
                    .signin()
                    .then(() => closeMenu())
                    .catch(() => closeMenu());
                }}
              >
                <MarkGithubIcon size={16} className="mr-2" />
                <span>Sign in</span>
              </a>
            </li>
          </ul>
        </details>
      </>
    );
  }

  return (
    <>
      <details className="dropdown details-reset details-overlay d-inline-block mr-2">
        <summary aria-haspopup="true">
          <span
            className="btn btn-invisible user-name"
            style={{ color: "#000" }}
          >
            <span className="mr-2">{auth.data.user.displayName}</span>
            <img
              className="avatar avatar-small"
              alt={auth.data.user.displayName}
              src={`${auth.data.user.photoURL}&s=40`}
              width="20"
              height="20"
              aria-label={auth.data.user.displayName}
            />
            <div className="dropdown-caret"></div>
          </span>
        </summary>

        <ul className="dropdown-menu dropdown-menu-sw">
          <li>
            <a
              className="dropdown-item"
              href={document.location.toString()}
              onClick={() => {
                auth
                  .signout()
                  .then(() => closeMenu())
                  .catch(() => closeMenu());
              }}
            >
              <span>Sign out</span>
            </a>
          </li>
        </ul>
      </details>
    </>
  );
}

export function Editor(props: { readonly?: boolean }) {
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor>();
  const [firebaseRef, setFirebaseRef] = useState<any>(null);
  const [loadingCopy, setLoadingCopy] = useState<boolean>(false);
  const [loadingSave, setLoadingSave] = useState<boolean>(false);
  const [firepad, setFirepad] = useState<any>(null);
  const [md, setMd] = useState<Content[]>([]);
  const match = useRouteMatch<{ notepadId: string }>();
  const location = useLocation();
  const authCtx = useAuth();
  const [size, setSize] = useState(props.readonly ? 0 : defaultExpandedSize());
  const [staticContent, setStaticContent] = useState<string>();

  let theTitle: string | null = null;

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    setStaticContent(qs.get("t") || "");
    if (qs.has("open")) {
      setSize(defaultExpandedSize());
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
      if (!match.params.notepadId) debugger;
      const ref = openByHash(match.params.notepadId);
      console.dir(ref);
      console.log(ref.toString());
      setFirebaseRef(ref);
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

      theTitle = null;

      if (firepad) {
        firepad.dispose();
        editorRef.current.setValue("");
      }

      if (firebaseRef) {
        editorRef.current.setValue("");

        let options: any = {
          defaultText: DEFAULT_EXAMPLE,
        };

        if (authCtx.uid) {
          options.userId = authCtx.uid;
        }

        setFirepad(Firepad.fromMonaco(firebaseRef, editorRef.current, options));
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
    if (firepad && authCtx.uid) {
      firepad.setUserId(authCtx.uid);
    }
  }, [authCtx.data]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [size]);

  function makeCopy() {
    let owner =
      (app.auth().currentUser && app.auth().currentUser!.uid) || "anonymous";

    setLoadingCopy(true);

    const ref = newNotebook(owner);

    const val = editorRef.current!.getValue();

    const headless = new Firepad.Headless(ref);

    headless.setText(val, function (data: any, succeed: boolean) {
      setLoadingCopy(false);
      if (succeed) {
        logEvent("make_copy");
        setSize(defaultExpandedSize());
        navigateTo(`/editor/${ref.key}`);
      }
    });
  }

  let hadTitle = false;

  for (let elem of md) {
    if (elem.type == "title") {
      document.title = elem.text + " - Diagrams";
      theTitle = elem.text;
      hadTitle = true;
      break;
    }
  }

  if (!hadTitle) {
    document.title = "Untitled document - Diagrams";
  }

  const c = md.map(render);

  function copyReadOnlyLink() {
    copyTextToClipboard(
      generateStaticLink(editorRef.current!.getValue()!)
    ).then(() => {
      editorRef.current!.focus();
      logEvent("share_ro");
      closeMenu();
    });
  }

  function copyEditableLink() {
    copyTextToClipboard(document.location.toString()).then(() => {
      editorRef.current!.focus();
      logEvent("share_editable");
      closeMenu();
    });
  }

  function makeGist() {
    copyTextToClipboard(document.location.toString()).then(() => {
      editorRef.current!.focus();
      logEvent("share_editable");
      closeMenu();
    });
  }

  function MakeCopyMenu() {
    if (authCtx.uid) {
      return (
        <button
          className="btn tooltipped tooltipped-se mr-2"
          aria-label="Makes a copy"
          onClick={makeCopy}
          aria-disabled={!authCtx.uid}
        >
          <RepoForkedIcon size={16} />
          <span>
            Make a copy
            {loadingCopy && <span className="AnimatedEllipsis"></span>}
          </span>
        </button>
      );
    }

    return (
      <details className="dropdown details-reset details-overlay d-inline-block mr-2">
        <summary aria-haspopup="true">
          <span className={`btn`}>
            <RepoForkedIcon size={16} />
            Make a copy
            {loadingCopy && <span className="AnimatedEllipsis"></span>}
            <div className="dropdown-caret"></div>
          </span>
        </summary>

        <ul className="dropdown-menu dropdown-menu-se" style={{ width: 300 }}>
          <li>
            <a
              className="dropdown-item"
              onClick={async () => {
                setLoadingCopy(true);
                await authCtx.signin();
                makeCopy();
              }}
              href={document.location.toString()}
            >
              <MarkGithubIcon size={16} className="mr-2" />
              <span>Sign-in with GitHub</span>
            </a>
          </li>
          <li>
            <a
              className="dropdown-item"
              onClick={async () => {
                setLoadingCopy(true);
                makeCopy();
              }}
              href={document.location.toString()}
            >
              <span>Continue anonymously</span>
            </a>
          </li>
        </ul>
      </details>
    );
  }

  const [author, setAuthor] = useState<GitHubUser | null>(null);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    if (firebaseRef) {
      firebaseRef.child("meta").once("value", function (a: any) {
        setMeta(a || null);
      });

      if (theTitle) {
        firebaseRef.child("meta/title").set(theTitle, (err: Error) => {
          err && console.log("err, cant set meta");
        });
      }
    } else {
      setMeta(null);
    }
  }, [firebaseRef, theTitle]);

  useEffect(() => {
    if (meta) {
      app
        .database()
        .ref()
        .child(`users/${meta.child("uid").val()}`)
        .once("value", function (owner: any) {
          setAuthor(owner.toJSON());
        });
    }
  }, [meta]);

  return (
    <div className={size == 0 ? "fullscreen" : ""}>
      <ResizeableSidebar size={size} onResize={(n) => setSize(n)}>
        <div
          className="tools d-flex flex-justify-between"
          style={{ width: size }}
        >
          <div className="p-2 d-flex">
            {staticContent ? (
              <div className="flex-self-center ml-2">
                <span>{theTitle}</span>
              </div>
            ) : author ? (
              <>
                <img
                  className="avatar avatar-small m-2"
                  alt={author.login}
                  src={`${author.avatar_url}&s=40`}
                  width="20"
                  height="20"
                  aria-label={author.login}
                />
                <div className="flex-self-center">
                  <span
                    style={{
                      fontFamily: monospaceFont,
                    }}
                  >
                    {author.login}
                  </span>
                  {" / "}
                  <span>{theTitle}</span>
                </div>
              </>
            ) : (
              <>
                <img
                  className="avatar avatar-small m-2"
                  alt="anonymous"
                  src="https://user-images.githubusercontent.com/334891/29999089-2837c968-9009-11e7-92c1-6a7540a594d5.png"
                  width="20"
                  height="20"
                  aria-label="Sign in"
                />
                <div className="flex-self-center">
                  <span
                    style={{
                      fontFamily: monospaceFont,
                      fontWeight: "bold",
                    }}
                  >
                    anonymous
                  </span>
                  {" / "}
                  <span>{theTitle}</span>
                </div>
              </>
            )}
          </div>
          <div className="p-2">
            <MakeCopyMenu />
          </div>
          {/* {firebaseRef && <Users users={firebaseRef.child("users")} />} */}
        </div>
        <div className="editor" style={{ width: size }}>
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
                  This is a read-only page. Make a copy to edit the document.
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
              fontFamily: monospaceFont,
              // fontSize: 13,
              lineNumbers: "on",
              minimap: { enabled: false },
              readOnly: !!props.readonly,
              automaticLayout: true,
            }}
          />
        </div>
      </ResizeableSidebar>
      <div className="content" style={{ left: size + 5 }}>
        <div className="content-bar d-flex flex-justify-between">
          <div className="p-2">
            <button
              className="btn btn-octicon tooltipped tooltipped-se mr-2"
              aria-label="Show or hide the code editor."
              onClick={() => {
                setSize(size == 0 ? defaultExpandedSize() : 0);
              }}
            >
              <UseAnimations
                reverse={size == 0}
                animation={skipBack}
                size={24}
                strokeColor="#586069"
              />
            </button>

            {loadingSave && (
              <span className="m-1">
                <span>Saving</span>
                <span className="AnimatedEllipsis"></span>
              </span>
            )}
          </div>

          <div className="p-2 d-flex">
            <UserList documentRef={firebaseRef} />
            <DropdownShare label="Share" className="btn-invisible">
              {/* <li>
                <a
                  className="dropdown-item"
                  onClick={makeGist}
                  href={document.location.toString()}
                >
                  <MarkGithubIcon size={16} className="mr-2" />
                  <span>Create gist</span>
                </a>
              </li> */}
              <li>
                <a
                  className="dropdown-item"
                  onClick={copyReadOnlyLink}
                  href={document.location.toString()}
                >
                  <ShareAndroidIcon size={16} className="mr-2" />
                  <span>Copy read-only link</span>
                </a>
              </li>
              {props.readonly || (
                <li>
                  <a
                    className="dropdown-item"
                    onClick={copyEditableLink}
                    href={document.location.toString()}
                  >
                    <LinkIcon size={16} className="mr-2" />
                    <span>Share editable link</span>
                  </a>
                </li>
              )}
            </DropdownShare>

            <UserMenu />
          </div>
        </div>
        <div className="scroll">
          <div className="markdown-body">{c}</div>
        </div>
      </div>
    </div>
  );
}
