# Halo Parking Control

A standalone React web app for managing a simulated flying-car garage. Requests are prepared on the left, parking spaces and the shared shaft appear in the center, and movement approval stays in the right-hand queue.

## Stack

- React 19 and Vite
- Editable shadcn/ui components, adapted from the Radix implementation: Button, Badge, Separator Progress, Card and Popover
- Radix accessibility primitives, class-variance-authority and Lucide icons
- Linear-inspired near-black surfaces, hairline borders and restrained lavender actions

Component styles use local CSS design tokens. They do not require a hosted UI service.

## Develop

```sh
npm ci
npm run dev
```

Open http://localhost:5173. Source edits update the app through Vite.

```sh
npm test
npm run build
npm run preview
```

The production site is generated in `dist/`. Preview runs on http://localhost:4173.

## Deploy and share

Deploy `dist/` to any static host (Sites, Netlify, Vercel or Cloudflare Pages). Build command: `npm run build`; output directory: `dist`. No server secrets or backend are required. Hosted access depends on the host's sharing settings; owner-private hosting does not automatically grant access to other people.

## Demo workflow

1. Find a spot for C-118 and choose an available bay.
2. Assign the spot to add the arrival to the shaft queue.
3. Add C-076's departure to the same queue.
4. The initial vehicle completes its departure automatically; the app verifies shaft clearance.
5. Once checks pass, authorize **Start parking** on the first queue item.
6. After parking and fresh shaft verification, authorize **Start departure**.

Assignment does not authorize movement. Only the queue head can start, held requests cannot start, and an active car locks all other entries.

Demo state is saved in each browser's local storage and survives refresh. **Reset demo** restores the initial scenario. Each visitor has an independent demo session; this is not a shared live operations backend. Vehicle movements and sensor readings are simulated.

## Structure

- `src/App.jsx`: application interface and simulation timing
- `src/lib/parking.js`: parking and shaft state transitions
- `src/lib/parking.test.js`: queue and shaft constraint tests
- `src/lib/session.js`: browser session persistence
- `src/components/ui/`: editable shadcn components
- `src/styles.css`: design tokens and responsive layout

Available bays open a spot-details popover even outside a request search. The popover shows ID, location, vehicle size and charging availability. Assignment reserves the spot and queues the selected arrival. Suggested spots are shown only during a Find spot search.
