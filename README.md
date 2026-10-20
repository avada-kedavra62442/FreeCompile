# FreeCompile

FreeCompile is an offline-first coding studio built with React and Vite. It does not use a hosted compiler API or redirect code execution to StackBlitz or another browser IDE.

## Run locally

```bash
npm install
npm run dev
```

## Build and test

```bash
npm test
npm run build
```

## Execution model

- **HTML/CSS/JavaScript:** previewed in a sandboxed browser iframe.
- **JSON:** validated and formatted locally.
- **Python:** a small in-repo interpreter supports basic expressions, variables, `print`, `input`, simple conditionals and `range` loops.
- **C, C++, C#, PHP and additional languages:** in-repo offline output interpreters cover common starter-program patterns. They are not native compilers or complete implementations of those language specifications.
- **React/Next.js:** the in-repo JSX preview handles simple components that return intrinsic HTML tags. It is not the full React or Next.js module/build system.
- **GitHub repository inspection:** GitHub's API is used only when a user explicitly requests public-repository metadata/file-tree inspection. It is not used to compile or execute code.

## Important limits

The offline language cores are built into this repository and make no requests to online compiler services. They do **not** currently support every language feature, every historical/current compiler version, arbitrary third-party libraries, package installation, native binaries, or full-project builds. The UI reports unsupported syntax instead of claiming a real native compile succeeded. Full standards-compliant compilers/runtimes for all those ecosystems would require shipping and maintaining the respective toolchains and library distributions; this repository does not yet contain those complete toolchains.

All source-code execution supported by the studio happens in the browser; do not treat this as a hardened security boundary for hostile code. The JavaScript preview uses a sandboxed iframe.
