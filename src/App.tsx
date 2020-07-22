import React from "react";
import { Router, Route, Switch } from "react-router-dom";
import { history, navigateTo } from "./Nav";
import { Editor } from "./Editor";
import { getExampleRef } from "./firebase";

function HomeScreen() {
  function newNotebook() {
    const ref = getExampleRef();
    navigateTo(`/editor/${ref}`);
  }

  return (
    <div className="home markdown-content">
      <button onClick={newNotebook}>Click here to create a new notebook</button>
    </div>
  );
}

export function App() {
  return (
    <>
      <Router history={history}>
        <Switch>
          <Route exact path="/editor/:notepadId">
            <Editor />
          </Route>
          <Route exact path="/static">
            <Editor readonly />
          </Route>
          <Route path="/">
            <HomeScreen />
          </Route>
        </Switch>
      </Router>
    </>
  );
}
