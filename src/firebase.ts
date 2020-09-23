import app from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/analytics";
import future from "fp-future";

declare var globalConfig: { firebaseConfig: any };

export async function addFirebase() {
  app.initializeApp(globalConfig.firebaseConfig);
  app.analytics();

  await app.auth!().setPersistence(app.auth!.Auth.Persistence.LOCAL);

  await new Promise<any>((resolve, reject) => {
    const unsubscribe = app.auth!().onAuthStateChanged(
      (user: any) => {
        unsubscribe();
        resolve(user);
      },
      (e: any) => {
        console.error(e);
        reject("API Failed");
      }
    );
  });
}

export type NotebookOptions = {
  isPrivate: boolean;
  publicRead: boolean;
};

// Helper to get hash from end of URL or generate a random one.
export function newNotebook(userId: string, options: NotebookOptions) {
  const ref = app.database!().ref(`users/${userId}/notebooks`);
  const document = ref.push(); // generate unique location.

  document.child("meta/uid").set(userId, function (err) {
    if (err) console.log("error setting uid", err);
  });

  document.child("meta/title").set("Untitled notebook", function (err) {
    if (err) console.log("error setting titile2", err);
  });

  document.child("meta/sharing").set(
    {
      isPrivate: !!options.isPrivate,
      publicRead: !!options.publicRead,
    },
    function (err) {
      if (err) console.log("error setting sharing", err);
    }
  );

  if (typeof console !== "undefined" && process.env.NODE_ENV != "production") {
    console.log("Firebase data: ", document.toString());
  }

  return document;
}

export function openByHash(userId: string, notebookId: string) {
  return app.database!().ref().child(`users/${userId}/notebooks/${notebookId}`);
}

export function openByHashOld(currentRef: string) {
  return app.database!().ref().child(currentRef);
}

export function logEvent(event: string) {
  app.analytics!().logEvent(event as any);
}

export function logException(error: Error | string) {
  app.analytics!().logEvent("exception", {
    description: typeof error == "object" ? error.message : error,
    fatal: typeof error == "object",
  });
}

export function logPageView(page_location: string, page_path: string) {
  app.analytics!().logEvent("page_view", { page_location, page_path } as any);
}
declare var Firepad: any;

export async function newNotebookWithContent(
  content: string,
  options: NotebookOptions
) {
  const ret = future<{
    succeed: boolean;
    ref: app.database.Reference;
    data: any;
    owner: string;
  }>();
  let owner =
    (app.auth().currentUser && app.auth().currentUser!.uid) || "anonymous";

  const ref = newNotebook(owner, options);

  const headless = new Firepad.Headless(ref);

  headless.setText(content, function (data: any, succeed: boolean) {
    ret.resolve({ ref, data, succeed, owner });
  });

  return ret;
}

globalThis["firebase"] = app;
