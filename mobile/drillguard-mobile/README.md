# DrillGuard Mobile

Native mobile app (Expo / React Native + TypeScript) for DrillGuard. It talks to the
**same PHP backend** as the web app — real JWT login, the replay stream, and the incident
database — so it is a genuine second client, not a mock.

## Screens
- **Login** — real auth against the PHP API, plus one-tap "Launch investor demo".
- **Live** — the drilling risk gauge, transport (play / jump-to-event / speed), the
  "RF warned N m before …" documented-event banner, and live parameters — all from the
  replay stream served by the backend.
- **Alerts** — the model's escalation ladder; each can be escalated into a real incident.
- **Incidents** — read live from the PHP/MySQL database; pull to refresh; mark resolved.
- **More** — active well, dataset switcher, backend connection status, sign out.

## Run it

Prerequisites: the PHP backend running (`backend/`, on port 8077) and MariaDB up.

```bash
cd mobile/drillguard-mobile
npm install
npx expo run:ios      # builds + launches on the iOS Simulator (shares Mac localhost)
```

For a **physical phone**, install "Expo Go", copy `.env.example` to `.env`, set
`EXPO_PUBLIC_API_BASE` to your Mac's LAN IP (`ipconfig getifaddr en0`), then:

```bash
npx expo start        # scan the QR code with the phone (same Wi-Fi)
```

Demo login: `engineer@drilcorp.com` / `drillguard`.

## Notes
- API base is configurable via `EXPO_PUBLIC_API_BASE` (see `.env.example`).
- The app reuses the backend's exported replay JSON, so no ML runs on the device — the
  models stay in the Python pipeline, exactly as on the web.
