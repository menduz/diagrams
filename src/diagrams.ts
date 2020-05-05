import { injectScript } from "./helpers"


declare var Diagram: any;

export async function initializeDiagrams(){
  await injectScript("bower_components/jquery/dist/jquery.min.js")
  await injectScript("bower_components/bower-webfontloader/webfont.js")
  await injectScript("bower_components/snap.svg/dist/snap.svg-min.js")
  await injectScript("bower_components/underscore/underscore-min.js")
  await injectScript("bower_components/js-sequence-diagrams/dist/sequence-diagram-min.js")
}

export function renderDiagram(container: HTMLElement, text: string) {
  var diagram = Diagram.parse(text);
  diagram.drawSVG(container, {theme: 'simple'});
}