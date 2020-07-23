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
// Helper to get hash from end of URL or generate a random one.
export function getExampleRef(currentRef?: string) {
  var ref = firebase.database().ref();
  if (currentRef) {
    ref = ref.child(currentRef);
  } else {
    ref = ref.push(); // generate unique location.
  }
  if (typeof console !== "undefined") {
    console.log("Firebase data: ", ref.toString());
  }
  return ref;
}
