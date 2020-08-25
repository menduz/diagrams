import { CodeBlock, Content, cheapMd } from "./cheapMd";
import { renderDotSVG } from "./components/Markdown";
import { parseDiagram, RenderDiagram, processSequenceLayout } from "./diagrams";
import ReactDOM from "react-dom";
import React from "react";
import { sanitizeSVG } from "./components/DownloadSvg";
import { download } from "./helpers";
declare var JSZip: any;

function generateImage(
  svgContent: string,
  original: CodeBlock,
  files: Map<string, string>,
  sectionName: string
): string {
  const sanitizedText = original
    .text!.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const path = `images/fig-${sectionName}-${files.size}.svg`;
  files.set(path, svgContent);

  return `\n<!--\n\`\`\`${
    original.language || ""
  }\n${sanitizedText}\n\`\`\`\n-->\n![${path}](${path})\n`;
}

async function renderCheapMd(
  $: Content,
  files: Map<string, string>,
  sectionName: string
): Promise<string> {
  if ($.type === "title") {
    switch ($.level) {
      case 1:
        return `\n# ${$.text}\n`;
      case 2:
        return `\n## ${$.text}\n`;
      case 3:
        return `\n### ${$.text}\n`;
      case 4:
        return `\n#### ${$.text}\n`;
      case 5:
        return `\n##### ${$.text}\n`;
      default:
        return `\n###### ${$.text}\n`;
    }
  } else if ($.type === "file") {
    return (
      (await renderCheapMd($.fileName, files, sectionName)) +
      (await renderCheapMd($.codeBlock, files, sectionName))
    );
  } else if ($.type === "code") {
    try {
      if ($.language == "dot") {
        return generateImage(
          await renderDotSVG($.text!),
          $,
          files,
          sectionName
        );
      }
      if ($.language == "sequence") {
        const dom = document.createElement("div");

        const tmpDiagram = parseDiagram($.text!);
        processSequenceLayout(tmpDiagram);

        ReactDOM.render(<RenderDiagram diagram={tmpDiagram} />, dom);
        const x = dom.querySelector("svg");

        return generateImage(sanitizeSVG(x!.outerHTML), $, files, sectionName);
      }
    } catch (e) {
      console.error(e);
    }

    return "```" + ($.language || "") + "\n" + $.text + "\n```\n";
  } else if ($.type === "text") {
    return "\n" + $.text + "\n";
  } else {
    return JSON.stringify($, null, 2);
  }
}

export async function downloadZip(md: string) {
  const files = new Map<string, string>();
  const parts = cheapMd(md);

  let rendered: string[] = [];

  let currentSection = 0;

  for (let part of parts) {
    if (part.type == "header") {
      currentSection++;
    }
    rendered.push(await renderCheapMd(part, files, currentSection.toString()));
  }

  files.set("index.md", rendered.join(""));

  const zipFile = new JSZip();

  for (let [k, v] of files) {
    zipFile.file(k, v);
  }

  const zipBlob = await zipFile.generateAsync({
    type: "blob",
  });

  download("export.zip", zipBlob, "application/zip");
}
