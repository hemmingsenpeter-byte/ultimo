// Local, self-assessed practice records. These records never verify competence.
export const LIMITS = Object.freeze({records:200,attempts:50,note:4000,criterion:4000,level:2000,backupBytes:5*1024*1024});
export const JUDGEMENTS = Object.freeze({not_yet:"Not yet demonstrated (self-assessed)",developing:"Developing (self-assessed)",meets:"Meets criterion (self-assessed)"});
const object=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
const identifier=value=>typeof value==="string"&&/^[a-zA-Z0-9-]{1,80}$/.test(value);
const text=(value,limit)=>typeof value==="string"&&value.trim().length>0&&value.length<=limit;
const fail=message=>{throw Error(message);};

export function isISODate(value){
 if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value.startsWith("0000"))return false;
 const date=new Date(value+"T00:00:00Z");
 return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
}
function rubricSnapshot(raw){
 if(!object(raw)||typeof raw.version!=="string"||!/^sha256:[a-f0-9]{64}$/.test(raw.version)
  ||!text(raw.criterion,LIMITS.criterion)||!Array.isArray(raw.levels)||raw.levels.length!==7
  ||!raw.levels.every(level=>text(level,LIMITS.level)))fail("Invalid evidence rubric snapshot.");
 return {version:raw.version,criterion:raw.criterion,levels:[...raw.levels]};
}
function checkedTarget(target){
 if(!object(target)||typeof target.course!=="string"||!/^[A-Z]{3}-\d{3}$/.test(target.course)
  ||typeof target.lesson!=="string"||!/^L\d{2}$/.test(target.lesson)
  ||target.key!==target.course+"."+target.lesson||!text(target.competency,160))fail("Invalid evidence target.");
 return {key:target.key,course:target.course,lesson:target.lesson,competency:target.competency,rubric:rubricSnapshot(target.rubric)};
}
export function evidenceTargets(data){
 if(!object(data)||!Array.isArray(data.courses))fail("Curriculum evidence targets unavailable.");
 const targets=new Map();
 for(const course of data.courses){
  if(!course.authored)continue;
  for(const lesson of course.lessons){
   const target=checkedTarget({key:course.id+"."+lesson.id,course:course.id,lesson:lesson.id,competency:lesson.competency,rubric:lesson.evidence_rubric});
   if(targets.has(target.key))fail("Duplicate curriculum evidence target.");
   targets.set(target.key,target);
  }
 }
 return targets;
}
function checkedAttempt(raw){
 if(!object(raw)||!identifier(raw.id)||!isISODate(raw.date)||!text(raw.note,LIMITS.note)
  ||!Object.hasOwn(JUDGEMENTS,raw.judgement)
  ||!(raw.reassessOn===null||(isISODate(raw.reassessOn)&&raw.reassessOn>=raw.date)))fail("Invalid evidence attempt: check its ID, note, judgement and dates.");
 // Project supported fields only; imported reviewer/verified fields have no authority.
 return {id:raw.id,date:raw.date,note:raw.note,judgement:raw.judgement,reassessOn:raw.reassessOn,rubric:rubricSnapshot(raw.rubric)};
}
function checkedPortfolio(raw,targets){
 if(!object(raw)||!identifier(raw.id)||typeof raw.course!=="string"||typeof raw.lesson!=="string")fail("Invalid evidence record.");
 const target=targets.get(raw.course+"."+raw.lesson);
 if(!target||raw.course!==target.course||raw.lesson!==target.lesson||raw.competency!==target.competency)fail("Evidence references an unknown lesson or competency.");
 if(!Array.isArray(raw.attempts)||raw.attempts.length<1||raw.attempts.length>LIMITS.attempts)fail("Evidence history must contain 1–"+LIMITS.attempts+" attempts; no history was removed.");
 const attempts=raw.attempts.map(checkedAttempt),ids=new Set();
 for(let index=0;index<attempts.length;index++){
  const attempt=attempts[index];
  if(ids.has(attempt.id))fail("Duplicate evidence attempt ID.");
  if(index&&attempt.date<attempts[index-1].date)fail("Evidence attempts must remain in chronological order.");
  ids.add(attempt.id);
 }
 return {id:raw.id,course:target.course,lesson:target.lesson,competency:target.competency,attempts};
}
export function validatePortfolios(records,targets){
 if(!Array.isArray(records)||records.length>LIMITS.records)fail("Evidence collection must contain at most "+LIMITS.records+" records; no history was removed.");
 if(!records.length)return [];
 if(!(targets instanceof Map))fail("Curriculum targets are required to restore evidence history.");
 const result=records.map(record=>checkedPortfolio(record,targets)),ids=new Set(),attemptIds=new Set();
 for(const record of result){
  if(ids.has(record.id))fail("Duplicate evidence record ID.");
  ids.add(record.id);
  for(const attempt of record.attempts){
   if(attemptIds.has(attempt.id))fail("Duplicate evidence attempt ID.");
   attemptIds.add(attempt.id);
  }
 }
 assertBackupSize({portfolios:result});
 return result;
}
export function newAttempt(target,{id,date,note,judgement="not_yet",reassessOn=null}){
 const current=checkedTarget(target);
 return checkedAttempt({id,date,note,judgement,reassessOn,rubric:current.rubric});
}
function currentAttempt(target,attempt){
 const result=checkedAttempt(attempt);
 if(JSON.stringify(result.rubric)!==JSON.stringify(target.rubric))fail("New attempts must use the current criterion and rubric.");
 return result;
}
export function makePortfolio(target,{id,attempt}){
 const current=checkedTarget(target),next=currentAttempt(current,attempt);
 return checkedPortfolio({id,course:current.course,lesson:current.lesson,competency:current.competency,attempts:[next]},new Map([[current.key,current]]));
}
export function appendAttempt(record,target,attempt){
 const current=checkedTarget(target),previous=checkedPortfolio(record,new Map([[current.key,current]]));
 const next=currentAttempt(current,attempt);
 return checkedPortfolio({...previous,attempts:[...previous.attempts,next]},new Map([[current.key,current]]));
}
export function assertBackupSize(state){
 const serialized=JSON.stringify(state);
 if(typeof serialized!=="string"||new TextEncoder().encode(serialized).byteLength>LIMITS.backupBytes)fail("Learner backup exceeds 5 MB. Export your records and remove entries before adding more; no history was removed.");
 return state;
}
const localDate=()=>{const date=new Date();return [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");};
export function duePortfolios(state,date=localDate()){
 if(!isISODate(date))fail("Invalid reassessment date.");
 return (state.portfolios??[]).filter(record=>{const latest=record.attempts.at(-1);return latest?.reassessOn&&latest.reassessOn<=date;})
  .sort((left,right)=>left.attempts.at(-1).reassessOn.localeCompare(right.attempts.at(-1).reassessOn)||left.id.localeCompare(right.id));
}
