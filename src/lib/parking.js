export const initial=()=>({requests:[{id:'C-118',type:'arrival',status:'new',floor:null,bay:null,arrival:'14:32',departure:'17:30'},{id:'C-076',type:'departure',status:'new',floor:2,bay:1,arrival:'10:15',departure:'14:35'},{id:'C-231',type:'arrival',status:'new',floor:null,bay:null,arrival:'14:36',departure:'18:00'},{id:'C-442',type:'departure',status:'new',floor:5,bay:3,arrival:'11:45',departure:'14:40'},{id:'C-305',type:'arrival',status:'new',floor:null,bay:null,arrival:'14:38',departure:'16:45'},{id:'C-189',type:'departure',status:'new',floor:1,bay:4,arrival:'09:30',departure:'14:45'}],queue:[],active:{id:'C-204',type:'departure',floor:3,bay:2,phase:'transit'},shaft:'occupied',selected:'C-118',choosing:false,choice:null,event:'C-118 requested parking.',overrides:{}});
export const key=r=>r.floor+'-'+r.bay;
export const place=r=>'F'+r.floor+' · '+String(r.bay).padStart(2,'0');
const baseEmpty=(f,n)=>(f+n)%3===1;
export function spaceStatus(s,f,n){let k=f+'-'+n;if(s.requests.some(r=>r.type==='arrival'&&(r.status==='queued'||r.status==='active')&&key(r)===k))return'reserved';if(s.overrides[k])return s.overrides[k];return baseEmpty(f,n)?'available':'occupied';}
export function capacityCounts(state){const counts={available:0,occupied:0,reserved:0,total:36};for(let floor=1;floor<=6;floor++)for(let bay=1;bay<=6;bay++)counts[spaceStatus(state,floor,bay)]++;return counts;}
export function reducer(s,a){switch(a.type){
 case'reset':return initial();
 case'new-request':return addTimedRequest(s);
 case'select':return{...s,selected:a.id,choosing:false,choice:null};
 case'choose':return{...s,choosing:true,choice:null};
 case'cancel':return{...s,choosing:false,choice:null};
 case'bay':return s.choosing&&spaceStatus(s,a.floor,a.bay)==='available'?{...s,choice:{floor:a.floor,bay:a.bay}}:s;
 case'assign-spot':{const r=s.requests.find(r=>r.id===a.id);if(!r||r.type!=='arrival'||r.status!=='new'||!Number.isInteger(a.floor)||!Number.isInteger(a.bay)||a.floor<1||a.floor>6||a.bay<1||a.bay>6||spaceStatus(s,a.floor,a.bay)!=='available')return s;return reducer({...s,selected:a.id,choosing:true,choice:{floor:a.floor,bay:a.bay}},{type:'enqueue'});}
 case'enqueue':{let r=s.requests.find(r=>r.id===s.selected);if(!r||r.status!=='new'||r.type==='arrival'&&(!s.choice||spaceStatus(s,s.choice.floor,s.choice.bay)!=='available'))return s;let assigned=r.type==='arrival'?s.choice:{};return{...s,requests:s.requests.map(x=>x.id===r.id?{...x,...assigned,status:'queued',held:false}:x),queue:[...s.queue,r.id],choosing:false,choice:null,event:r.id+' added to the shaft queue. Movement still requires approval.'};}
 case'hold':return{...s,requests:s.requests.map(r=>r.id===a.id&&r.status==='queued'?{...r,held:!r.held}:r)};
 case'exit-demo':if(s.active?.id!=='C-204')return s;return{...s,active:null,shaft:'checking',overrides:{...s.overrides,'3-2':'available'},event:'C-204 exited. Verifying shaft clearance.'};
 case'verified':return !s.active&&s.shaft==='checking'?{...s,shaft:'clear',event:'Shaft verified empty. The next movement needs manager approval.'}:s;
 case'start':{let r=s.requests.find(r=>r.id===a.id);if(!r||r.status!=='queued'||s.active||s.shaft!=='clear'||s.queue[0]!==a.id||r.held)return s;return{...s,active:{...r,phase:'authorizing'},shaft:'reserved',queue:s.queue.slice(1),requests:s.requests.map(x=>x.id===r.id?{...x,status:'active'}:x),selected:r.id,choosing:false,choice:null,event:r.id+' authorized. Shaft locked; rechecking conditions before movement.'};}
 case'phase':return s.active&&s.active.id!=='C-204'?{...s,active:{...s.active,phase:a.phase}}:s;
 case'finish':{let r=s.active;if(!r||r.id==='C-204')return s;return{...s,active:null,shaft:'checking',requests:s.requests.map(x=>x.id===r.id?{...x,status:'complete'}:x),overrides:{...s.overrides,[key(r)]:r.type==='arrival'?'occupied':'available'},event:r.id+(r.type==='arrival'?' parked.':' departed.')+' Confirming the shaft is empty.'};}
 default:return s;
}}

export function parkedVehicle(state,floor,bay){
 const request=state.requests.find(r=>r.floor===floor&&r.bay===bay&&(r.type==='departure'&&r.status!=='complete'||r.type==='arrival'&&r.status==='complete'));
 return request||{id:`C-${300+floor*10+bay}`,arrival:['09:30','10:15','11:00'][bay%3],departure:['16:30','17:00','18:00'][floor%3]};
}
export function parkingTime(car){
 const minutes=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
 const start=minutes(car.arrival),end=minutes(car.departure),now=14*60+32;
 const duration=end>=start?end-start:end+1440-start,elapsed=Math.max(0,Math.min(duration,now-start));
 const format=m=>`${Math.floor(m/60)}h ${m%60}m`;
 return {percent:duration?elapsed/duration*100:0,elapsed:format(elapsed),remaining:format(duration-elapsed)};
}

// Prototype route: roof gate above F6, 4 m per floor, then 8 m from shaft to bay.
// Bays share a radius, so bays on the same floor have equal route lengths.
export const gateDistance=spot=>(7-spot.floor)*4+8;
export function suggestedSpots(state){
 return Array.from({length:6},(_,i)=>Array.from({length:6},(_,j)=>({floor:i+1,bay:j+1}))).flat()
  .filter(spot=>spaceStatus(state,spot.floor,spot.bay)==='available')
  .sort((a,b)=>gateDistance(a)-gateDistance(b)||a.bay-b.bay);
}

export function addTimedRequest(state){
 const sequence=(state.requestSequence||0)+1;
 const format=minutes=>`${String(Math.floor(minutes/60)%24).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
 const now=14*60+32+sequence;
 const departureSpot=sequence%2===0?Array.from({length:6},(_,i)=>Array.from({length:6},(_,j)=>({floor:i+1,bay:j+1}))).flat().find(spot=>{
  if(spaceStatus(state,spot.floor,spot.bay)!=='occupied'||state.active&&key(state.active)===key(spot))return false;
  const car=parkedVehicle(state,spot.floor,spot.bay);
  return !state.requests.some(r=>r.id===car.id)&&!state.requests.some(r=>key(r)===key(spot)&&r.status!=='complete');
 }):null;
 const vehicle=departureSpot?parkedVehicle(state,departureSpot.floor,departureSpot.bay):null;
 const request=departureSpot?{...departureSpot,id:vehicle.id,type:'departure',status:'new',arrival:vehicle.arrival,bookedDeparture:vehicle.bookedDeparture||vehicle.departure,departure:format(now)}:{id:`C-${1000+sequence}`,type:'arrival',status:'new',floor:null,bay:null,arrival:format(now),departure:format(now+120)};
 return {...state,requestSequence:sequence,requests:[...state.requests,request],event:request.id+(request.type==='arrival'?' requested parking.':' requested departure.')};
}

export function earlyDeparture(request){
 if(request.type!=='departure')return null;
 const booking=request.bookedDeparture||(request.id===`C-${300+request.floor*10+request.bay}`?['16:30','17:00','18:00'][request.floor%3]:null);
 return booking&&request.departure<booking?booking:null;
}
