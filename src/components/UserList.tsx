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

  return (
    <div className="AvatarStack AvatarStack--three-plus AvatarStack--right d-inline-block flex-self-center">
      <div className="AvatarStack-body">
        {Object.keys(users || {}).map(
          (userId) =>
            authCtx.uid != userId && (
              <Avatar userId={userId} className="tooltipped tooltipped-sw tooltipped-align-right-1" key={userId} />
            )
        )}
      </div>
    </div>
  );
}
