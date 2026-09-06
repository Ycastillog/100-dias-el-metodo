// Development only. Imported exclusively by Vite's serve hook behind an explicit
// local flag. No production database, account, secrets or network calls.
import { validateRecord } from './participant-store.mjs';
import { dayGuide } from './guided-week.mjs';
const records = new Map();
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export function localQA(request,assets,program){
  const url=new URL(request.url);
  if(!['127.0.0.1','localhost'].includes(url.hostname))return new Response(null,{status:403});
  if(url.pathname.startsWith('/api/checkout'))return json({error:'local_qa_no_payments'},403);
  if(url.pathname==='/mi-metodo')return new Response(assets['/mi-metodo'].data.replace('<body>','<body><div style="background:#fff2cc;color:#403300;padding:8px;text-align:center;font:14px system-ui">REVISIÓN LOCAL · Sin compra real · Los datos de ejemplo se borran al reiniciar</div>'),{headers:{'Content-Type':'text/html','Cache-Control':'no-store'}});
  if(!url.pathname.startsWith('/api/participant/'))return null;
  const path=url.pathname.split('/').at(-1);
  if(path==='session')return json({plan:{key:'metodo',name:'El Método · ejemplo local',days:100},expiresAt:new Date(Date.now()+100*86400000).toISOString(),sandbox:true,records:[...records.values()],days:program.lessons.map(d=>({day:d.day,title:d.theme}))});
  if(path==='day'){
    const day=Number(url.searchParams.get('day'));if(!Number.isInteger(day)||day<1||day>100)return json({error:'day_not_available'},403);
    const profile=records.get('profile')?.body||{};const guided=dayGuide(program,day,profile,url.searchParams.get('area'));
    if(!guided)return json({error:'invalid_area'},400);
    return json({lesson:program.lessons[day-1],practice:program.getLifeProgram(day,{...profile,primaryLifeArea:profile.lifeArea,lifeArea:guided.area}),...guided,guide:{...guided.guide,audio:null,transcript:''}});
  }
  if(path==='record'&&request.method==='POST')return (async()=>{
    if(request.headers.get('origin')!==url.origin)return json({error:'invalid_origin'},403);
    const {key,body,revision}=await request.json();const clean=validateRecord(key,body,100);if(!clean)return json({error:'invalid_record'},400);
    if(revision!==(records.get(key)?.revision||0))return json({error:'record_conflict'},409);
    const record={key,body:clean,revision:revision+1,updatedAt:new Date().toISOString()};records.set(key,record);return json({record});
  })();
  if(path==='logout')return json({signedOut:true});
  return json({error:'local_qa_no_credentials'},403);
}
