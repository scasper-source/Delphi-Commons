# Linux Install Notes

These notes assume a recent Linux distribution with Bash.

## Prerequisites

- Install Node.js 20 or later.
- Install npm.
- Install Git.

On Debian/Ubuntu, use the NodeSource packages or another trusted Node.js distribution source if the system package is too old.

## Install

```bash
cd /path/to/DelphiCommons
cd app
npm install
cd ../server
npm install
```

## Run

Backend:

```bash
cd server
npm run dev
```

Frontend in a second terminal:

```bash
cd app
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173/`.

## Linux Notes

- If binding to `127.0.0.1` does not work in a container or VM, adjust host/port settings carefully.
- Keep local runtime data under `server/data/` private.
- Do not expose a development server to the public internet.

## Readiness Warning

This setup is for development and controlled synthetic mock trials only. It is not approved for real human-subjects data.
