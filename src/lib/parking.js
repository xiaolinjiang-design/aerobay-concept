export const initial=()=>({requests:[{id:'C-118',type:'arrival',status:'new',floor:null,bay:null,departure:'17:30'},{id:'C-076',type:'departure',status:'new',floor:2,bay:1,departure:'Now'}],queue:[],active:{id:'C-204',type:'departure',floor:3,bay:2,phase:'transit'},shaft:'occupied',selected:'C-118',choosing:false,choice:null,event:'C-118 requested parking.',overrides:{}});
export const key=r=>r.floor+'-'+r.bay;
export const place=r=>'F'+r.floor+' · '+String(r.bay).padStart(2,'0');
const baseEmpty=(f,n)=>(f+n)%3===1;
export function spaceStatus(s,f,n){let k=f+'-'+n;if(s.overrides[k])return s.overrides[k];if(s.requests.some(r=>r.type==='arrival'&&r.status!=='new'&&r.status!=='complete'&&key(r)===k))return'reserved';return baseEmpty(f,n)?'available':'occupied';}
export function reducer(s,a){switch(a.type){
 case'reset':return initial();
 case'select':return{...s,selected:a.id,choosing:false,choice:null};
 case'choose':return{...s,choosing:true,choice:null};
 case'cancel':return{...s,choosing:false,choice:null};
 case'bay':return s.choosing&&spaceStatus(s,a.floor,a.bay)==='available'?{...s,choice:{floor:a.floor,bay:a.bay}}:s;
 case'enqueue':{let r=s.requests.find(r=>r.id===s.selected);if(!r||r.status!=='new'||r.type==='arrival'&&(!s.choice||spaceStatus(s,s.choice.floor,s.choice.bay)!=='available'))return s;let assigned=r.type==='arrival'?s.choice:{};return{...s,requests:s.requests.map(x=>x.id===r.id?{...x,...assigned,status:'queued',held:false}:x),queue:[...s.queue,r.id],choosing:false,choice:null,event:r.id+' added to the shaft queue. Movement still requires approval.'};}
 case'hold':return{...s,requests:s.requests.map(r=>r.id===a.id&&r.status==='queued'?{...r,held:!r.held}:r)};
 case'exit-demo':if(s.active?.id!=='C-204')return s;return{...s,active:null,shaft:'checking',overrides:{...s.overrides,'3-2':'available'},event:'C-204 exited. Verifying shaft clearance.'};
 case'verified':return !s.active&&s.shaft==='checking'?{...s,shaft:'clear',event:'Shaft verified empty. The next movement needs manager approval.'}:s;
 case'start':{let r=s.requests.find(r=>r.id===a.id);if(!r||r.status!=='queued'||s.active||s.shaft!=='clear'||s.queue[0]!==a.id||r.held)return s;return{...s,active:{...r,phase:'authorizing'},shaft:'reserved',queue:s.queue.slice(1),requests:s.requests.map(x=>x.id===r.id?{...x,status:'active'}:x),selected:r.id,choosing:false,choice:null,event:r.id+' authorized. Shaft locked; rechecking conditions before movement.'};}
 case'phase':return s.active&&s.active.id!=='C-204'?{...s,active:{...s.active,phase:a.phase}}:s;
 case'finish':{let r=s.active;if(!r||r.id==='C-204')return s;return{...s,active:null,shaft:'checking',requests:s.requests.map(x=>x.id===r.id?{...x,status:'complete'}:x),overrides:{...s.overrides,[key(r)]:r.type==='arrival'?'occupied':'available'},event:r.id+(r.type==='arrival'?' parked.':' departed.')+' Confirming the shaft is empty.'};}
 default:return s;
}}
