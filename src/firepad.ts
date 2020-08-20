import { injectScript, injectCss } from "./helpers";

export async function addFirepad() {
  await injectScript(
    process.env.NODE_ENV == "production"
      ? "firepad/firepad.min.js"
      : "firepad/firepad.js"
  );
  await injectCss("firepad/firepad.css");
}
