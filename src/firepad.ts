import { injectScript, injectCss } from "./helpers";

export async function addFirepad() {
  await injectScript(
    "firepad/firepad.min.js"
  );
  await injectCss("firepad/firepad.css");
}
