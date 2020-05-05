import future from "fp-future";

export async function injectScript(url: string) {
  const theFuture = future<Event>();
  const theScript = document.createElement("script");
  theScript.src = url;
  theScript.async = true;
  theScript.type = "application/javascript";
  theScript.addEventListener("load", theFuture.resolve);
  theScript.addEventListener("error", (e) => theFuture.reject(e.error || e as any));
  document.body.appendChild(theScript);
  return theFuture;
}

export async function injectCss(url: string) {
  const theFuture = future<Event>();
  const theStyle = document.createElement("link");
  theStyle.href = url;
  theStyle.rel = "stylesheet";
  theStyle.addEventListener("load", theFuture.resolve);
  theStyle.addEventListener("error", (e) => theFuture.reject(e.error || e as any));
  document.body.appendChild(theStyle);
  return theFuture;
}
