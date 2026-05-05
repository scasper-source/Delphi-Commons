# Windows Install Notes

These notes assume PowerShell on Windows.

## Prerequisites

- Install Node.js 20 or later.
- Install Git for Windows.
- Use Edge, Chrome, or Firefox for local testing.

## Install

```powershell
cd C:\path\to\DelphiCommons
cd app
npm install
cd ..\server
npm install
```

## Run

Backend:

```powershell
cd server
npm run dev
```

Frontend in a second PowerShell window:

```powershell
cd app
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173/`.

## Windows Notes

- If a port is already in use, stop the old dev server or choose another port.
- If Vite cache files are locked, stop running Node processes and retry.
- Keep `server/data/` local and private.
- Do not use OneDrive/Dropbox sync conflict files as source files.

## Readiness Warning

This setup is for development and controlled synthetic mock trials only. It is not approved for real human-subjects data.
