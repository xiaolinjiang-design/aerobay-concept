import { useEffect, useMemo, useRef } from 'react';
import { mountGarage } from '../garage3d/mountGarage.js';
import { spaceStatus, suggestedSpots } from '../lib/parking.js';

/** A 3D view of the existing 36-bay parking state. Authorization stays in the app. */
export default function Garage3D({ state, progress = 0, onSpotClick, className = '' }) {
  const root = useRef(null);
  const scene = useRef(null);
  const viewState = useMemo(() => ({
    occupiedBays: Array.from({ length: 6 }, (_, floorIndex) =>
      Array.from({ length: 6 }, (_, bayIndex) =>
        spaceStatus(state, floorIndex + 1, bayIndex + 1) === 'occupied'
          ? { floor: floorIndex + 1, bay: bayIndex + 1 }
          : null,
      ),
    ).flat().filter(Boolean),
    availableBays: Array.from({ length: 6 }, (_, floorIndex) =>
      Array.from({ length: 6 }, (_, bayIndex) =>
        spaceStatus(state, floorIndex + 1, bayIndex + 1) === 'available'
          ? { floor: floorIndex + 1, bay: bayIndex + 1 }
          : null,
      ),
    ).flat().filter(Boolean),
    choosing: state.choosing,
    choice: state.choice,
    suggestedBays: suggestedSpots(state),
    route: state.active?.id!=='C-204'&&state.active||state.requests.find(r=>r.id===state.selected&&r.status==='queued')||state.requests.find(r=>r.id===state.queue[0])||null,
    active: state.active,
    progress,
  }), [state, progress]);

  useEffect(() => {
    scene.current = mountGarage(root.current, { mode: 'app', initialState: viewState, onSpotClick });
    return () => { scene.current?.dispose(); scene.current = null; };
  }, []);

  useEffect(() => { scene.current?.update(viewState); }, [viewState]);

  return <div ref={root} className={`garage-3d-root ${className}`.trim()} aria-label="3D parking garage" />;
}
