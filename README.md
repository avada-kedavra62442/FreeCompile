# FreeCompile

FreeCompile is an offline-first coding studio built with React and Vite. It does not send source code to hosted compiler APIs or redirect execution to another browser IDE.

## Run locally

```bash
npm install
npm run dev
```

## Test and build

```bash
npm test
npm run build
```

GitHub Actions runs both checks on pushes and pull requests.

## What runs locally

- **HTML, CSS and JavaScript:** browser sandbox preview.
- **JSON:** local parsing and formatting.
- **Python:** an in-repository interpreter for expressions, variables, built-in numeric/string/list helpers, list indexing, `print`, `input`, `if/elif/else`, `for`, `range`, `while`, `break` and `continue`. It enforces an execution-step limit.
- **C, C++, C#, PHP and additional language workspaces:** small in-repository interpreters for documented common output patterns and simple values.
- **React / Next.js:** basic JSX-to-HTML preview for components returning intrinsic HTML elements.
- **Public GitHub project inspection:** used only when explicitly requested to read repository metadata/files; it is not a compiler or execution service.

## Honest compatibility limits

FreeCompile currently does **not** contain full native toolchains for C/C++, .NET/C#, PHP, Java, Rust, Go, or every other listed language. Its lightweight local cores are not full language specifications and do not provide every compiler version, standard library, package manager, or third-party library. The React/Next.js workspace is not a full Node.js/Next.js build environment. Unsupported code reports a limitation instead of being described as successfully compiled.

Full support for all language versions and arbitrary libraries would require bundling and maintaining the corresponding compilers/runtimes and library distributions locally; that is a substantially larger engineering and asset-packaging effort than a lightweight browser app. No external online compiler service is connected by this project.

Treat code execution as a learning sandbox, not a hardened security boundary for hostile source. The JavaScript preview uses a sandboxed iframe.


## GitHub Runner capabilities

The runner inspects a public repository tree (up to 1,000 entries), detects common language/framework manifests and likely entry points, summarizes npm scripts and dependencies, and lets users open supported source files in the editor. Pure static HTML projects can be previewed in a sandboxed iframe with supported relative CSS, JavaScript, and image assets fetched from the repository and inlined. File reads are limited to 1 MB per file and the preview attempts at most 30 local assets.

This is not a universal remote build system. React/Vite, Next.js, Node.js servers, package installation, Python virtual environments/packages, Docker, .NET, PHP frameworks, and native compiler projects are detected and inspected but cannot be claimed as fully running without their local toolchains. No hosted compiler or execution API is used.
