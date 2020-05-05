import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App";
import future from "fp-future";

export async function initUI(target: HTMLElement) {
  const loader = document.getElementById("loading-placeholder");

  if (loader) {
    const sleep = future<void>();
    setTimeout(sleep.resolve, 1000);
    await sleep;
    loader.remove();
  }

  ReactDOM.render(<App />, target);
}
