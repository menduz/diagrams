export const DEFAULT_EXAMPLE = `
# This is a title

## This is a sequence diagram

Use them as markdown codw with "sequence" as language.

\`\`\`sequence
Andrew->China: Says Hello
Note right of China: China thinks about it
China-->Andrew: How are you?
Andrew->>China: I am good thanks!
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

\`\`\`csharp
using BenchmarkDotNet.Running;

namespace Google.Protobuf.Benchmarks
{
    class Program
    {
        // typical usage: dotnet run -c Release -f netcoreapp2.1
        // (this can profile both .net core and .net framework; for some reason
        // if you start from "-f net461", it goes horribly wrong)
        public static void Main(string[] args)
        {
            BenchmarkSwitcher.FromAssembly(typeof(Program).Assembly).Run(args);
        }
    }
}
\`\`\`
`