import {isISODate,validatePortfolios,assertBackupSize} from "./portfolio.mjs";
// All learner records remain local. Nothing here grants verified competency.
export const KEY = "ultimo.learner.v1";
export const fresh = () => ({version:2,completed:{},reviews:{},quizzes:{},evidence:[],portfolios:[],hours:5,last:null,studyPlan:"foundation"});
const object = v => v !== null && typeof v === "object" && !Array.isArray(v);
const safeDate = isISODate;
export function clean(raw, valid, courseIds, planIds=new Set(["foundation","all"]),targets) {
  if (!object(raw) || ![1,2].includes(raw.version)) throw new Error("Unsupported learner data version.");
  if(raw.version===2&&!Object.hasOwn(raw,"portfolios"))throw new Error("Version 2 learner data must include its evidence portfolios; no history was removed.");
  const s=fresh();
  for (const k of valid) {
    if (object(raw.completed) && safeDate(raw.completed[k])) s.completed[k]=raw.completed[k];
    if (object(raw.reviews) && object(raw.reviews[k])) {
      const r=raw.reviews[k];
      if (safeDate(r.due) && Number.isInteger(r.step) && r.step>=0 && r.step<=4) s.reviews[k]={due:r.due,step:r.step};
    }
    if(object(raw.quizzes) && object(raw.quizzes[k])){
      const q=raw.quizzes[k];
      if(safeDate(q.date)&&Number.isInteger(q.correct)&&Number.isInteger(q.total)&&q.total>0&&q.correct>=0&&q.correct<=q.total&&q.total<=100)s.quizzes[k]={date:q.date,correct:q.correct,total:q.total};
    }
  }
  if(Array.isArray(raw.evidence)) s.evidence=raw.evidence.slice(0,500).filter(e=>object(e)&&courseIds.has(e.course)&&typeof e.id==="string"&&/^[a-zA-Z0-9-]{1,80}$/.test(e.id)&&typeof e.note==="string"&&e.note.length<=4000&&safeDate(e.date)).map(e=>({id:e.id,course:e.course,note:e.note,date:e.date}));
  if(Number.isFinite(raw.hours)&&raw.hours>=1&&raw.hours<=20)s.hours=Math.round(raw.hours);
  if(valid.has(raw.last))s.last=raw.last;
  if(typeof raw.studyPlan==="string"&&planIds.has(raw.studyPlan))s.studyPlan=raw.studyPlan;
  if(Object.hasOwn(raw,"portfolios"))s.portfolios=validatePortfolios(raw.portfolios,targets);
  return assertBackupSize(s);
}
const prerequisiteIds = course => Array.isArray(course?.prerequisites)?course.prerequisites.filter(id=>typeof id==="string"):[];
export function studyOptions(data){
  return [{id:"foundation",title:"Foundation semester"},{id:"all",title:"All written courses"},
    ...(data.faculties??[]).map(f=>({id:"faculty:"+f.id,title:f.title+" faculty"}))];
}
export function studySelection(state,data){
  const options=studyOptions(data), selected=options.find(p=>p.id===state.studyPlan)??options[0];
  const map=new Map(data.courses.map(c=>[c.id,c]));
  const selectedIds=selected.id==="foundation"?(data.semester??[]):data.courses.filter(c=>selected.id==="all"?c.authored:c.faculty===selected.id.slice("faculty:".length)).map(c=>c.id);
  const ids=[...new Set(selectedIds)], targets=ids.filter(id=>map.get(id)?.authored), unavailable=ids.filter(id=>!map.get(id)?.authored);
  const order=[],visited=new Set(),visiting=new Set();
  const visit=id=>{
    if(visited.has(id)||visiting.has(id)||!map.has(id))return;
    visiting.add(id);
    for(const p of prerequisiteIds(map.get(id)))visit(p);
    visiting.delete(id);visited.add(id);order.push(id);
  };
  targets.forEach(visit);
  const blocked=[];
  for(const id of targets){
    const seen=new Set([id]), missing=new Set();
    const inspect=course=>{
      for(const p of prerequisiteIds(course)){
        if(seen.has(p))continue;
        seen.add(p);
        const prerequisite=map.get(p);
        if(!prerequisite?.authored)missing.add(p);
        if(prerequisite)inspect(prerequisite);
      }
    };
    inspect(map.get(id));
    if(missing.size)blocked.push({course:id,prerequisites:[...missing]});
  }
  const targetSet=new Set(targets);
  return {id:selected.id,title:selected.title,order,targets,prerequisites:order.filter(id=>!targetSet.has(id)),unavailable,blocked};
}
export function today(now=new Date()) {
  return [now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
}
export function addDays(date,days) {
  const d=new Date(date+"T12:00:00Z"); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10);
}
export function complete(s,key,date=today()){
  if(!s.completed[key]){s.completed[key]=date;s.reviews[key]={due:addDays(date,1),step:0};}
  s.last=key;
}
export function review(s,key,date=today()){
  const r=s.reviews[key]; if(!r||r.step>=4||r.due>date)return false;
  const intervals=[2,4,23,30];r.due=addDays(date,intervals[r.step]);r.step++;return true;
}
export function due(s,date=today()){
  return Object.entries(s.reviews).filter(([,r])=>r.step<4&&r.due<=date).sort((a,b)=>a[1].due.localeCompare(b[1].due)).map(([k])=>k);
}
export function courseProgress(s,course){return course.lessons.filter(l=>s.completed[course.id+"."+l.id]).length;}
export function nextLessons(s, courses, order){
  const map=new Map(courses.map(c=>[c.id,c]));
  const ready=new Map();
  const requirementsMet=(id,visiting=new Set())=>{
    if(visiting.has(id))return false;
    if(ready.has(id))return ready.get(id);
    visiting.add(id);
    const result=prerequisiteIds(map.get(id)).every(p=>{
      const c=map.get(p);
      return c?.authored&&courseProgress(s,c)===c.lessons.length&&requirementsMet(p,visiting);
    });
    visiting.delete(id);ready.set(id,result);return result;
  };
  const result=[];
  for(const id of new Set(order)){
    const c=map.get(id);if(!c||!c.authored)continue;
    if(!requirementsMet(id))continue;
    const next=c.lessons.find(l=>!s.completed[id+"."+l.id]);
    if(next)result.push(id+"."+next.id);
  }
  return result;
}
export function plan(s,courses,order,date=today()){
  const dueKeys=due(s,date), remaining=Math.max(0,s.hours*60-dueKeys.length*15);
  const available=nextLessons(s,courses,order);
  // One next lesson per eligible course; do not pretend a prerequisite is already done.
  return {reviews:dueKeys,lessons:available.slice(0,Math.floor(remaining/60)),minutes:dueKeys.length*15+Math.min(available.length,Math.floor(remaining/60))*60};
}
