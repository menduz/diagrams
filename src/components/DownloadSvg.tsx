import React, { useRef, ReactNode } from "react";
import { DownloadIcon } from "@primer/octicons-react";

function download(filename: string, text: string) {
  var element = document.createElement("a");

  element.setAttribute(
    "href",
    URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }))
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function DownloadSvg(
  props:
    | { children: ReactNode[] | ReactNode }
    | { dangerouslySetInnerHTML: any }
) {
  const theRef = useRef<HTMLDivElement | null>(null);

  function dl() {
    const pre =
      "children" in props ? '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' : "";

    download("diagram.svg", pre + theRef.current!.innerHTML);
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
