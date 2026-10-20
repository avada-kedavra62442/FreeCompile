# FreeCompile

FreeCompile is an offline-first coding studio built with React and Vite.

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
- **Python:** embedded Pyodide/WebAssembly CPython runtime; standard-library imports such as `import os` are supported.
- **React / Next.js:** basic JSX-to-HTML preview only, not a complete React or Next.js build/runtime.
- **Other listed languages:** current in-repository language cores recognize limited syntax; they are not full compiler toolchains and cannot run arbitrary valid programs.

## Compatibility limits
FreeCompile does **not** yet contain full native toolchains for C/C++, .NET/C#, PHP, Java, Rust, Go, or every other listed language. It does not provide every standard library, package manager, or third-party dependency. A complete implementation requires genuine compiler/runtime toolchains, which are not included in this browser-only deployment.

The Git/GitHub project-import feature has been removed. Do not treat a browser sandbox as a hardened security boundary for hostile code.

## App icons
PNG Apple touch icons are included at 120, 152, 167, 180, and 1024 pixels, plus the default Apple touch icon.
