# FoodMate

FoodMate is a mobile food ordering and delivery app built with Expo Router and React Native. The project is part of a study-led entrepreneurship acceleration initiative supervised by **Prof. Desmond Yau Chat TSOI**. Core development is by **Pang Zi Yang** ([ziyang04](https://github.com/ziyang04)) and collaborators.

## Overview
- Cross-platform app (iOS/Android) with file-based navigation via Expo Router.
- Email/password authentication powered by Firebase Auth with async storage persistence.
- Headless REST backend for restaurants, menus, carts, and orders.
- NativeWind/Tailwind styling and reusable UI components for cards, sheets, and headers.

## Architecture & Stack
- **App**: Expo Router, React Native, TypeScript
- **Auth**: Firebase Auth (client keys supplied via env vars)
- **Backend**: REST API (`services/api.ts` consumes `EXPO_PUBLIC_API_BASE_URL`)
- **Styling**: NativeWind/Tailwind (`global.css`, `tailwind.config.js`)
- **State/Context**: Custom auth context syncing Firebase user with backend profile

## Project layout
- `app/` – routed screens (auth, tabs, restaurant detail, checkout, etc.)
- `components/` – UI primitives (cards, sheets, headers, terms, overlays)
- `services/` – API helpers (`auth`, `restaurants`, `orders`, `cart`, etc.)
- `contexts/` – `AuthContext` wrapping Firebase + backend sync
- `assets/` – images, fonts, sounds
- `ios/` – native iOS project (configure Firebase plist placeholders before building)

## Prerequisites
- Node 18+ and npm
- Expo CLI: `npm install -g expo`
- iOS Simulator (Xcode) or Android Emulator (Android Studio) for local device testing

## Setup
1) Install dependencies
```bash
npm install
```

2) Configure environment variables
```bash
cp .env.example .env
```
Populate the values from your Firebase Web App config and backend base URL. These are public client keys but should remain outside version control.

3) Run the app
```bash
npx expo start
```
Choose Expo Go, iOS simulator, or Android emulator from the dev menu.

## Environment variables
Expo public env keys used by the client:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)
- `EXPO_PUBLIC_API_BASE_URL` (REST backend base URL)

## Native configuration
- iOS: Replace placeholders in `ios/dormdash/property list.plist` and `ios/dormdash/Info.plist` with your Firebase iOS config (App ID, API key, client IDs, storage bucket, project ID).
- Android: If adding a native build, include your `google-services.json` and matching package ID; keep it out of version control.

## Development notes
- Auth flow lives in `contexts/AuthContext.tsx`; it enforces email/password auth and syncs with backend user data.
- API endpoints are defined in `services/*.ts`; adjust `EXPO_PUBLIC_API_BASE_URL` per environment.
- Styling uses NativeWind; see `global.css` and `tailwind.config.js` for tokens/utilities.

## Credits
- Academic program: Study-led entrepreneurship acceleration supervised by **Prof. Desmond Yau Chat TSOI**.
- Development: **Pang Zi Yang** ([ziyang04](https://github.com/ziyang04)) and collaborators.

## License
Released under the PolyForm Noncommercial 1.0.0 license (see `LICENSE`). Commercial use requires a separate license from the authors.
