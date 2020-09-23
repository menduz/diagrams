import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  Context,
} from "react";

import { logEvent, logException } from "./firebase";
import app from "firebase/app";
import "firebase/database";
import "firebase/auth";

const authContext: Context<ReturnType<
  typeof useProvideAuth
>> = (createContext as any)();

// Provider component that wraps your app and makes auth object ...
// ... available to any child component that calls useAuth().
export function ProvideAuth(props: { children: any | any[] }) {
  const auth = useProvideAuth();
  return (
    <authContext.Provider value={auth}>{props.children}</authContext.Provider>
  );
}

// Hook for child components to get the auth object ...
// ... and re-render when it changes.
export const useAuth = () => {
  return useContext(authContext);
};

export type FirebaseUser = {
  uid: string;
  displayName: string;
  photoURL: string;
  isAnonymous: boolean;
};

export type GitHubUser = {
  avatar_url: string;
  bio: string | null;
  blog: string;
  company: string;
  created_at: string;
  email: string;
  followers: number;
  following: number;
  gravatar_id: string;
  id: number;
  location: string | null;
  login: string;
  name: string;
  node_id: string;
  public_gists: number;
  public_repos: number;
  site_admin: false;
  twitter_username: string;
  type: string;
  updated_at: string;
  url: string;
};

export type AuthData = {
  user: app.User;
};

function storeCredential(key: string, credential: string) {
  localStorage.setItem(key + "_key", credential);
}

function loadCredential(key: string): string | null {
  return localStorage.getItem(key + "_key");
}

// Provider hook that creates auth object and handles state
function useProvideAuth() {
  const [data, setData] = useState<AuthData | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  var provider = new app.auth.GithubAuthProvider();
  provider.addScope("gist");

  function clearAuth() {
    setData(null);
    setUid(null);
    localStorage.clear();
  }

  // Wrap any Firebase methods we want to use making sure ...
  // ... to save the user to state.
  const signin = async () => {
    setLoading(true);

    return app
      .auth()
      .signInWithPopup(provider)
      .then((response) => {
        if (response.credential && response.user) {
          if (
            response.additionalUserInfo &&
            response.additionalUserInfo.providerId == "github.com"
          ) {
            const data = response.additionalUserInfo.profile as GitHubUser;
            app
              .database()
              .ref()
              .child("users/" + response.user.uid + "/profile")
              .set({
                login: data.login,
                id: data.id,
                name: data.name,
                avatar_url: data.avatar_url,
              });
          }
        }
        logEvent("sign_in");

        const r = gotUser(response.user!, true);
        r.then(() => setLoading(false));
        return r;
      })
      .catch((e: Error) => {
        logEvent("cancel_signin");
        setLoading(false);
        logException(e);
      });
  };

  const signout = async () => {
    return app
      .auth()
      .signOut()
      .then(() => {
        logEvent("sign_out");
        clearAuth();
        location.reload();
      });
  };

  async function gotUser(user: app.User, refresh = false) {
    setUid(user.uid);
    setData({ user });
    return user;
  }

  // Subscribe to user on mount
  // Because this sets state in the callback it will cause any ...
  // ... component that utilizes this hook to re-render with the ...
  // ... latest auth object.
  useEffect(() => {
    const unsubscribe = app.auth().onAuthStateChanged((user: any) => {
      if (user) {
        gotUser(user);
      } else {
        clearAuth();
      }
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Return the user object and auth methods
  return {
    uid,
    data,
    signin,
    signout,
    loading,
  };
}
