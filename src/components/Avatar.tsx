import React, {
  useRef,
  useCallback,
  ReactNode,
  MouseEvent as ReactMouseEvent,
  useState,
  useEffect,
} from "react";
import { GitHubUser, useAuth } from "../Auth";
import firebase from "firebase/app";

export function Avatar(props: {
  userId: string;
  className: string;
  color?: string;
  onClick?: any;
}) {
  const [userData, setUserData] = useState<null | GitHubUser>();
  const authCtx = useAuth();

  // Only see the users when we are logged in
  useEffect(() => {
    if (props.userId && authCtx.uid) {
      firebase
        .database()
        .ref()
        .child(`users/${props.userId}`)
        .once("value", function (owner: any) {
          console.log(owner.toJSON());
          setUserData(owner.toJSON());
        });
    }
  }, [props.userId]);

  if (!userData)
    return (
      <img
        className="avatar"
        height="20"
        width="20"
        title="anonymous"
        alt="anonymous"
        src="https://user-images.githubusercontent.com/334891/29999089-2837c968-9009-11e7-92c1-6a7540a594d5.png"
        onClick={props.onClick}
      />
    );

  return (
    <img
      className={`avatar avatar-small ${props.className}`}
      alt={userData.login}
      title={userData.login}
      aria-label={userData.login}
      src={`${userData.avatar_url}&s=40`}
      width="20"
      height="20"
      onClick={props.onClick}
    />
  );
}
