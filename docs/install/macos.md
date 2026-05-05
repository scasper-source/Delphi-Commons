# macOS Install Notes

These notes assume Terminal or iTerm on macOS.

## Prerequisites

- Install Node.js 20 or later.
- Install Git.
- Xcode Command Line Tools may be needed for some development dependencies.

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

## macOS Notes

- If a port is already in use, stop the old process or use a different port.
- Keep local runtime data under `server/data/` private.
- Do not use real participant data in a local development checkout.

## Readiness Warning

This setup is for development and controlled synthetic mock trials only. It is not approved for real human-subjects data.
