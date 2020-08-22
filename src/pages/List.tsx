import React, {
  useRef,
  useCallback,
  ReactNode,
  MouseEvent as ReactMouseEvent,
  useState,
  useEffect,
} from "react";
import { UserMenu } from "src/components/UserMenu";
import { useAuth } from "src/Auth";
import app from "firebase/app";

export function List() {
  const auth = useAuth();
  const [myNotebooks, setMyNotebooks] = useState<any>(null);

  useEffect(() => {
    if (auth.uid) {
      app
        .database()
        .ref("users/" + auth.uid + "/notebooks")
        .once("value", (snap) => {
          setMyNotebooks(snap.toJSON());
        });
    }
  }, [auth.uid]);

  if (!auth.uid) {
    return (
      <div className="p-11">
        Please sign in to see this page. <UserMenu />
      </div>
    );
  }

  return (
    <div className="content p-responsive" style={{ left: 0 }}>
      <div className="top-bar content-bar d-flex flex-justify-between">
        <div className="p-2 d-flex">
          <span className="flex-self-center">My notebooks</span>
        </div>

        <div className="p-2 d-flex">
          <UserMenu />
        </div>
      </div>
      <div className="scroll p-4">
        <div className="Subhead pt-4">
          <div className="Subhead-heading">My notebooks</div>
          <div className="Subhead-actions">
            <a href="#url" className="btn btn-sm btn-primary" role="button">
              New notebook
            </a>
          </div>
          <div className="Subhead-description">
            Here are the notebooks of your own.
          </div>
        </div>
        <pre>{JSON.stringify(myNotebooks, null, 2)}</pre>
        <div className="Subhead pt-4">
          <div className="Subhead-heading">Shared with me</div>
        </div>
      </div>
    </div>
  );
}
