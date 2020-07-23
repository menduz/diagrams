import future from "fp-future";

export async function injectScript(url: string) {
  const theFuture = future<Event>();
  const theScript = document.createElement("script");
  theScript.src = url;
  theScript.async = true;
  theScript.type = "application/javascript";
  theScript.addEventListener("load", theFuture.resolve);
  theScript.addEventListener("error", (e) =>
    theFuture.reject(e.error || (e as any))
  );
  document.body.appendChild(theScript);
  return theFuture;
}

export async function injectCss(url: string) {
  const theFuture = future<Event>();
  const theStyle = document.createElement("link");
  theStyle.href = url;
  theStyle.rel = "stylesheet";
  theStyle.addEventListener("load", theFuture.resolve);
  theStyle.addEventListener("error", (e) =>
    theFuture.reject(e.error || (e as any))
  );
  document.body.appendChild(theStyle);
  return theFuture;
}

function fallbackCopyTextToClipboard(text: string) {
  var textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand("copy");
    var msg = successful ? "successful" : "unsuccessful";
    console.log("Fallback: Copying text command was " + msg);
  } catch (err) {
    console.error("Fallback: Oops, unable to copy", err);
  }

  document.body.removeChild(textArea);
}
export async function copyTextToClipboard(text: string) {
  if (!navigator.clipboard) {
    return fallbackCopyTextToClipboard(text);
  }
  return navigator.clipboard.writeText(text).then(
    function () {
      console.log("Async: Copying to clipboard was successful!");
    },
    function (err) {
      console.error("Async: Could not copy text: ", err);
    }
  );
}

export function generateStaticLinkFragment(content: string) {
  return "/static?t=" + encodeURIComponent(content);
}

export function generateStaticLink(content: string) {
  return (
    document.location.protocol +
    "//" +
    document.location.host +
    "#" +
    generateStaticLinkFragment(content)
  );
}
