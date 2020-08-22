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
import { Link } from "react-router-dom";
import { navigateTo } from "src/Nav";

type Notebook = {
  meta: { title: string; uid: string };
};

function ListNotebooks(props: { data: Record<string, Notebook> }) {
  return (
    <div className="Box">
      {Object.keys(props.data).map(($id) => (
        <div key={$id} className="Box-row d-flex flex-items-center">
          <div className="flex-auto">
            <strong>
              <Link to={`/notebook/${props.data[$id].meta.uid}/${$id}`}>
                {props.data[$id].meta.title}
              </Link>
            </strong>
            {/* <div className="text-small text-gray-light">Description</div> */}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            name="button"
            onClick={() => {
              navigateTo(`/notebook/${props.data[$id].meta.uid}/${$id}`);
            }}
          >
            Open
          </button>
        </div>
      ))}
    </div>
  );
}

export function List() {
  const auth = useAuth();
  const [myNotebooks, setMyNotebooks] = useState<any>(null);

  document.title = "My notebooks - Sequence diagrams";

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
        {myNotebooks ? (
          <ListNotebooks data={myNotebooks} />
        ) : (
          <span className="m-1">
            <span>Loading</span>
            <span className="AnimatedEllipsis"></span>
          </span>
        )}
        {/* <div className="Subhead pt-4">
          <div className="Subhead-heading">Shared with me</div>
        </div> */}
      </div>
    </div>
  );
}
