import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App";

export async function initUI(target: HTMLElement) {
  const loader = document.getElementById("loading-placeholder");

  if (loader) {
    loader.remove();
  }

  ReactDOM.render(<App />, target);
}
