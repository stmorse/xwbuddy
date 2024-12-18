# crossword buddy

This is the public code repository for the **Crossword Buddy** app currently live here:

[https://stmorse.github.io/xwbuddy](https://stmorse.github.io/xwbuddy)  

**The Buddy is designed to help new crossword solvers by providing alternative clues and hints, instead of just revealing letters or entire words.**

In order to have bespoke generated hints for 80+ clues every day, the "Buddy" is in reality a Large Language Model (LLM).  Currently, I'm using [Llama 3.1 (70B)](https://huggingface.co/meta-llama/Llama-3.1-70B) and some custom prompting, running on a private server.  I'm pretty impressed with its output, although it definitely spits out some clunkers occasionally, needs work on crossword etiquette (e.g. it likes to use quotes when they're not appropriate), etc.

This is currently an open-source project, and always open to feedback and/or collaboration opportunities. :)

Happy puzzling!
