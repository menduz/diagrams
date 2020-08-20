import React, {
  useRef,
  useCallback,
  ReactNode,
  MouseEvent as ReactMouseEvent,
  useState,
  useEffect,
} from "react";
import { Avatar } from "./Avatar";
import firebase from "firebase/app";
import { useAuth } from "../Auth";

export function UserList(props: {
  documentRef: null | firebase.database.Reference;
}) {
  const authCtx = useAuth();
  const [users, setUsers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (props.documentRef) {
      setUsers({});
      const ref = props.documentRef.child("users");
      ref.on("value", (snap) => {
        setUsers(snap.toJSON() as any);
      });
      return () => {
        ref.off();
      };
    }
  }, [props.documentRef]);

  function RenderAvatar(props: { user: { color: string }; id: string }) {
    return (
      <div
        className="avatar tooltipped tooltipped-sw tooltipped-align-right-1"
        aria-label="Human"
        style={{
          height: 20,
          width: 20,
          background: props.user.color,
          // borderBottomWidth: 3,
          // borderBottomStyle: "solid",
          // borderBottomColor: props.user.color,
          overflow: "visible",
        }}
      />
    );

    /*<img
          className="avatar"
          height="20"
          alt="@octocat"
          src="https://user-images.githubusercontent.com/334891/29999089-2837c968-9009-11e7-92c1-6a7540a594d5.png"
          width="20"
        />*/
  }

  return (
    <div className="AvatarStack AvatarStack--three-plus AvatarStack--right d-inline-block flex-self-center">
      <div className="AvatarStack-body">
        {Object.keys(users).map(
          (userId) =>
            authCtx.uid != userId && (
              <Avatar userId={userId} className="tooltipped tooltipped-sw tooltipped-align-right-1" key={userId} />
            )
        )}
      </div>
    </div>
  );
}
