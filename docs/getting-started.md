# Getting Started

This guide gets Delphi Commons running locally for development and controlled synthetic mock-trial rehearsal.

Do not use a local development checkout for real human-subjects studies. Local data, consent records, identity mappings, audit logs, and exports are not production-hardened.

## 1. Install Prerequisites

- Install Node.js 20 or later.
- Install npm.
- Install Git if you plan to clone or contribute.

Delphi Commons does not currently provide a root-level npm workspace command. Run install, build, test, and development commands from `app/` and `server/`.
- Use a modern browser such as Edge, Chrome, Firefox, or Safari.

## 2. Install Dependencies

Frontend:

```powershell
cd app
npm install
```

Backend:

```powershell
cd ../server
npm install
```

## 3. Start The Backend

```powershell
cd server
npm run dev
```

The backend normally listens on `http://127.0.0.1:3001`. Check:

```text
http://127.0.0.1:3001/health
```

## 4. Start The Frontend

Open a second terminal:

```powershell
cd app
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173/
```

## 5. Run Tests

```powershell
cd app
npm test
```

```powershell
cd server
npm test
```

## 6. Build

```powershell
cd app
npm run build
```

```powershell
cd server
npm run build
```

## 7. Security Audit

```powershell
cd app
npm run security:audit
```

```powershell
cd server
npm run security:audit
```

## Local Runtime Data

The server stores local development data under `server/data/` unless environment variables override it. Treat this directory as sensitive even during mock trials. Do not commit it, upload it, or share it.

## Next Steps

- Use the [classical Delphi tutorial](./tutorials/classical-delphi.md) for a full two-round flow.
- Use the [modified Delphi tutorial](./tutorials/modified-delphi.md) when starting from a predefined item set.
- Use the [mock-trial tutorial](./tutorials/mock-trial.md) before inviting real people to rehearse the workflow with synthetic data.
