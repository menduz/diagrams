# How to create your own diagrams server?

1. Fork this repository, activate github pages, and set the CNAME
2. Create a Firebase realtime database. Paste the settings in `docs/index.html`
3. Set the rules of the realtime database, copy the rules from `firebase-rules.json`
4. In firebase, enable Github authentication.

You are all set. That is everything you need to run your own server.