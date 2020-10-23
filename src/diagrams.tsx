import { injectScript } from "./helpers";
import React, { useEffect, useRef, useState } from "react";
import { DownloadSvg } from "./components/DownloadSvg";

export const monospaceFont = `Menlo, Monaco, "Courier New", monospace`;

const font = `14px ${monospaceFont}`;

type Actor = {
  alias: string;
  name: string;
  index: number;
  distances: number[];
  paddingRight: number;
} & Rect;

type SignalSignal = {
  type: "Signal";
  actorA: Actor;
  actorB: Actor;
  linetype: number;
  arrowtype: number;
  message: string;
  placement: any;
  hasManyActors(): boolean;
  isSelf(): boolean;
} & Rect;
type SignalNote = {
  type: "Note";
  actor: Actor[] & Actor;
  message: string;
  placement: any;
  hasManyActors(): boolean;
  isSelf(): boolean;
} & Rect;

type Signal = SignalSignal | SignalNote;

type ParsedDiagram = {
  width: number;
  height: number;
  signals: Signal[];
  actors: Actor[];

  title?: string;
  title_?: Rect;
  actorsHeight_: number;
  signalsHeight_: number;
  drawSVG(element: HTMLElement, options: any): void;
};

type Rect = {
  width: number;
  height: number;
  x: number;
  y: number;

  textBB: any;
  message: string;
};

const DIAGRAM_MARGIN = 10;

const ACTOR_MARGIN = 10; // Margin around a actor
const ACTOR_PADDING = 10; // Padding inside a actor

const SIGNAL_MARGIN = 5; // Margin around a signal
const SIGNAL_PADDING = 5; // Padding inside a signal

const NOTE_MARGIN = 10; // Margin around a note
const NOTE_PADDING = 5; // Padding inside a note
const NOTE_OVERLAP = 15; // Overlap when using a "note over A,B"

const TITLE_MARGIN = 0;
const TITLE_PADDING = 5;

const SELF_SIGNAL_WIDTH = 20; // How far out a self signal goes

// const PLACEMENT = Diagram.PLACEMENT;
// const LINETYPE = Diagram.LINETYPE;
// const ARROWTYPE = Diagram.ARROWTYPE;

const ALIGN_LEFT = 0;
const ALIGN_CENTER = 1;
const ALIGN_HORIZONTAL_CENTER = 2;
const ALIGN_VERTICAL_CENTER = 3;

const can = document.createElement("canvas");
const ctx = can.getContext("2d");

function textBBox(text: string, fnt?: string) {
  if (fnt) ctx!.font = fnt;
  else ctx!.font = font;
  const r = ctx!.measureText(text);
  return {
    ...r,
    height: Math.ceil(r.actualBoundingBoxDescent + r.actualBoundingBoxAscent),
    width: Math.ceil(r.width),
  };
}

class AssertException extends Error {
  toString() {
    return "AssertException: " + this.message;
  }
}

function assert(exp: boolean, message: string): asserts exp {
  if (!exp) {
    throw new AssertException(message);
  }
}

export function processSequenceLayout(diagram: ParsedDiagram) {
  diagram.signalsHeight_ = 0;
  diagram.actorsHeight_ = 0;
  diagram.width = 0;
  diagram.height = 0;

  // Setup some layout stuff
  if (diagram.title) {
    diagram.title_ = {} as any;
    var title = diagram.title_!;
    var bb = textBBox(diagram.title);
    title.textBB = bb;
    title.message = diagram.title;

    title.width = bb.width + (TITLE_PADDING + TITLE_MARGIN) * 2;
    title.height = bb.height + (TITLE_PADDING + TITLE_MARGIN) * 2;
    title.x = DIAGRAM_MARGIN;
    title.y = DIAGRAM_MARGIN;

    diagram.width += title.width;
    diagram.height += title.height;
  }

  diagram.actors.forEach((a) => {
    var bb = textBBox(a.name);
    a.textBB = bb;

    a.x = 0;
    a.y = 0;
    a.width = bb.width + (ACTOR_PADDING + ACTOR_MARGIN) * 2;
    a.height = bb.height + (ACTOR_PADDING + ACTOR_MARGIN) * 2;

    a.distances = [];
    a.paddingRight = 0;
    diagram.actorsHeight_ = Math.max(a.height!, diagram.actorsHeight_ || 0) | 0;
  });

  function actorEnsureDistance(a: number, b: number, d: number) {
    assert(a < b, "a must be less than or equal to b");

    if (a < 0) {
      // Ensure b has left margin
      const actorB = diagram.actors[b];
      actorB.x = Math.max(d - actorB.width! / 2, actorB.x!) | 0;
    } else if (b >= diagram.actors.length) {
      // Ensure a has right margin
      const actorA = diagram.actors[a];
      actorA.paddingRight = Math.max(d, actorA.paddingRight || 0) | 0;
    } else {
      const actorA = diagram.actors[a];
      actorA.distances![b] =
        Math.max(d, actorA.distances![b] ? actorA.distances![b] : 0) | 0;
    }
  }

  diagram.signals.forEach((s) => {
    // Indexes of the left and right actors involved
    var a: number;
    var b: number;

    var bb = textBBox(s.message);

    s.textBB = bb;
    s.width = bb.width;
    s.height = bb.height;

    var extraWidth = 0;

    if (s.type == "Signal") {
      s.width! += (SIGNAL_MARGIN + SIGNAL_PADDING) * 2;
      s.height! += (SIGNAL_MARGIN + SIGNAL_PADDING) * 2;

      if (s.isSelf()) {
        // TODO Self signals need a min height
        a = s.actorA.index;
        b = a + 1;
        s.width! += SELF_SIGNAL_WIDTH;
      } else {
        a = Math.min(s.actorA.index, s.actorB.index);
        b = Math.max(s.actorA.index, s.actorB.index);
      }
    } else if (s.type == "Note") {
      s.width! += (NOTE_MARGIN + NOTE_PADDING) * 2;
      s.height! += (NOTE_MARGIN + NOTE_PADDING) * 2;

      // HACK lets include the actor's padding
      extraWidth = 2 * ACTOR_MARGIN;

      if (s.placement == Diagram.PLACEMENT.LEFTOF) {
        b = (s.actor as Actor).index;
        a = b - 1;
      } else if (s.placement == Diagram.PLACEMENT.RIGHTOF) {
        a = (s.actor as Actor).index;
        b = a + 1;
      } else if (s.placement == Diagram.PLACEMENT.OVER && s.hasManyActors()) {
        // Over multiple actors
        a = Math.min(s.actor[0].index, s.actor[1].index);
        b = Math.max(s.actor[0].index, s.actor[1].index);

        // We don't need our padding, and we want to overlap
        extraWidth = -(NOTE_PADDING * 2 + NOTE_OVERLAP * 2);
      } else if (s.placement == Diagram.PLACEMENT.OVER) {
        // Over single actor
        a = s.actor.index;
        actorEnsureDistance(a - 1, a, s.width! / 2);
        actorEnsureDistance(a, a + 1, s.width! / 2);
        diagram.signalsHeight_! += s.height!;

        return; // Bail out early
      }
    }

    actorEnsureDistance(a!, b!, s.width! + extraWidth);
    diagram.signalsHeight_! += s.height!;
  });

  // Re-jig the positions
  var actorsX = 0;
  diagram.actors.forEach((a) => {
    a.x = Math.max(actorsX, a.x!);

    // TODO This only works if we loop in sequence, 0, 1, 2, etc
    a.distances!.forEach((distance, ix) => {
      // lodash (and possibly others) do not like sparse arrays
      // so sometimes they return undefined
      if (typeof distance == "undefined") {
        return;
      }

      const b = diagram.actors[ix];
      distance = Math.max(distance, a.width! / 2, b.width! / 2) | 0;
      b.x = Math.max(b.x!, a.x! + a.width! / 2 + distance - b.width! / 2) | 0;
    });

    actorsX = a.x + a.width! + a.paddingRight!;
  });

  diagram.width = Math.max(actorsX, diagram.width);

  // TODO Refactor a little
  diagram.width += 2 * DIAGRAM_MARGIN;
  diagram.height +=
    2 * DIAGRAM_MARGIN + 2 * diagram.actorsHeight_ + diagram.signalsHeight_;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

declare class ParseError extends Error {
  loc: any;
}

declare var Diagram: {
  parse(text: string): ParsedDiagram;
  ParseError: typeof ParseError;
  PLACEMENT: any;
  LINETYPE: any;
  ARROWTYPE: any;
};

(window as any)["Snap"] = {};

export async function initializeDiagrams() {
  await injectScript("bower_components/underscore/underscore-min.js");
  await injectScript(
    "bower_components/js-sequence-diagrams/dist/sequence-diagram-min.js"
  );
  await injectScript("bower_components/jszip/jszip.min.js");
}

export function parseDiagram(txt: string) {
  return Diagram.parse(txt.trim().replace(/^sequenceDiagram[\s\n\r]*/, ""));
}

function Line($: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  linetype?: any;
  arrowhead?: any;
}) {
  return (
    <line
      x1={$.x1 | 0}
      x2={$.x2 | 0}
      y1={$.y1 | 0}
      y2={$.y2 | 0}
      style={{ strokeWidth: "2px" }}
      stroke="#000000"
      fill="none"
      strokeDasharray={
        $.linetype === undefined
          ? undefined
          : $.linetype === Diagram.LINETYPE.DOTTED
          ? "6px, 2px"
          : undefined
      }
      markerEnd={
        $.arrowhead === undefined
          ? undefined
          : $.arrowhead == Diagram.ARROWTYPE.FILLED
          ? "url(#markerArrowBlock)"
          : "url(#markerArrowOpen)"
      }
    ></line>
  );
}
function Rect($: { x: number; y: number; width: number; height: number }) {
  return (
    <rect
      x={$.x | 0}
      y={$.y | 0}
      width={$.width | 0}
      height={$.height | 0}
      style={{ strokeWidth: "2px" }}
      stroke="#000000"
      fill="#ffffff"
    ></rect>
  );
}
/**
 * Draws text with a optional white background
 * x,y (int) x,y top left point of the text, or the center of the text (depending on align param)
 * text (string) text to print
 * font (Object)
 * align (string) ALIGN_LEFT, ALIGN_CENTER, ALIGN_HORIZONTAL_CENTER or ALIGN_VERTICAL_CENTER
 */
function Text($: {
  x: number;
  y: number;
  text: string;
  font: string;
  align: number;
}) {
  var bb = textBBox($.text, $.font);

  var x = $.x;
  var y = $.y;

  if ($.align == ALIGN_CENTER || $.align == ALIGN_HORIZONTAL_CENTER) {
    x = x - bb.width / 2;
  }
  if ($.align == ALIGN_CENTER || $.align == ALIGN_VERTICAL_CENTER) {
    y = y - bb.height / 2;
  }

  y = y + bb.height;

  return (
    <text x={x | 0} y={y | 0} style={{ font: $.font }} textAnchor="start">
      <tspan x={x | 0} y={y | 0}>
        {$.text}
      </tspan>
    </text>
  );
}

function getCenterX(box: Rect) {
  return box.x + box.width / 2;
}

function getCenterY(box: Rect) {
  return box.y + box.height / 2;
}

function TextBox($: {
  box: Rect;
  text: string;
  margin: number;
  padding: number;
  font: string;
  align: number;
}) {
  var x = $.box.x + $.margin;
  var y = $.box.y + $.margin;
  var w = $.box.width - 2 * $.margin;
  var h = $.box.height - 2 * $.margin;

  // Draw inner box
  const rect = <Rect x={x} y={y} width={w} height={h} />;
  // Draw text (in the center)
  if ($.align == ALIGN_CENTER) {
    x = getCenterX($.box);
    y = getCenterY($.box);
  } else {
    x += $.padding;
    y += $.padding;
  }

  return (
    <>
      {rect}
      <Text x={x} y={y} text={$.text} font={$.font} align={$.align} />
    </>
  );
}

function ActorSVG($: {
  actor: Actor;
  offsetY: number;
  height: number;
  font: string;
}) {
  $.actor.y = $.offsetY;
  $.actor.height = $.height;
  return (
    <TextBox
      box={$.actor}
      text={$.actor.name}
      margin={ACTOR_MARGIN}
      padding={ACTOR_PADDING}
      font={$.font}
      align={ALIGN_CENTER}
    />
  );
}

export function RenderDiagram(props: {
  diagram: ParsedDiagram | null;
  source: string;
}) {
  const { diagram: $ } = props;
  if (!$) return <div>Empty diagram</div>;

  var offsetY = 0;

  const elems: any[] = [];

  function drawSelfSignal(signal: SignalSignal) {
    assert(signal.isSelf(), "signal must be a self signal");

    var textBB = signal.textBB;
    var aX = getCenterX(signal.actorA);

    var y1 = offsetY + SIGNAL_MARGIN + SIGNAL_PADDING;
    var y2 = y1 + signal.height - 2 * SIGNAL_MARGIN - SIGNAL_PADDING;

    // Draw three lines, the last one with a arrow
    elems.push(
      <Line
        x1={aX}
        y1={y1}
        x2={aX + SELF_SIGNAL_WIDTH}
        y2={y1}
        linetype={signal.linetype}
        key={elems.length}
      />
    );
    elems.push(
      <Line
        x1={aX + SELF_SIGNAL_WIDTH}
        y1={y1}
        x2={aX + SELF_SIGNAL_WIDTH}
        y2={y2}
        linetype={signal.linetype}
        key={elems.length}
      />
    );
    elems.push(
      <Line
        x1={aX + SELF_SIGNAL_WIDTH}
        y1={y2}
        x2={aX}
        y2={y2}
        linetype={signal.linetype}
        arrowhead={signal.arrowtype}
        key={elems.length}
      />
    );

    // Draw text
    var x = aX + SELF_SIGNAL_WIDTH + SIGNAL_PADDING;
    var arrowHeight = y2 - y1;
    var emptyVerticalSpace = arrowHeight - textBB.height;
    var topPadding = emptyVerticalSpace / 2;

    elems.push(
      <Text
        x={x}
        y={y1 + topPadding}
        text={signal.message}
        font={font}
        align={ALIGN_LEFT}
        key={elems.length}
      />
    );
  }

  function drawSignal(signal: SignalSignal) {
    var aX = getCenterX(signal.actorA);
    var bX = getCenterX(signal.actorB);

    // Mid point between actors
    var x = (bX - aX) / 2 + aX;
    var y = offsetY + SIGNAL_MARGIN + SIGNAL_PADDING;

    // Draw the text in the middle of the signal
    elems.push(
      <Text
        x={x}
        y={y}
        text={signal.message}
        font={font}
        align={ALIGN_HORIZONTAL_CENTER}
        key={elems.length}
      />
    );

    // Draw the line along the bottom of the signal
    // Padding above, between message and line
    // Margin below the line, between line and next signal
    y = offsetY + signal.height - SIGNAL_PADDING;
    elems.push(
      <Line
        x1={aX}
        y1={y}
        x2={bX}
        y2={y}
        linetype={signal.linetype}
        arrowhead={signal.arrowtype}
        key={elems.length}
      />
    );
  }

  function drawNote(note: SignalNote) {
    note.y = offsetY;
    var actorA = note.hasManyActors() ? note.actor[0] : note.actor;
    var aX = getCenterX(actorA);
    switch (note.placement) {
      case Diagram.PLACEMENT.RIGHTOF:
        note.x = aX + ACTOR_MARGIN;
        break;
      case Diagram.PLACEMENT.LEFTOF:
        note.x = aX - ACTOR_MARGIN - note.width;
        break;
      case Diagram.PLACEMENT.OVER:
        if (note.hasManyActors()) {
          var bX = getCenterX(note.actor[1]);
          var overlap = NOTE_OVERLAP + NOTE_PADDING;
          note.x = Math.min(aX, bX) - overlap;
          note.width = Math.max(aX, bX) + overlap - note.x;
        } else {
          note.x = aX - note.width / 2;
        }
        break;
      default:
        throw new Error("Unhandled note placement: " + note.placement);
    }
    elems.push(
      <TextBox
        box={note}
        text={note.message}
        margin={NOTE_MARGIN}
        padding={NOTE_PADDING}
        font={font}
        align={ALIGN_LEFT}
        key={elems.length}
      />
    );
  }

  $.actors.map(function (a) {
    // Top box
    elems.push(
      <ActorSVG
        actor={a}
        offsetY={offsetY}
        height={$.actorsHeight_}
        font={font}
        key={elems.length}
      />
    );

    // Bottom box
    elems.push(
      <ActorSVG
        actor={a}
        offsetY={offsetY + $.actorsHeight_ + $.signalsHeight_}
        height={$.actorsHeight_}
        font={font}
        key={elems.length}
      />
    );

    // Veritical line
    var aX = getCenterX(a);
    elems.push(
      <Line
        x1={aX}
        y1={offsetY + $.actorsHeight_ - ACTOR_MARGIN}
        x2={aX}
        y2={offsetY + $.actorsHeight_ + ACTOR_MARGIN + $.signalsHeight_}
        key={elems.length}
      />
    );
  });

  offsetY += $.actorsHeight_;

  $.signals.forEach(function (s) {
    // TODO Add debug mode, that draws padding/margin box
    if (s.type == "Signal") {
      if (s.isSelf()) {
        drawSelfSignal(s);
      } else {
        drawSignal(s);
      }
    } else if (s.type == "Note") {
      drawNote(s);
    }

    offsetY += s.height;
  });

  return (
    <DownloadSvg>
      <svg
        width={$.width | 0}
        height={$.height | 0}
        xmlns="http://www.w3.org/2000/svg"
        x-original-source={props.source}
      >
        <defs>
          <marker
            viewBox="0 0 5 5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
            refX="5"
            refY="2.5"
            id="markerArrowBlock"
          >
            <path d="M 0 0 L 5 2.5 L 0 5 z"></path>
          </marker>
          <marker
            viewBox="0 0 9.6 16"
            markerWidth="4"
            markerHeight="16"
            orient="auto"
            refX="9.6"
            refY="8"
            id="markerArrowOpen"
          >
            <path d="M 9.6,8 1.92,16 0,13.7 5.76,8 0,2.286 1.92,0 9.6,8 z"></path>
          </marker>
        </defs>
        {elems}
      </svg>
    </DownloadSvg>
  );
}

export function SequenceDiagram(props: { input: string; className?: string }) {
  const { input, className } = props;
  const divRef = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [error, setError] = useState<null | string>(null);
  const [diagram, setDiagram] = useState<ParsedDiagram | null>(null);

  useEffect(() => {
    try {
      const tmpDiagram = parseDiagram(
        input.trim().replace(/^sequenceDiagram[\s\n\r]*/, "")
      );
      processSequenceLayout(tmpDiagram);
      setWidth(tmpDiagram.width);
      setHeight(tmpDiagram.height);
      setError(null);
      setDiagram(tmpDiagram);
    } catch (e) {
      setError(e.toString());
    }
  }, [input, divRef]);

  if (!error) {
    return (
      <div
        className={className}
        style={{ width, height: height + 32 /* download button height */ }}
        ref={divRef}
      >
        <RenderDiagram diagram={diagram} source={input} />
      </div>
    );
  } else {
    return <pre className={className}>{error}</pre>;
  }
}
