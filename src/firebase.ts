import { injectScript } from "./helpers";

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

declare var firebase: any;

export async function addFirebase() {
  await injectScript(
    "https://www.gstatic.com/firebasejs/7.14.2/firebase-app.js"
  );
  await injectScript(
    "https://www.gstatic.com/firebasejs/7.14.2/firebase-analytics.js"
  );
  await injectScript(
    "https://www.gstatic.com/firebasejs/7.14.2/firebase-auth.js"
  );
  await injectScript(
    "https://www.gstatic.com/firebasejs/7.14.2/firebase-database.js"
  );

  firebase.initializeApp(firebaseConfig);
  firebase.analytics();

  await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

  await new Promise<any>((resolve, reject) => {
    const unsubscribe = firebase.auth().onAuthStateChanged(
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

export function setDocumentTitle(documentRef: Firebase, title: string) {
  documentRef.set({ title });
}

// Helper to get hash from end of URL or generate a random one.
export function newNotebook(userId: string): Firebase {
  const ref: Firebase = firebase.database().ref();
  const document = ref.push(); // generate unique location.

  document.child("meta").set({
    uid: userId,
    title: "Untitled notebook"
  });

  if (userId) {
    const docList = firebase.database().ref().child("user_notebooks/" + userId);
    docList.push(document.key);
  }

  if (typeof console !== "undefined") {
    console.log("Firebase data: ", document.toString());
  }

  return document;
}

export function openByHash(currentRef: string): Firebase {
  var ref: Firebase = firebase.database().ref();
  return ref.child(currentRef);
}

export function logEvent(event: string) {
  firebase.analytics().logEvent(event);
}

export function logException(error: Error | string) {
  firebase.analytics().logEvent("eventName", {
    description: typeof error == "object" ? error.message : error,
    fatal: typeof error == "object",
  });
}

export function logPageView(page_location: string, page_path: string) {
  firebase.analytics().logEvent("page_view", { page_location, page_path });
}
