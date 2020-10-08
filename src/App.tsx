import React from "react";
import {
  Router,
  Route,
  Switch,
  Redirect,
  useRouteMatch,
} from "react-router-dom";
import { history, navigateTo } from "./Nav";
import { Editor } from "./pages/Editor";
import { ProvideAuth, useAuth } from "./Auth";
import { List } from "./pages/List";

declare var homepageUrl: string

function Index() {
  const auth = useAuth();

  if (auth.uid) {
    return <Redirect to={"/list"} />;
  }

  return (
    <Redirect to={homepageUrl + "?open=true"} />
  );
}

function RedirectOldModel() {
  const match = useRouteMatch<{ notepadId: string }>();

  return <Redirect to={`/notebook/anonymous/${match.params.notepadId}`} />;
}

export function App() {
  return (
    <>
      <ProvideAuth>
        <Router history={history}>
          <Switch>
            <Route exact path="/notebook/:user/:notebook">
              <Editor newModel />
            </Route>
            <Route exact path="/editor/:notepadId">
              <RedirectOldModel />
            </Route>
            <Route exact path="/static">
              <Editor readonly />
            </Route>
            <Route path="/list">
              <List />
            </Route>
            <Route path="/">
              <Index />
            </Route>
          </Switch>
        </Router>
      </ProvideAuth>
    </>
  );
}
