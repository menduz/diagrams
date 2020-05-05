import { createHashHistory as createHistory } from "history";

export const history = createHistory();

export function navigateTo(path: string, state?: any) {
  const location = {
    pathname: path,
    state: state || {}
  };

  if (history.location.pathname != location.pathname) {
    history.push(location);
  }
}
