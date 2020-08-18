import React from "react";
import { Router, Route, Switch, Redirect } from "react-router-dom";
import { history, navigateTo } from "./Nav";
import { Editor } from "./Editor";
import { generateStaticLinkFragment } from "./helpers";
import { DEFAULT_EXAMPLE } from "./example";
import { ProvideAuth } from "./Auth";

export function App() {
  return (
    <>
      <ProvideAuth>
        <Router history={history}>
          <Switch>
            <Route exact path="/editor/:notepadId">
              <Editor />
            </Route>
            <Route exact path="/static">
              <Editor readonly />
            </Route>
            <Route path="/">
              <Redirect
                to={generateStaticLinkFragment(DEFAULT_EXAMPLE) + "&open=true"}
              />
            </Route>
          </Switch>
        </Router>
      </ProvideAuth>
    </>
  );
}
