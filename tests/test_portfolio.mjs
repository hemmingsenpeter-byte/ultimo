import assert from "node:assert/strict";
import {KEY,fresh,clean,complete,due} from "../platform/state.mjs";
import {LIMITS,evidenceTargets,newAttempt,makePortfolio,appendAttempt,validatePortfolios,duePortfolios,assertBackupSize,isISODate} from "../platform/portfolio.mjs";

// Public fictional curriculum and evidence only. No learner records or model calls.
const rubric={version:"sha256:"+"a".repeat(64),criterion:"Explain retrieval with an unfamiliar example.",levels:Array.from({length:7},(_,level)=>"Observable draft criterion "+level)};
const data={courses:[
 {id:"INT-101",authored:true,lessons:[{id:"L01",competency:"INT-101.L01",evidence_rubric:rubric}]},
 {id:"INT-102",authored:false,lessons:[{id:"L01",competency:"INT-102.L01"}]}
]};
const targets=evidenceTargets(data),target=targets.get("INT-101.L01"),valid=new Set(targets.keys()),courseIds=new Set(["INT-101"]),plans=new Set(["foundation","all"]);
const restore=raw=>clean(raw,valid,courseIds,plans,targets);
const fields={id:"attempt-1",date:"2026-11-28",note:"Fictional explanation attempted without notes.",judgement:"developing",reassessOn:"2026-12-05"};
const attempt=newAttempt(target,fields),record=makePortfolio(target,{id:"portfolio-1",attempt});

assert.equal(KEY,"ultimo.learner.v1","Existing browser records remain discoverable under their old key");
assert.deepEqual([...targets.keys()],["INT-101.L01"],"Blueprints cannot accept claimed lesson evidence");
assert.notEqual(target.rubric,rubric);
assert.notEqual(attempt.rubric,target.rubric);
assert.notEqual(attempt.rubric.levels,target.rubric.levels);
assert.equal(newAttempt(target,{...fields,id:"default-judgement",judgement:undefined}).judgement,"not_yet");
assert.deepEqual(fresh().portfolios,[]);

const legacy={version:1,completed:{"INT-101.L01":"2026-11-27"},reviews:{"INT-101.L01":{due:"2026-11-28",step:0}},quizzes:{"INT-101.L01":{date:"2026-11-27",correct:2,total:3}},evidence:[{id:"old-note",course:"INT-101",note:"Original fictional course-level note; no lesson was recorded.",date:"2026-11-27"}],hours:3,last:"INT-101.L01",studyPlan:"all"};
const migrated=restore(legacy);
assert.equal(migrated.version,2);
for(const key of ["completed","reviews","quizzes","evidence","hours","last","studyPlan"])assert.deepEqual(migrated[key],legacy[key],"Migration preserves "+key);
assert.deepEqual(migrated.portfolios,[],"Migration does not invent lesson links or self-assessment for old notes");
const state={...migrated,portfolios:[record]};
assert.deepEqual(restore(JSON.parse(JSON.stringify(state))),state,"Version 2 backup roundtrip preserves the entire history");
assert.throws(()=>restore({...state,version:3}),/Unsupported/);
const incompleteModern={...state};delete incompleteModern.portfolios;
assert.throws(()=>restore(incompleteModern),/Version 2 learner data must include/,"Incomplete modern backups cannot silently erase the evidence collection");
assert.throws(()=>clean(state,valid,courseIds,plans),/targets are required/);

// Reassessment under revised criteria keeps the earlier wording and judgement intact.
const revisedTarget={...target,rubric:{...rubric,version:"sha256:"+"b".repeat(64),criterion:"Explain retrieval and its limitations in an unfamiliar example.",levels:rubric.levels.map(text=>text+" revised")}};
const oldJSON=JSON.stringify(record),next=newAttempt(revisedTarget,{id:"attempt-2",date:"2026-12-05",note:"A second fictional attempt includes a limitation.",judgement:"meets",reassessOn:null});
const revised=appendAttempt(record,revisedTarget,next);
assert.equal(JSON.stringify(record),oldJSON,"Append never mutates the previous record");
assert.equal(revised.attempts.length,2);
assert.deepEqual(revised.attempts[0],record.attempts[0]);
assert.notEqual(revised.attempts[0],record.attempts[0],"Returned histories do not alias mutable old attempt objects");
assert.equal(revised.attempts[0].rubric.version,rubric.version);
assert.equal(revised.attempts[1].rubric.version,revisedTarget.rubric.version);
const revisedMap=new Map([[target.key,revisedTarget]]);
assert.deepEqual(validatePortfolios([revised],revisedMap),[revised],"Import retains historical snapshots after the published rubric changes");
assert.throws(()=>appendAttempt(record,revisedTarget,attempt),/current criterion/);
assert.throws(()=>appendAttempt(record,target,newAttempt(target,{...fields,id:"backdated",date:"2026-11-27"})),/chronological/);
assert.throws(()=>appendAttempt(record,target,attempt),/Duplicate/);

// Only the newest explicit evidence follow-up creates an evidence reminder.
const dueState={...fresh(),portfolios:[record]};
complete(dueState,"INT-101.L01","2026-11-28");
assert.deepEqual(duePortfolios(dueState,"2026-12-04"),[]);
assert.deepEqual(duePortfolios(dueState,"2026-12-05").map(record=>record.id),["portfolio-1"]);
assert.deepEqual(due(dueState,"2026-11-29"),["INT-101.L01"],"Reading reviews stay independent of evidence reassessments");
assert.deepEqual(duePortfolios({...dueState,portfolios:[revised]},"2026-12-30"),[],"A new attempt with no follow-up replaces the previous due schedule");
assert.equal(duePortfolios(dueState,"2026-12-05")[0],record);
const earlier=makePortfolio(target,{id:"portfolio-0",attempt:newAttempt(target,{...fields,id:"attempt-0",reassessOn:"2026-12-01"})});
assert.deepEqual(duePortfolios({...fresh(),portfolios:[record,earlier]},"2026-12-05").map(record=>record.id),["portfolio-0","portfolio-1"]);

for(const date of ["2026-02-29","2026-02-30","2026-04-31","2100-02-29","0000-01-01","2026-1-01","2026-13-01","2026-11-28T12:00:00Z"]){
 assert.equal(isISODate(date),false,date);
 assert.throws(()=>newAttempt(target,{...fields,date}),/Invalid evidence attempt/,date);
}
for(const date of ["2000-02-29","2024-02-29","2026-12-31"])assert.equal(isISODate(date),true,date);
assert.throws(()=>newAttempt(target,{...fields,reassessOn:"2026-11-27"}),/Invalid evidence attempt/);
assert.throws(()=>newAttempt(target,{...fields,reassessOn:"2026-02-30"}),/Invalid evidence attempt/);
assert.throws(()=>duePortfolios(dueState,"2026-02-30"),/Invalid reassessment date/);

const rejected=[
 {...record,id:"bad/id"},
 {...record,course:"INT-102"},
 {...record,lesson:"L02"},
 {...record,competency:"INT.learning"},
 {...record,attempts:[]},
 {...record,attempts:[{...attempt,id:"bad.id"}]},
 {...record,attempts:[{...attempt,note:" "}]},
 {...record,attempts:[{...attempt,note:"x".repeat(LIMITS.note+1)}]},
 {...record,attempts:[{...attempt,judgement:"verified"}]},
 {...record,attempts:[{...attempt,rubric:{...rubric,version:"current"}}]},
 {...record,attempts:[{...attempt,rubric:{...rubric,criterion:""}}]},
 {...record,attempts:[{...attempt,rubric:{...rubric,levels:rubric.levels.slice(1)}}]},
 {...record,attempts:[{...attempt,rubric:{...rubric,levels:[...rubric.levels.slice(1),"x".repeat(LIMITS.level+1)]}}]}
];
for(const invalid of rejected)assert.throws(()=>restore({...state,portfolios:[invalid]}),/Invalid|unknown|history/);
assert.throws(()=>restore({...state,portfolios:[record,record]}),/Duplicate evidence record/);
assert.throws(()=>restore({...state,portfolios:[record,{...record,id:"another-record"}]}),/Duplicate evidence attempt/);
assert.throws(()=>restore({...state,portfolios:{}}),/Evidence collection/);
assert.throws(()=>restore({...state,portfolios:Array(LIMITS.records+1).fill(record)}),/at most/);
assert.throws(()=>restore({...state,portfolios:[{...record,attempts:Array(LIMITS.attempts+1).fill(attempt)}]}),/no history was removed/);

const forged={...record,reviewer:"Claimed mentor",verified:true,level:6,attempts:[{...attempt,reviewer:"Claimed assessor",verified:true,grade:100,rubric:{...rubric,approved:true}}]};
assert.deepEqual(validatePortfolios([forged],targets),[record],"Unknown authoritative-looking fields never enter learner state");
const literalNote='<script>fictional example</script> & "quoted text"';
assert.equal(newAttempt(target,{...fields,note:literalNote}).note,literalNote,"Notes remain plain data, ready for escaped rendering");

assert.equal(assertBackupSize(state),state);
assert.throws(()=>assertBackupSize({note:"x".repeat(LIMITS.backupBytes)}),/exceeds 5 MB/);
assert.throws(()=>assertBackupSize({note:"é".repeat(LIMITS.backupBytes/2)}),/exceeds 5 MB/,"Backup budget counts UTF-8 bytes, not JavaScript characters");
const largeRubric={...rubric,criterion:"c".repeat(LIMITS.criterion),levels:Array(7).fill("l".repeat(LIMITS.level))};
const largeRecords=Array.from({length:6},(_,r)=>({id:"large-"+r,course:target.course,lesson:target.lesson,competency:target.competency,attempts:Array.from({length:50},(_,a)=>({...attempt,id:"large-"+r+"-"+a,note:"n".repeat(LIMITS.note),rubric:largeRubric}))}));
assert.throws(()=>restore({...state,portfolios:largeRecords}),/exceeds 5 MB/,"Bounded individual records must also fit the whole-backup budget");
const moderateRecords=largeRecords.slice(0,3);
assert.equal(validatePortfolios(moderateRecords,targets).length,3,"The portfolio collection alone fits this budget");
const manyLegacyNotes=Array.from({length:500},(_,index)=>({id:"legacy-"+index,course:"INT-101",note:"n".repeat(4000),date:"2026-11-28"}));
assert.throws(()=>restore({...state,evidence:manyLegacyNotes,portfolios:moderateRecords}),/exceeds 5 MB/,"Legacy notes and new histories must fit the same backup together");
assert.equal(JSON.stringify(record),oldJSON,"Rejected histories and oversized imports leave the existing record intact");

console.log("Portfolio migration, immutable rubric history, reassessment, date, reference, size and authority-boundary tests passed.");
