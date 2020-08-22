import app from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/analytics";

// Your web app's Firebase configuration
let firebaseConfig = {
  apiKey: "AIzaSyBhfoK4AFBLsruM0sDJ-sAFyksh4FqMpC8",
  authDomain: "diagrams-de8ed.firebaseapp.com",
  databaseURL: "https://diagrams-de8ed.firebaseio.com",
  projectId: "diagrams-de8ed",
  storageBucket: "diagrams-de8ed.appspot.com",
  messagingSenderId: "346071222923",
  appId: "1:346071222923:web:4d57d09e64ea7ed1ee628e",
  measurementId: "G-HLCQLCWE0G",
};

export async function addFirebase() {
  app.initializeApp(firebaseConfig);
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

// Helper to get hash from end of URL or generate a random one.
export function newNotebook(userId: string) {
  const ref = app.database!().ref(`users/${userId}/notebooks`);
  const document = ref.push(); // generate unique location.

  document.child("meta/uid").set(userId, function (err) {
    if (err) console.log("error setting uid", err);
  });

  document.child("meta/title").set("Untitled notebook", function (err) {
    if (err) console.log("error setting titile2", err);
  });

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

globalThis["firebase"] = app;
