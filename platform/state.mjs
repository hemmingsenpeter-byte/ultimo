// All learner records remain local. Nothing here grants verified competency.
export const KEY = "ultimo.learner.v1";
export const fresh = () => ({version:1,completed:{},reviews:{},quizzes:{},evidence:[],hours:5,last:null});
const object = v => v !== null && typeof v === "object" && !Array.isArray(v);
const safeDate = v => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v+"T00:00:00Z"));
export function clean(raw, valid, courseIds) {
  if (!object(raw) || raw.version !== 1) throw new Error("Unsupported learner data version.");
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
  return s;
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
  const result=[];
  for(const id of order){
    const c=map.get(id);if(!c||!c.authored)continue;
    if(c.prerequisites.some(p=>{const x=map.get(p);return !x||!x.authored||courseProgress(s,x)!==x.lessons.length;}))continue;
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
