import React, { useRef, ReactNode } from "react";
import { DownloadIcon } from "@primer/octicons-react";
import { download } from "src/helpers";



export function sanitizeSVG(original: string): string {
  let ret = "";
  if (!original.includes("<?xml")) {
    ret = `<?xml version="1.0" encoding="UTF-8"?>\n` + ret;
  }
  if (!original.includes("<!DOCTYPE svg")) {
    ret =
      ret +
      `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n`;
  }
  return ret + original;
}

export function DownloadSvg(
  props:
    | { children: ReactNode[] | ReactNode }
    | { dangerouslySetInnerHTML: any }
) {
  const theRef = useRef<HTMLDivElement | null>(null);

  function dl() {
    const pre =
      "children" in props
        ? '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n'
        : "";

    download("diagram.svg", pre + theRef.current!.innerHTML, "image/svg+xml");
  }

  return (
    <>
      {"dangerouslySetInnerHTML" in props ? (
        <div
          ref={theRef}
          dangerouslySetInnerHTML={props.dangerouslySetInnerHTML}
        />
      ) : (
        <div ref={theRef}>{props.children}</div>
      )}
      <button
        className="btn btn-sm btn-link"
        onClick={dl}
        style={{ fontSize: 12 }}
      >
        <DownloadIcon size={16} />
        Download SVG
      </button>
    </>
  );
}
