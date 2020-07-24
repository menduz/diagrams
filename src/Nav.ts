import { createHashHistory as createHistory } from "history";
import { logPageView } from "./firebase";

export const history = createHistory();

export function navigateTo(path: string, state?: any) {
  const location = {
    pathname: path,
    state: state || {},
  };

  if (history.location.pathname != location.pathname) {
    history.push(location);
  }
}

history.listen((e) => {
  logPageView(location.toString(), e.pathname);
});
