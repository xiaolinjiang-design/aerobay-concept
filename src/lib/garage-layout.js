export const FLOOR_COUNT=6;
export const BAYS_PER_FLOOR=12;
export const TOTAL_SPOTS=FLOOR_COUNT*BAYS_PER_FLOOR;
export const GARAGE_SPOTS=Array.from({length:FLOOR_COUNT},(_,floor)=>Array.from({length:BAYS_PER_FLOOR},(_,bay)=>({floor:floor+1,bay:bay+1}))).flat();
export const bayAngle=bay=>(bay-.5)*Math.PI*2/BAYS_PER_FLOOR;
