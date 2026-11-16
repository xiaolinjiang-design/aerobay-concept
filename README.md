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

Open http://localhost:5173/concept.html for the interactive 3D architectural concept. Drag to orbit, scroll to zoom, and select a level to inspect its bays. The opaque, light-colored roof has an overhang to shade the decks; Roof Cutaway reveals the interior. The central tunnel is enclosed. Authorize Entry or Authorize Exit starts an automatic gate sequence; the opposite movement stays disabled until the car has finished and both gates have closed. The roof is a visual concept; real insulation, ventilation, and summer heat performance would require engineering design.

The 3D concept has 12 bays on each of six floors, for 72 bays total. Ten cars are displayed on each floor to leave two open spaces visible.

Parked vehicles use three body shapes (sport, touring, and compact) and four restrained paint finishes.

The outer perimeter is enclosed on every floor with transparent safety panels and framing, so cars cannot leave the decks through the outside edge in the concept model.

The concept page is now a full-screen model with only floor, roof, and shaft controls, ready to be embedded in the flying-car app with an iframe pointing to `/concept.html`.

```sh
npm test
npm run build
npm run preview
```

The production site is generated in `dist/`. Preview runs on http://localhost:4173.

## Deploy and share

The GitHub Pages workflow deploys each push to `main` at https://xiaolinjiang-design.github.io/aerobay-concept/. Enable **GitHub Actions** as the Pages source in the repository settings. The Pages build uses `/aerobay-concept/` as its asset base; ordinary builds keep `/` for other hosts. The app is a browser-local simulation, so each visitor has a separate demo state.

For another static host, run `npm run build` and deploy `dist/`. No server secrets or backend are required.

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

The 3D garage at `concept.html` uses the unbranded [Generic mid-engine supercar](https://www.innerscene.com/tools/library/3d-parts/generic-mid-engine-supercar-73f252c5) model, released under CC0 by Innerscene. Its GLB is stored locally at `public/supercar.glb`.

## Reusing the 3D garage

`src/components/Garage3D.jsx` is the React integration. Pass the parking reducer state and the active movement's progress (`0` to `100`):

```jsx
<Garage3D state={parkingState} progress={movementProgress} />
```

The component uses `spaceStatus` for the app's six bays on each of six floors. It reads `state.active` to show the moving car and gate animation. The app remains responsible for authorizing movements; the 3D view does not dispatch parking actions. Give its parent a defined height. The model file must remain in `public/supercar.glb`. `src/garage3d/mountGarage.js` holds the Three.js scene and handles cleanup when the component unmounts. The standalone concept page uses that same scene in demo mode.

Available bays open a spot-details popover even outside a request search. The popover shows ID, location, vehicle size and charging availability. Assignment reserves the spot and queues the selected arrival. Suggested spots are shown only during a Find spot search.
