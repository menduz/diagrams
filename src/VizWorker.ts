import future from "fp-future";

let requests = new Map<string, ReturnType<typeof renderGraphviz>>();
let id = 0;

let worker: Worker | null = null;
function ensureWorker(): Worker {
  if (worker) return worker;

  worker = new Worker("full.render.js");
  worker.addEventListener(
    "message",
    function (e) {
      if (typeof e.data.error !== "undefined") {
        requests.get(e.data.id)!.reject(new Error(e.data.error.message));
        worker!.terminate();
        worker = null;
      } else {
        requests.get(e.data.id)!.resolve(e.data.result);
      }
    },
    false
  );

  worker.addEventListener(
    "error",
    function (e) {
      debugger;
      console.dir(e);
      worker!.terminate();
    },
    false
  );

  return worker;
}

ensureWorker();

export function renderGraphviz(dot: string) {
  const ret = future<string>();
  const myId = (id++).toString();

  requests.set(myId, ret);

  var params = {
    src: dot,
    id: myId.toString(),
    options: {
      files: [],
      format: "svg",
      engine: "dot",
    },
  };

  ensureWorker().postMessage(params);

  return ret;
}
