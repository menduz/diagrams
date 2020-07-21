import { initUI } from "./ui";
import { addFirebase } from "./firebase";
import { addFirepad } from "./firepad";
import { initializeDiagrams } from "./diagrams";

async function main() {
  await addFirebase();
  await addFirepad();
  await initializeDiagrams();
  initUI(document.getElementById("app")!);
}

main().catch((e) => {
  console.error(e);
});
