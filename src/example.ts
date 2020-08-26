export const DEFAULT_EXAMPLE = `
# Collaborative diagrams tool

## This editor works with live collaboration, like Google Docs

Once you get an editable link, you can share it, and multiple users can edit the same document.

We use it for architecture discussions and planning with my team, it helps a lot because now that all of us are remote.

## How to use it?

1. Click in "Make a copy" in the top bar
2. Edit the document created for you! Share the link to start collaborating.

## What can we do with this tool?

### Sequence diagrams

\`\`\`sequence
Alice->Bob: Says Hello
Note right of Bob: Bob thinks about it
Bob-->Alice: How are you?
Alice->>Bob: I am good thanks!
\`\`\`

### Graphviz

\`\`\`dot
digraph G {

	subgraph cluster_0 {
		style=filled;
		color=lightgrey;
		node [style=filled,color=white];
		a0 -> a1 -> a2 -> a3;
		label = "process #1";
	}

	subgraph cluster_1 {
		node [style=filled];
		b0 -> b1 -> b2 -> b3;
		label = "process #2";
		color=blue
	}
	start -> a0;
	start -> b0;
	a1 -> b3;
	b2 -> a3;
	a3 -> a0;
	a3 -> end;
	b3 -> end;

	start [shape=Mdiamond];
	end [shape=Msquare];
}
\`\`\`

### This is another title with a sequence diagram

\`\`\`sequence
Title: Here is a title
A->B: Normal line
B-->C: Dashed line
C->>D: Open arrow
D-->>A: Dashed open arrow
\`\`\`

### Add notes

\`\`\`sequence
# Example of a comment.
Note left of A: Note to the left of A
Note right of A: Note to the right of A
Note over A: Note over A
Note over A,B: Note over both A and B
\`\`\`

### Specify participants

\`\`\`sequence
participant C
participant B
participant A
Note right of A: By listing the participants you can change their order
\`\`\`

### Code example:

\`\`\`javascript
// this example generates a static link to use with this site

const content = "# this is a title\\n .. put sequences, .dot files or markdown in here ..";

function generateStaticLink(content) {
  return \`https://diagrams.menduz.com/#/static?t=\${encodeURIComponent(content)}\`;
}

console.log(generateStaticLink(content));
\`\`\`

### Attributions

- Sequence diagrams parser & syntax: https://bramp.github.io/js-sequence-diagrams/
- Firepad: https://github.com/FirebaseExtended/firepad

### Contact & feedback

You can contact me on https://twitter.com/@menduz

### Help me pay the hosting

If you want to help with the expenses of the site, here is my Ethereum address, anything you send is more than welcome:

\`\`\`
menduz.eth - 0xf2f58ed9Ab3057838d88D06be8269270cDc8Aa89
\`\`\`

Thanks and enjoy!

`