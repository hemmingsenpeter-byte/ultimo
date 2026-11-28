import assert from "node:assert/strict";
import {fresh,clean,today,addDays,complete,review,due,courseProgress,nextLessons,plan,studyOptions,studySelection} from "../platform/state.mjs";
const c1={id:"INT-101",authored:true,prerequisites:[],lessons:[{id:"L01"},{id:"L02"}]};
const c2={id:"MEN-101",authored:true,prerequisites:["INT-101"],lessons:[{id:"L01"}]};
const c3={id:"MEN-102",authored:false,prerequisites:["MEN-101"],lessons:[{id:"L01"}]};
const courses=[c1,c2,c3],order=courses.map(c=>c.id),s=fresh(),day="2026-11-26";
assert.equal(today(new Date(2026,10,26)),day);
assert.equal(addDays("2026-12-31",1),"2027-01-01");
assert.deepEqual(nextLessons(s,courses,order),["INT-101.L01"]);
complete(s,"INT-101.L01",day);
assert.equal(s.reviews["INT-101.L01"].due,"2026-11-27");
assert.equal(courseProgress(s,c1),1);
assert.deepEqual(nextLessons(s,courses,order),["INT-101.L02"]);
assert.equal(review(s,"INT-101.L01",day),false);
assert.deepEqual(due(s,"2026-11-27"),["INT-101.L01"]);
assert.equal(review(s,"INT-101.L01","2026-11-27"),true);
assert.equal(s.reviews["INT-101.L01"].due,"2026-11-29");
assert.equal(review(s,"INT-101.L01","2026-11-29"),true);
assert.equal(review(s,"INT-101.L01","2026-12-03"),true);
assert.equal(review(s,"INT-101.L01","2026-12-26"),true);
assert.equal(s.reviews["INT-101.L01"].step,4);
assert.deepEqual(due(s,"2027-01-01"),[]);
complete(s,"INT-101.L02",day);
assert.deepEqual(nextLessons(s,courses,order),["MEN-101.L01"]);
complete(s,"INT-101.L02","2026-12-01");
assert.equal(s.completed["INT-101.L02"],day);
s.hours=1;
assert.equal(plan(s,courses,order,"2026-11-27").lessons.length,0);
assert.equal(plan(s,courses,order,"2026-11-27").reviews.length,1);
const valid=new Set(["INT-101.L01","INT-101.L02","MEN-101.L01"]),ids=new Set(["INT-101","MEN-101"]);
const raw=JSON.parse(JSON.stringify(s));raw.completed["MEN-102.L01"]=day;raw.hours=99;raw.quizzes["INT-101.L01"]={date:day,correct:4,total:3};raw.evidence=[{id:"ok",course:"INT-101",note:"fictional",date:day},{id:"bad",course:"MEN-102",note:"invalid course",date:day}];
const imported=clean(raw,valid,ids);
assert.equal(imported.completed["MEN-102.L01"],undefined);
assert.equal(imported.hours,5);
assert.equal(imported.quizzes["INT-101.L01"],undefined);
assert.equal(imported.evidence.length,1);
assert.throws(()=>clean({version:3},valid,ids));
assert.equal(fresh().version,2);
assert.deepEqual(fresh().portfolios,[]);
assert.equal(clean({version:1,evidence:[{id:"legacy",course:"INT-101",note:"Original course note",date:day}]},valid,ids).version,2);

const foundation={...c1,faculty:"INT"};
const bridge={id:"INT-102",faculty:"INT",authored:true,prerequisites:[foundation.id],lessons:[{id:"L01"}]};
const attention={id:"MEN-102",faculty:"MEN",authored:true,prerequisites:[bridge.id],lessons:[{id:"L01"}]};
const motivation={...attention,id:"MEN-103"};
const unwritten={...attention,id:"MEN-104",authored:false,prerequisites:[]};
const focusData={courses:[foundation,attention,motivation,bridge,unwritten],semester:[foundation.id],faculties:[{id:"INT",title:"Intellectual"},{id:"MEN",title:"Mental"}]};
assert.deepEqual(studyOptions(focusData),[
  {id:"foundation",title:"Foundation semester"},{id:"all",title:"All written courses"},
  {id:"faculty:INT",title:"Intellectual faculty"},{id:"faculty:MEN",title:"Mental faculty"}
]);
const focused=fresh();
assert.equal(focused.studyPlan,"foundation");
assert.deepEqual(studySelection(focused,focusData).targets,[foundation.id]);
focused.studyPlan="faculty:MEN";
assert.deepEqual(studySelection(focused,focusData),{
  id:"faculty:MEN",title:"Mental faculty",order:[foundation.id,bridge.id,attention.id,motivation.id],
  targets:[attention.id,motivation.id],prerequisites:[foundation.id,bridge.id],unavailable:[unwritten.id],blocked:[]
});
assert.deepEqual(nextLessons(focused,focusData.courses,studySelection(focused,focusData).order),["INT-101.L01"]);
complete(focused,"INT-101.L01",day);complete(focused,"INT-101.L02",day);
assert.deepEqual(nextLessons(focused,focusData.courses,studySelection(focused,focusData).order),["INT-102.L01"]);
complete(focused,"INT-102.L01",day);
assert.deepEqual(nextLessons(focused,focusData.courses,studySelection(focused,focusData).order),["MEN-102.L01","MEN-103.L01"]);
const progress=JSON.stringify(focused.completed);
focused.studyPlan="foundation";
assert.deepEqual(nextLessons(focused,focusData.courses,studySelection(focused,focusData).order),[]);
focused.studyPlan="all";
assert.deepEqual(studySelection(focused,focusData).unavailable,[]);
assert.deepEqual(studySelection(focused,focusData).targets,[foundation.id,attention.id,motivation.id,bridge.id]);
assert.deepEqual(nextLessons(focused,focusData.courses,studySelection(focused,focusData).order),["MEN-102.L01","MEN-103.L01"]);
assert.equal(JSON.stringify(focused.completed),progress,"Changing focus preserves all reading records");
focused.studyPlan="faculty:UNKNOWN";
assert.equal(studySelection(focused,focusData).id,"foundation");

const unreadyBridge={...bridge,prerequisites:[unwritten.id,"MISSING-101"]};
const blockedData={...focusData,courses:[foundation,attention,motivation,unreadyBridge,unwritten]};
focused.studyPlan="faculty:MEN";
const blockedSelection=studySelection(focused,blockedData);
assert.deepEqual(blockedSelection.order,[unwritten.id,bridge.id,attention.id,motivation.id]);
assert.deepEqual(blockedSelection.prerequisites,[unwritten.id,bridge.id]);
assert.deepEqual(blockedSelection.blocked,[
  {course:attention.id,prerequisites:[unwritten.id,"MISSING-101"]},
  {course:motivation.id,prerequisites:[unwritten.id,"MISSING-101"]}
]);
assert.deepEqual(nextLessons(focused,blockedData.courses,blockedSelection.order),[],"An unread transitive prerequisite cannot be bypassed by manually marking its dependent course read");
const cycleA={...attention,id:"CYCLE-A",prerequisites:["CYCLE-B"]},cycleB={...attention,id:"CYCLE-B",prerequisites:["CYCLE-A"]};
const cycleData={...focusData,courses:[cycleA,cycleB]};
const cyclicSelection=studySelection(focused,cycleData);
assert.deepEqual(cyclicSelection.order,[cycleB.id,cycleA.id]);
assert.deepEqual(nextLessons(fresh(),cycleData.courses,cyclicSelection.order),[]);
const unknownSemester={...focusData,semester:["MISSING-COURSE",foundation.id,foundation.id]};
assert.deepEqual(studySelection(fresh(),unknownSemester).unavailable,["MISSING-COURSE"]);
assert.deepEqual(studySelection(fresh(),unknownSemester).order,[foundation.id]);

const focusValid=new Set(focusData.courses.filter(c=>c.authored).flatMap(c=>c.lessons.map(l=>c.id+"."+l.id)));
const focusCourseIds=new Set(focusData.courses.filter(c=>c.authored).map(c=>c.id));
const planIds=new Set(studyOptions(focusData).map(p=>p.id));
const legacy=JSON.parse(JSON.stringify(focused));delete legacy.studyPlan;
legacy.version=1;delete legacy.portfolios;
assert.equal(clean(legacy,focusValid,focusCourseIds,planIds).studyPlan,"foundation","Old version 1 backups retain their study-plan default");
const backup=JSON.parse(JSON.stringify({...focused,studyPlan:"faculty:MEN"}));
assert.deepEqual(clean(backup,focusValid,focusCourseIds,planIds),backup,"Validated focus and records survive a JSON backup roundtrip");
assert.equal(clean({...backup,studyPlan:"faculty:UNKNOWN"},focusValid,focusCourseIds,planIds).studyPlan,"foundation");
assert.equal(clean({...backup,studyPlan:7},focusValid,focusCourseIds,planIds).studyPlan,"foundation");
assert.equal(clean({...backup,studyPlan:"all"},focusValid,focusCourseIds).studyPlan,"all");
assert.equal(clean(backup,focusValid,focusCourseIds).studyPlan,"foundation","Faculty selection needs a known curriculum plan ID");
console.log("Ultimo local-state, study selection, prerequisite, review and import tests passed.");
