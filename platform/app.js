import {KEY,fresh,clean,today,complete,review,due,courseProgress,nextLessons,studyOptions,studySelection} from "./state.mjs";
import {ROLES,grounding,guide,makePrompt,recommendations} from "./tutor.mjs";
const main=document.querySelector("#main"), notice=document.querySelector("#notice");
let data, courses, sourceMap, compMap, facultyMap, valid, courseIds, state, storageOK=true;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const href=(page,id="")=>"#"+page+(id?"/"+encodeURIComponent(id):"");
const link=(page,id,label,cls="")=>'<a class="'+cls+'" href="'+href(page,id)+'">'+esc(label)+'</a>';
const safeUrl=v=>{try{const u=new URL(v);return ["https:","http:"].includes(u.protocol)?u.href:null;}catch{return null;}};
const ext=(url,label)=>safeUrl(url)?'<a href="'+esc(safeUrl(url))+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>':esc(label);
function inline(v){
  // Original Markdown is untrusted; escape all raw HTML, and allow only HTTP(S) links.
  const s=String(v), parts=[];let end=0;
  const re=/\[([^\]\n]+)\]\(([^)\n]+)\)|\*\*([^*\n]+)\*\*|`([^`\n]+)`/g;
  for(const m of s.matchAll(re)){parts.push(esc(s.slice(end,m.index)));parts.push(m[1]!==undefined?(safeUrl(m[2])?ext(m[2],m[1]):esc(m[1])):m[3]!==undefined?"<strong>"+esc(m[3])+"</strong>":"<code>"+esc(m[4])+"</code>");end=m.index+m[0].length;}
  parts.push(esc(s.slice(end)));return parts.join("");
}
function md(text){
  const lines=String(text??"").split(/\r?\n/),out=[];let i=0;
  while(i<lines.length){
    const s=lines[i].trim();if(!s){i++;continue;}
    if(/^#{1,6} /.test(s)){const n=Math.min(4,s.match(/^#+/)[0].length+1);out.push("<h"+n+">"+inline(s.replace(/^#+ /,""))+"</h"+n+">");i++;continue;}
    if(s.startsWith("|")&&lines[i+1]&&/^\s*\|[\s:|-]+\|\s*$/.test(lines[i+1])){const cells=x=>x.trim().replace(/^\||\|$/g,"").split("|").map(v=>inline(v.trim()));const head=cells(s);i+=2;let rows=[];while(i<lines.length&&lines[i].trim().startsWith("|"))rows.push(cells(lines[i++]));out.push('<div class="table-wrap"><table><thead><tr>'+head.map(x=>"<th scope=\"col\">"+x+"</th>").join("")+"</tr></thead><tbody>"+rows.map(r=>"<tr>"+r.map(x=>"<td>"+x+"</td>").join("")+"</tr>").join("")+"</tbody></table></div>");continue;}
    const list=/^[-*] /.test(s)?"ul":/^\d+\. /.test(s)?"ol":null;
    if(list){const pattern=list==="ul"?/^[-*] /:/^\d+\. /;let items=[];while(i<lines.length&&pattern.test(lines[i].trim()))items.push("<li>"+inline(lines[i++].trim().replace(pattern,""))+"</li>");out.push("<"+list+">"+items.join("")+"</"+list+">");continue;}
    let paragraph=[s];i++;while(i<lines.length&&lines[i].trim()&&!/^(#{1,6} |[-*] |\d+\. |\|)/.test(lines[i].trim()))paragraph.push(lines[i++].trim());out.push("<p>"+inline(paragraph.join(" "))+"</p>");
  }
  return out.join("");
}
const hero=(tag,title,desc)=>'<header class="hero"><p class="eyebrow">'+esc(tag)+'</p><h1>'+esc(title)+'</h1><p class="intro">'+esc(desc)+'</p></header>';
const badge=(s,ready=false)=>'<span class="tag'+(ready?' ready':'')+'">'+esc(s)+'</span>';
const bar=(n,d,label)=>'<progress class="progress" value="'+n+'" max="'+Math.max(d,1)+'" aria-label="'+esc(label)+'"></progress>';
const box=(body,cls="")=>'<div class="card '+cls+'">'+body+'</div>';
const button=(id,label,primary=false)=>'<button id="'+esc(id)+'" type="button" class="'+(primary?'primary':'')+'">'+esc(label)+'</button>';
const byKey=k=>{const [id,lid]=k.split(".");const c=courses.get(id);return [c,c?.lessons.find(l=>l.id===lid)];};
const lessonTitle=k=>{const [c,l]=byKey(k);return c&&l?c.title+" · "+l.title:k;};
const countDone=()=>Object.keys(state.completed).length;
const available=()=>data.courses.filter(c=>c.authored);
const numDoneCourses=()=>available().filter(c=>courseProgress(state,c)===c.lessons.length).length;
const courseTitle=id=>courses.get(id)?.title??id;
const planIds=()=>new Set(studyOptions(data).map(p=>p.id));
const heading=(s)=>'<h2>'+esc(s)+'</h2>';
const flash=s=>{notice.textContent=s;clearTimeout(flash.timer);flash.timer=setTimeout(()=>{notice.textContent="";},3500);};
const focus=selector=>document.querySelector(selector)?.focus();
function fieldError(selector,messageId,message){
 for(const other of document.querySelectorAll('[aria-invalid="true"]')){
  if((other.getAttribute("aria-describedby")??"").split(/\s+/).includes(messageId))other.removeAttribute("aria-invalid");
 }
 const field=document.querySelector(selector);field.setAttribute("aria-invalid","true");
 document.querySelector("#"+messageId).textContent=message;document.querySelector("#"+messageId).classList.add("field-error");field.focus();
}
function clearFieldError(selector,messageId){
 document.querySelector(selector).addEventListener("input",e=>{if(e.target.hasAttribute("aria-invalid")){e.target.removeAttribute("aria-invalid");document.querySelector("#"+messageId).textContent="";}});
}
function persist(){
  try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;flash("Browser storage unavailable. Export before leaving.");}
}
function loadState(){
  try{const raw=localStorage.getItem(KEY);return raw?clean(JSON.parse(raw),valid,courseIds,planIds()):fresh();}
  catch{storageOK=false;return fresh();}
}
function setPage(html){main.innerHTML=html+'<footer>Ultimo · v0.5 pilot · Curriculum drafts, not accredited instruction.</footer>';document.querySelector("#studyPlanLabel").textContent=studySelection(state,data).title;}
function courseCard(c,level=3){
 const done=courseProgress(state,c);
 return '<a class="card card-link" href="'+href("course",c.id)+'"><div class="row between"><span class="eyebrow">'+esc(c.id)+'</span>'+badge(c.authored?"Draft lessons":"Syllabus only",c.authored)+'</div><h'+level+'>'+esc(c.title)+'</h'+level+'><p class="muted compact">'+esc(facultyMap.get(c.faculty).title)+' · Year '+c.year+' · '+c.estimated_hours+'h</p>'+(c.authored?bar(done,c.lessons.length,c.title+" lessons completed")+'<small>'+done+' / '+c.lessons.length+' lessons completed</small>':'<small>'+c.lessons.length+' lesson blueprints</small>')+'</a>';
}
function home(){
 const selection=studySelection(state,data), reviews=due(state), next=nextLessons(state,data.courses,selection.order), k=next.includes(state.last)?state.last:next[0];
 const resume=k?box('<p class="eyebrow">Continue learning</p><h2>'+esc(lessonTitle(k))+'</h2><p>Follow '+esc(selection.title)+' at your own pace, including its prerequisites. Practice and review matter more than completion speed.</p>'+link("lesson",k,"Open next lesson","primary")):box('<p class="eyebrow">Continue learning</p><h2>Explore your next step</h2><p>No new lessons are ready in this plan. Review your progress, check prerequisites or choose another focus.</p>'+link("planner","","View study plan","primary"));
 setPage(hero("Your university","A life well studied.","Build capability, character, connection and flourishing — one meaningful lesson at a time.")+
 '<div class="stats">'+box('<p class="eyebrow">Lessons completed</p><div class="stat">'+countDone()+' / '+valid.size+'</div>')+box('<p class="eyebrow">Courses read</p><div class="stat">'+numDoneCourses()+' / '+available().length+'</div>')+box('<p class="eyebrow">Reviews due</p><div class="stat">'+reviews.length+'</div>')+'</div>'+
 '<section class="section split">'+resume+box('<p class="eyebrow">Your study plan</p><h2 id="activePlanTitle">'+esc(selection.title)+'</h2><p>'+state.hours+' hours / week · '+reviews.length+' reviews due across all courses.</p>'+link("planner","","Change study plan","primary"))+'</section>'+
 '<section class="section">'+box('<p class="eyebrow">Tutorials</p><h2>Meet your faculty tutors</h2><p>Explore the curriculum with guided explanations, practice examinations and personalised study recommendations.</p>'+link("tutor","","Open tutor studio","primary"))+'</section>'+
 '<section class="section">'+heading("Your faculties")+'<p class="muted compact">Reading progress only, not a measure of your competence or worth.</p>'+box(data.faculties.map(f=>{const cs=data.courses.filter(c=>c.faculty===f.id);const n=cs.reduce((a,c)=>a+courseProgress(state,c),0),d=cs.reduce((a,c)=>a+c.lessons.length,0);return '<div class="bar"><span>'+esc(f.title)+'</span>'+bar(n,d,f.title+" completion")+'<span>'+n+' / '+d+'</span></div>';}).join(""))+'</section>'+
 '<section class="section"><div class="row between">'+heading("Courses in your study plan")+link("courses","","Full catalogue")+'</div><p class="muted">'+esc(selection.title)+' · Written courses and any prerequisites.</p><div class="cards">'+(selection.order.length?selection.order.map(id=>courseCard(courses.get(id))).join(""):'<p class="empty">No written courses are available for this focus yet. Choose another study plan or explore the catalogue.</p>')+'</div></section>');
}
function catalogue(){
 setPage(hero("Curriculum","Faculties & courses","Explore all sixteen faculties. Draft courses can be studied now; other courses show their learning outcomes and planned lessons.")+
 '<div class="controls"><div><label for="search">Search courses</label><input id="search" type="search" placeholder="e.g. negotiation, sleep, philosophy"></div><div><label for="faculty">Faculty</label><select id="faculty"><option value="">All faculties</option>'+data.faculties.map(f=>'<option value="'+esc(f.id)+'">'+esc(f.title)+'</option>').join("")+'</select></div><div><label for="availability">Availability</label><select id="availability"><option value="">All courses</option><option value="authored">Written drafts</option><option value="planned">Syllabus only</option></select></div></div><p id="result-count" class="muted" aria-live="polite"></p><div id="results" class="cards"></div>');
 const update=()=>{const q=document.querySelector("#search").value.toLowerCase().trim(),f=document.querySelector("#faculty").value,a=document.querySelector("#availability").value;const list=data.courses.filter(c=>(!f||c.faculty===f)&&(!a||(a==="authored")===c.authored)&&(!q||[c.id,c.title,facultyMap.get(c.faculty).title,...c.lessons.map(l=>l.title)].join(" ").toLowerCase().includes(q)));document.querySelector("#result-count").textContent=list.length+" courses";document.querySelector("#results").innerHTML=list.length?list.map(c=>courseCard(c,2)).join(""):'<p class="empty">No courses match your filters.</p>';};
 ["search","faculty","availability"].forEach(id=>document.querySelector("#"+id).addEventListener("input",update));update();
}
function showCourse(id){
 const c=courses.get(id);if(!c)return missing();
 const done=courseProgress(state,c), prerequisites=c.prerequisites.filter(p=>{const x=courses.get(p);return !x.authored||courseProgress(state,x)!==x.lessons.length;});
 const reading=c.reading.map(id=>sourceMap.get(id)).filter(Boolean);
 setPage('<p>'+link("courses","","← All courses")+'</p>'+hero(c.id+" · "+facultyMap.get(c.faculty).title,c.title,"Year "+c.year+" · "+c.estimated_hours+" indicative hours · Level "+c.target_level+" guided practice")+
 '<div class="row">'+badge(c.authored?"Draft lessons":"Syllabus only",c.authored)+badge("Independent review pending")+'</div>'+
 (prerequisites.length?'<div class="notice">Recommended prerequisites not yet marked complete: '+prerequisites.map(p=>link("course",p,courseTitle(p))).join(", ")+'. You may still explore; completion is not verified competency.</div>':'')+
 (c.authored?bar(done,c.lessons.length,c.title+" reading progress")+'<p class="muted">'+done+' of '+c.lessons.length+' lessons marked complete</p>':'<p class="notice">This course has an educational blueprint but no authored lessons yet.</p>')+
 '<section class="section">'+heading("Learning outcomes")+'<ul>'+c.learning_outcomes.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul></section>'+
 '<section class="section">'+heading("Lessons")+'<div class="lesson-list">'+c.lessons.map(l=>'<a class="lesson-link" href="'+href("lesson",id+"."+l.id)+'"><span><small>'+esc(l.id)+' · '+l.estimated_minutes+' min</small><br><strong>'+esc(l.title)+'</strong></span>'+badge(state.completed[id+"."+l.id]?"Read":c.authored?"Open":"Blueprint",!!state.completed[id+"."+l.id])+'</a>').join("")+'</div></section>'+
 '<section class="section">'+heading("Reading")+'<div class="stack">'+reading.map(sourceCard).join("")+'</div></section>'+
 '<section class="section">'+heading("Practical assessment")+box('<h3>'+esc(c.assessment.artifact)+'</h3>'+(c.authored?'<div class="article">'+md(c.capstone)+'</div>':'<p>'+esc(c.assessment.threshold)+'</p>')+'<p>'+esc(c.assessment.alternate_evidence)+'</p>'+ (c.authored?link("portfolio",id,"Add private practice evidence","primary"):""))+'</section>');
}
function showLesson(key){
 const [c,l]=byKey(key);if(!c||!l)return missing();
 const idx=c.lessons.indexOf(l),prev=c.lessons[idx-1],next=c.lessons[idx+1];
 const competency=compMap.get(l.competency);
 const nav='<div class="lesson-nav">'+(prev?link("lesson",c.id+"."+prev.id,"← Previous lesson","primary"):"")+(next?link("lesson",c.id+"."+next.id,"Next lesson →","primary"):link("course",c.id,"Course assessment","primary"))+'</div>';
 if(!c.authored){
  setPage('<p>'+link("course",c.id,"← "+c.title)+'</p>'+hero(key,l.title,"Lesson blueprint · Not authored")+'<p class="notice">This is a plan, not a completed lesson or approved teaching material.</p><section class="article">'+heading("Learning outcome")+'<p>'+esc(l.outcome)+'</p>'+heading("Practice brief")+'<p>'+esc(l.practice)+'</p>'+heading("Worked example brief")+'<p>'+esc(l.worked_example_brief)+'</p>'+heading("Evidence criterion")+'<p>'+esc(l.evidence_criterion)+'</p>'+nav+'</section>');return;
 }
 state.last=key;persist();
 const done=!!state.completed[key],r=state.reviews[key],q=l.assessment_record.questions;
 setPage('<p>'+link("course",c.id,"← "+c.title)+'</p>'+hero(key+" · Lesson "+(idx+1)+" of "+c.lessons.length,l.title,l.outcome)+
 '<p class="notice">Draft teaching material. Academic and subject review pending; use fictional or supervised evidence where appropriate.</p>'+
 '<p>'+link("tutor",key,"Study with a tutor","primary")+'</p><div class="article">'+l.sections.filter(s=>s.title&&s.title!=="Knowledge check").map(s=>'<section><h2>'+esc(s.title)+'</h2>'+md(s.body)+'</section>').join("")+
 '<section class="section" id="quiz">'+heading("Knowledge check")+'<p>Recall an answer before opening the model response, then mark whether your own answer was correct. This is formative self-assessment, not AI grading.</p>'+
 box(q.map((x,i)=>'<div class="quiz-item"><p id="question'+i+'"><strong>'+ (i+1)+'. '+esc(x.prompt)+'</strong></p><label for="attempt'+i+'">Your answer to question '+(i+1)+' (not saved)</label><textarea id="attempt'+i+'" aria-describedby="question'+i+'"></textarea><details><summary>Reveal model answer for question '+(i+1)+'</summary><div class="answer">'+esc(x.answer)+'</div><p class="muted compact">'+esc(x.feedback)+'</p><label class="checkbox"><input class="correct" type="checkbox" aria-labelledby="selfCheck'+i+' question'+i+'"> <span id="selfCheck'+i+'">My answer matched the essential idea</span></label></details></div>').join("")+button("saveQuiz","Save self-check",true)+'<p id="quizResult" class="muted" aria-live="polite">'+(state.quizzes[key]?"Previous self-check: "+state.quizzes[key].correct+" / "+state.quizzes[key].total:"No saved self-check yet.")+'</p>')+'</section>'+
 '<section class="section">'+heading("Competency & evidence")+box('<p>'+esc(l.evidence_criterion)+'</p><details><summary>View progression rubric</summary><ol start="0">'+competency.levels.map((x,i)=>'<li><strong>'+esc(data.levels[i].title)+':</strong> '+esc(x)+'</li>').join("")+'</ol></details><p class="muted compact">Reading and self-check scores never award a verified competency level.</p>'+link("portfolio",c.id,"Add practice evidence"))+'</section>'+
 '<section class="section">'+heading("Review and completion")+box('<p id="completionState" tabindex="-1">'+(done?"Marked read "+esc(state.completed[key]):"Mark complete after reading and attempting the practice.")+'</p>'+button("complete",done?"Already marked read":"Mark lesson read",true)+(r&&r.step<4?'<p>Review '+(r.step+1)+' of 4 due '+esc(r.due)+'</p>'+button("reviewLesson","Complete due review"):''))+'</section>'+nav+'</div>');
 document.querySelector("#saveQuiz").addEventListener("click",()=>{
  const unopened=[...document.querySelectorAll("#quiz details")].find(d=>!d.open);if(unopened){document.querySelector("#quizResult").textContent="Reveal and compare every answer before saving.";unopened.querySelector("summary").focus();return;}
  const correct=[...document.querySelectorAll(".correct")].filter(x=>x.checked).length;state.quizzes[key]={date:today(),correct,total:q.length};persist();document.querySelector("#quizResult").textContent="Saved self-check: "+correct+" / "+q.length+". No competency awarded.";flash("Self-check saved locally.");
 });
 document.querySelector("#complete").disabled=done;
 document.querySelector("#complete").addEventListener("click",()=>{complete(state,key);persist();flash("Lesson marked read. First review scheduled.");showLesson(key);focus("#completionState");});
 document.querySelector("#reviewLesson")?.addEventListener("click",()=>{if(!review(state,key)){flash("This review is not yet due.");return;}persist();flash("Review recorded.");showLesson(key);focus("#completionState");});
}
function planner(){
 const selection=studySelection(state,data), adaptive=recommendations(state,data), reviews=due(state);
 const courseRows=selection.order.map(id=>{
  const c=courses.get(id), done=courseProgress(state,c), prereq=selection.prerequisites.includes(id);
  const waiting=c.prerequisites.filter(p=>{const x=courses.get(p);return !x?.authored||courseProgress(state,x)!==x.lessons.length;});
  return '<div class="review"><div class="row between"><strong>'+link("course",id,c.title)+'</strong>'+badge(prereq?"Prerequisite":"Your focus")+'</div><p class="muted compact">'+(c.authored?done+' / '+c.lessons.length+' lessons marked read':'Syllabus only; lessons are not written yet')+'</p>'+(waiting.length?'<p class="compact">Read prerequisites first: '+waiting.map(p=>link("course",p,courseTitle(p))).join(", ")+'.</p>':'')+'</div>';
 }).join("");
 setPage(hero("Study rhythm","Your study planner","Build a sustainable weekly rhythm. New study is suggested only when prerequisites are marked read; reviews are prioritised.")+
 box('<label for="studyPlan">Study focus</label><select id="studyPlan" aria-describedby="planHelp">'+studyOptions(data).map(p=>'<option value="'+esc(p.id)+'"'+(p.id===selection.id?' selected':'')+'>'+esc(p.title)+'</option>').join("")+'</select><p id="planHelp" class="muted compact">Required courses from other faculties are included automatically. Changing focus keeps all your progress, practice notes and review dates.</p><label for="hours">Available study hours per week (1–20)</label><input id="hours" aria-describedby="hoursError" type="number" min="1" max="20" step="1" value="'+state.hours+'"><p id="hoursError" role="alert" class="field-error"></p><p class="muted compact">One hour per new lesson, fifteen minutes per review and twenty minutes per self-check practice. Capstone time is separate. These are estimates, not targets you must meet.</p>'+button("savePlan","Update study plan",true))+
 '<section class="section" id="studyQueue">'+heading("This week’s study queue")+'<p>'+esc(selection.title)+' · '+adaptive.minutes+' / '+adaptive.budget+' minutes planned.</p><p class="muted">New lessons follow your study focus. Due reviews and practice from saved self-checks remain visible across all courses. Reading progress is not verified competence.</p>'+(adaptive.queue.length?box(adaptive.queue.map(x=>'<div class="review row between"><div><strong>'+esc(lessonTitle(x.key))+'</strong><br><small>'+esc(x.reason)+' · '+x.minutes+' min</small></div>'+link("lesson",x.key,"Study")+'</div>').join("")):'<p class="empty">No recommendations are ready for this plan. Check the course list below, choose another focus or browse the catalogue.</p>')+'</section>'+
 '<section class="section">'+heading("Courses in your plan")+'<p>'+selection.targets.length+' written courses in your focus'+(selection.prerequisites.length?' · '+selection.prerequisites.length+' prerequisite courses included':'')+'.</p>'+(selection.unavailable.length?'<p class="muted">'+selection.unavailable.length+' further courses have syllabuses only and are not included in the study queue yet.</p>':'')+(selection.blocked.length?'<p class="notice">Some courses are waiting for prerequisites that have not been written yet. They will enter the queue when those lessons become available and are marked read.</p>':'')+(courseRows?box(courseRows):'<p class="empty">No written courses are available for this focus yet. '+link("courses","","Explore the course catalogue")+'.</p>')+'</section>'+
 '<section class="section">'+heading("All due reviews")+'<p class="muted">Your full review list stays here even when it exceeds this week’s budget.</p>'+(reviews.length?box(reviews.map(k=>'<div class="review row between"><div><strong>'+esc(lessonTitle(k))+'</strong><br><small>Due '+esc(state.reviews[k].due)+'</small></div>'+link("lesson",k,"Review lesson")+'</div>').join("")):'<p class="empty">No reviews due. Reviews appear after you mark a lesson read.</p>')+'</section>');
 clearFieldError("#hours","hoursError");
 document.querySelector("#savePlan").addEventListener("click",()=>{const n=Number(document.querySelector("#hours").value),id=document.querySelector("#studyPlan").value;if(!Number.isInteger(n)||n<1||n>20){fieldError("#hours","hoursError","Enter a whole number from 1 to 20.");return;}if(!planIds().has(id))return;state.hours=n;state.studyPlan=id;persist();planner();document.querySelector("#savePlan").focus();flash(storageOK?"Study plan saved in this browser.":"Study plan updated for this session. Export before leaving.");});
}
function sourceCard(s){return box('<div class="row between">'+badge(s.type||"reference")+badge(s.review_status||"Reference candidate")+'</div><p class="source-title">'+ext(s.url,s.title)+'</p><p class="muted compact">'+esc(s.authors||"")+'</p>'+(s.notes?'<p class="compact">'+esc(s.notes)+'</p>':""));}
function library(){
 setPage(hero("Reading room","Reading library","Books, research and reference material linked to the curriculum. References are not necessarily independently verified. External reading may require purchase or library access.")+
 '<label for="librarySearch">Search titles, authors or subjects</label><input id="librarySearch" type="search" placeholder="Find a book or research paper"><p id="libraryCount" class="muted" aria-live="polite"></p><div id="libraryResults" class="cards"></div>');
 const update=()=>{const q=document.querySelector("#librarySearch").value.toLowerCase().trim(),rows=data.sources.filter(s=>[s.title,s.authors,s.type,s.notes].join(" ").toLowerCase().includes(q));document.querySelector("#libraryCount").textContent=rows.length+" references";document.querySelector("#libraryResults").innerHTML=rows.length?rows.map(sourceCard).join(""):'<p class="empty">No matching references.</p>';};document.querySelector("#librarySearch").addEventListener("input",update);update();
}
function frameworks(){
 setPage(hero("Mental models","Framework library","Reusable frameworks extracted directly from the written draft lessons. These are teaching heuristics, not independently validated interventions.")+
 '<label for="frameworkSearch">Search frameworks</label><input id="frameworkSearch" type="search" placeholder="e.g. retrieval, budget, listening"><p id="frameworkCount" class="muted" aria-live="polite"></p><div id="frameworkResults" class="cards"></div>');
 const update=()=>{const q=document.querySelector("#frameworkSearch").value.toLowerCase().trim(),rows=data.frameworks.filter(f=>[f.title,f.body,courseTitle(f.course)].join(" ").toLowerCase().includes(q));document.querySelector("#frameworkCount").textContent=rows.length+" frameworks";document.querySelector("#frameworkResults").innerHTML=rows.length?rows.map(f=>box('<p class="eyebrow">'+esc(courseTitle(f.course))+'</p><h2>'+esc(f.title)+'</h2>'+md(f.body)+link("lesson",f.id,"Study original lesson"))).join(""):'<p class="empty">No matching frameworks.</p>';};document.querySelector("#frameworkSearch").addEventListener("input",update);update();
}
function portfolio(selected=""){
 const choices=available();
 setPage(hero("Practice & evidence","Evidence portfolio","Keep a brief record of fictional or non-sensitive practical work. These notes are self-recorded and are not assessed or certified by Ultimo.")+
 '<p class="notice">Stored only in this browser, not encrypted or synchronised. Do not enter health records, financial account details, intimate information or confidential work.</p>'+
 box('<label for="eCourse">Course</label><select id="eCourse">'+choices.map(c=>'<option value="'+esc(c.id)+'"'+(c.id===selected?" selected":"")+'>'+esc(c.title)+'</option>').join("")+'</select><label for="eNote">Practice evidence (max 4,000 characters)</label><textarea id="eNote" aria-describedby="eNoteError" maxlength="4000" placeholder="Describe the task, your reasoning, feedback and next step. Use fictional or anonymised examples."></textarea><p id="eNoteError" role="alert" class="field-error"></p>'+button("addEvidence","Save practice note",true))+
 '<section class="section">'+heading("Saved practice notes")+(state.evidence.length?box(state.evidence.map((e,i)=>'<div class="evidence-row"><div class="row between"><strong>'+esc(courseTitle(e.course))+'</strong><small>'+esc(e.date)+'</small></div><p>'+esc(e.note)+'</p><button type="button" aria-label="Delete note for '+esc(courseTitle(e.course))+' dated '+esc(e.date)+'" data-delete-evidence="'+i+'" class="danger">Delete note</button></div>').join("")):'<p class="empty">No practice notes recorded yet.</p>')+'</section>');
 clearFieldError("#eNote","eNoteError");
 document.querySelector("#addEvidence").addEventListener("click",()=>{const course=document.querySelector("#eCourse").value,note=document.querySelector("#eNote").value.trim();if(!note||note.length>4000){fieldError("#eNote","eNoteError","Enter a brief practice note.");return;}if(state.evidence.length>=500){fieldError("#eNote","eNoteError","Portfolio limit reached. Export and remove old notes.");return;}const id=globalThis.crypto?.randomUUID?.()??Date.now()+"-"+Math.random().toString(36).slice(2);state.evidence.unshift({id,course,note,date:today()});persist();portfolio(course);focus("#eNote");flash("Practice note saved locally.");});
 document.querySelectorAll("[data-delete-evidence]").forEach(b=>b.addEventListener("click",()=>{if(!confirm("Delete this note?"))return;state.evidence.splice(Number(b.dataset.deleteEvidence),1);persist();portfolio(selected);focus("#eNote");flash("Note deleted.");}));
}
function settings(){
 setPage(hero("Privacy & portability","Data and settings","You own your learning records. No account, analytics or cloud storage is used. Optional model tutoring is available only through the separately configured local gateway or by copying a prompt into a model of your choice.")+
 '<div class="notice">'+(storageOK?"Browser storage is available.":"Browser storage could not be read or written. Export before closing this page.")+' Data is local to this browser and website origin, not encrypted. Anyone with access to this browser profile may access it.</div>'+
 '<section class="section stack">'+box('<h2>Export your records</h2><p>Download a JSON backup containing your study plan, read marks, review dates, quiz self-check scores and practice notes. Treat it as private.</p>'+button("exportData","Download JSON backup",true))+box('<h2>Restore a backup</h2><p>Restoring replaces local records. Only valid curriculum IDs and supported data fields are accepted.</p><label for="importData">Choose JSON file (max 5 MB)</label><input id="importData" aria-describedby="importResult" type="file" accept=".json,application/json"><p id="importResult" role="status" class="muted"></p>')+box('<h2>Erase local records</h2><p>Removes all Ultimo learner records from this browser. It does not remove exported copies.</p><button type="button" id="erase" class="danger">Erase all local data</button><p id="eraseResult" role="status"></p>')+'</section>');
 document.querySelector("#exportData").addEventListener("click",()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="ultimo-backup-"+today()+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 document.querySelector("#importData").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error("Backup exceeds 5 MB.");const imported=clean(JSON.parse(await file.text()),valid,courseIds,planIds());if(!confirm("Replace all existing local records with this backup?"))return;state=imported;persist();settings();document.querySelector("#importResult").textContent="Backup restored.";focus("#importData");}catch(err){fieldError("#importData","importResult","Import failed: "+err.message);}finally{e.target.value="";}});
 document.querySelector("#erase").addEventListener("click",()=>{if(!confirm("Permanently erase all local Ultimo records?"))return;state=fresh();try{localStorage.removeItem(KEY);storageOK=true;}catch{storageOK=false;}settings();document.querySelector("#eraseResult").textContent=storageOK?"Local data erased.":"In-memory data erased; browser storage unavailable.";focus("#erase");});
}
let tutorSession=null;
function tutorStudio(initial=""){
 const selection=studySelection(state,data), suggested=recommendations(state,data).queue[0], first=valid.has(initial)?initial:suggested?.key??(valid.has(state.last)?state.last:valid.values().next().value);
 if(!tutorSession||initial&&initial!==tutorSession.key)tutorSession={key:first,role:"professor",query:"",step:0,history:[],provider:null,token:null,modelAnswer:null,error:"",loading:false,requestId:0};
 const t=tutorSession, ctx=grounding(data,t.key,t.query);
 const choices=available().map(c=>'<optgroup label="'+esc(c.title)+'">'+c.lessons.map(l=>{const k=c.id+"."+l.id;return '<option value="'+esc(k)+'"'+(k===t.key?" selected":"")+'>'+esc(l.title)+'</option>';}).join("")+'</optgroup>').join("");
 const roles=ROLES.map(r=>'<option value="'+esc(r.id)+'"'+(r.id===t.role?" selected":"")+'>'+esc(r.name)+'</option>').join("");
 const g=guide(ctx,t.role,t.query,t.step);
 setPage(hero("Faculty tutoring","Tutor studio","Explore the written curriculum, practise your reasoning and receive formative guidance. All tutoring is grounded in the selected authored lesson.")+
 box('<p class="eyebrow">Your study plan</p><h2>'+esc(selection.title)+'</h2>'+(suggested?'<p>'+esc(lessonTitle(suggested.key))+' · '+esc(suggested.reason)+'</p>'+link("tutor",suggested.key,"Tutor this lesson","primary"):'<p>No study recommendations are ready for this plan. You can still explore any written lesson.</p>')+'<p class="compact">'+link("planner","","Change study plan")+'</p>')+
 '<div class="notice">Draft material; independent review pending. No clinical, financial or legal advice, automatic grading or certification. Do not enter private or sensitive information.</div>'+
 box('<div class="controls tutor-controls"><div><label for="tutorLesson">Lesson</label><select id="tutorLesson">'+choices+'</select></div><div><label for="tutorRole">Tutor role</label><select id="tutorRole">'+roles+'</select></div></div><p class="muted">'+esc(ROLES.find(r=>r.id===t.role).instruction)+'</p><p>'+link("lesson",t.key,"Read original lesson")+'</p>')+
 '<section class="section">'+heading("Curriculum guide")+'<p class="muted">Available on the public website without a model. This is a deterministic curriculum guide, not generative AI.</p>'+box('<label for="tutorQuery">Question or topic (max 2,000 characters)</label><textarea id="tutorQuery" aria-describedby="modelError" maxlength="2000" placeholder="Ask about the concept, or enter a topic to find relevant passages">'+esc(t.query)+'</textarea><div class="row">'+button("findPassages","Find guidance",true)+button("copyPrompt","Copy AI tutor prompt")+'</div><p class="compact muted">The copied prompt contains the selected lesson and your current question only. Paste into a model you choose; provider privacy terms apply. No portfolio or personal study records are included.</p>')+
 '<div class="section" id="guidanceResult" tabindex="-1" role="region" aria-label="Curriculum guidance">'+box('<p>'+esc(g.message)+'</p>'+g.sections.map(s=>'<details open><summary>'+esc(s.title)+'</summary><div class="article">'+md(s.text)+'</div><small>'+esc(s.id)+'</small></details>').join("")+(g.question?'<div class="quiz-item"><h3>Practice question '+(t.step%ctx.questions.length+1)+' / '+ctx.questions.length+'</h3><p id="practiceQuestion">'+esc(g.question.prompt)+'</p><label for="practiceResponse">Your attempt (not stored)</label><textarea id="practiceResponse" aria-describedby="practiceQuestion"></textarea><details><summary>Reveal model answer after attempting</summary><p>'+esc(g.question.answer)+'</p><p class="muted">Compare reasoning, not just wording. No grade is awarded.</p></details>'+button("nextPractice","Next question")+'</div>':"")+'<details><summary>Lesson references and limitations</summary>'+ctx.sources.map(s=>'<p>'+ext(s.url,s.title)+' <small>'+esc(s.review_status)+'</small></p>').join("")+'<p>'+esc(ctx.safety)+'</p></details>')+'</div></section>'+
 '<section class="section">'+heading("Model-powered tutoring")+'<p id="providerState" role="status" class="muted">'+(t.provider?"Local gateway connected: "+esc(t.provider):"Checking whether a local model gateway is available…")+'</p>'+box('<p>The public static site does not hold model credentials. A locally configured gateway can use Ollama or OpenAI. Model responses can be wrong and citations are checked for ID membership only.</p><label class="checkbox"><input id="providerConsent" aria-describedby="modelError" type="checkbox"> I consent to send my current question and recent tutor turns to the configured provider. No portfolio or learner records are sent.</label><div class="row">'+button("askModel",t.loading?"Generating…":"Ask model tutor",true)+button("clearChat","Clear conversation")+'</div><p id="modelError" role="status" class="field-error">'+esc(t.error)+'</p><div id="tutorConversation" tabindex="-1" role="region" aria-label="Tutor conversation" aria-live="polite">'+t.history.map(x=>'<div class="review"><p class="eyebrow">'+esc(x.role==="user"?"You":"Model tutor")+'</p><div class="article">'+md(x.text)+'</div></div>').join("")+(t.modelAnswer?'<p class="compact muted">'+esc(t.modelAnswer)+'</p>':"")+'</div>')+'</section>');
 clearFieldError("#tutorQuery","modelError");clearFieldError("#providerConsent","modelError");
 const readQuery=()=>document.querySelector("#tutorQuery").value.trim().slice(0,2000);
 const reset=()=>{t.requestId++;t.history=[];t.step=0;t.modelAnswer=null;t.error="";t.loading=false;};
 document.querySelector("#tutorLesson").addEventListener("change",e=>{t.query="";t.key=e.target.value;reset();history.replaceState(null,"",href("tutor",t.key));tutorStudio(t.key);focus("#tutorLesson");});
 document.querySelector("#tutorRole").addEventListener("change",e=>{t.query=readQuery();t.role=e.target.value;reset();tutorStudio();focus("#tutorRole");});
 document.querySelector("#findPassages").addEventListener("click",()=>{t.query=readQuery();tutorStudio();focus("#guidanceResult");});
 document.querySelector("#nextPractice")?.addEventListener("click",()=>{t.step++;tutorStudio();focus("#practiceResponse");});
 document.querySelector("#copyPrompt").addEventListener("click",async()=>{t.query=readQuery();const prompt=makePrompt(grounding(data,t.key,t.query),t.role,t.query||"Begin a tutorial.");try{await navigator.clipboard.writeText(prompt);flash("Grounded tutor prompt copied.");}catch{const a=document.createElement("textarea");a.value=prompt;a.setAttribute("aria-label","Tutor prompt to copy");document.querySelector("#copyPrompt").after(a);a.focus();a.select();flash("Select and copy the prompt manually.");}});
 document.querySelector("#clearChat").addEventListener("click",()=>{reset();tutorStudio();focus("#tutorQuery");flash("Conversation cleared.");});
 const ask=document.querySelector("#askModel"), status=document.querySelector("#providerState");
 ask.disabled=!t.provider||t.loading;
 // Do not probe a remote endpoint on the public site; local gateway only.
 if(location.hostname==="127.0.0.1"){
  fetch("./api/tutor/status",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(r=>{if(!r.enabled||!["ollama","openai"].includes(r.provider)||typeof r.csrf!=="string")throw Error();t.provider=r.provider;t.token=r.csrf;status.textContent="Local gateway connected: "+r.provider+(r.provider==="openai"?" (cloud; API usage may incur charges)":" (local model configured)");ask.disabled=t.loading;}).catch(()=>{t.provider=null;t.token=null;status.textContent="Local model gateway unavailable. Use the curriculum guide or copy an AI prompt.";ask.disabled=true;});
 }else{status.textContent="Model inference is not enabled on this static website. Use the guide or copy an AI tutor prompt.";ask.disabled=true;}
 ask.addEventListener("click",async()=>{
  const question=readQuery(),consent=document.querySelector("#providerConsent").checked;
  if(!question){fieldError("#tutorQuery","modelError","Enter a question before asking the tutor.");return;}if(!consent){fieldError("#providerConsent","modelError","Consent is required before sending this question to the configured provider.");return;}t.error="";document.querySelector("#modelError").textContent="";
  const key=t.key,role=t.role,history=t.history.slice(-6).map(x=>({role:x.role,text:x.text.slice(0,2000)}));const requestId=++t.requestId;t.query=question;t.loading=true;ask.disabled=true;ask.textContent="Generating…";
  try{const r=await fetch("./api/tutor",{method:"POST",headers:{"Content-Type":"application/json","X-Ultimo-Token":t.token},body:JSON.stringify({lesson:key,role,question,history,consent:true})});const result=await r.json();if(!r.ok||typeof result.answer!=="string")throw Error(result.error||"Model request failed.");if(tutorSession!==t||t.requestId!==requestId||t.key!==key||t.role!==role||!t.loading)return;t.history=[...t.history,{role:"user",text:question},{role:"assistant",text:result.answer}].slice(-6);const c=result.citations;t.modelAnswer="Citation ID check: "+(c?.cited?.length||0)+" known IDs, "+(c?.unknown?.length||0)+" unknown IDs. Claim accuracy is not verified.";t.query="";}
  catch(e){if(tutorSession===t&&t.requestId===requestId&&t.key===key&&t.role===role){t.error=e.message;document.querySelector("#modelError")?.replaceChildren(document.createTextNode(e.message));}}
  finally{if(tutorSession===t&&t.requestId===requestId){t.loading=false;if(location.hash.split("/")[0]==="#tutor"&&document.querySelector("#tutorQuery")&&t.key===key&&t.role===role){const active=document.activeElement,restore=main.contains(active)?active.id||(t.error?"tutorQuery":"tutorConversation"):active===document.body?(t.error?"tutorQuery":"tutorConversation"):null;const currentQuery=readQuery();if(currentQuery!==question)t.query=currentQuery;tutorStudio();if(restore)focus("#"+restore);}}}
 });
}

function missing(){setPage(hero("Ultimo","Page not found","This course or lesson is not in the current curriculum.")+link("home","","Return to overview","primary"));}
function route(focus=true){
 const raw=location.hash.slice(1)==="main"?"home":location.hash.slice(1)||"home";
 let [page,arg=""]=raw.split("/");try{arg=decodeURIComponent(arg);}catch{page="missing";}
 const pages={home,tutor:()=>tutorStudio(arg),courses:catalogue,course:()=>showCourse(arg),lesson:()=>showLesson(arg),planner,library,frameworks,portfolio:()=>portfolio(arg),settings};
 const render=Object.hasOwn(pages,page)?pages[page]:missing;
 document.querySelectorAll("nav a").forEach(a=>{if(a.dataset.nav===(["course","lesson"].includes(page)?"courses":page))a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
 document.querySelector("#sidebar").classList.remove("open");document.querySelector("#menu").setAttribute("aria-expanded","false");
 render();document.title=(main.querySelector("h1")?.textContent??"Ultimo")+" · Ultimo";if(focus){main.focus({preventScroll:true});window.scrollTo(0,0);}
}
async function boot(){
 try{
  const response=await fetch("./curriculum.json");if(!response.ok)throw Error("Curriculum data unavailable");
  data=await response.json();courses=new Map(data.courses.map(c=>[c.id,c]));sourceMap=new Map(data.sources.map(s=>[s.id,s]));compMap=new Map(data.competencies.map(c=>[c.id,c]));facultyMap=new Map(data.faculties.map(f=>[f.id,f]));valid=new Set(available().flatMap(c=>c.lessons.map(l=>c.id+"."+l.id)));courseIds=new Set(available().map(c=>c.id));state=loadState();
  window.addEventListener("hashchange",()=>route());
  document.querySelector("#menu").addEventListener("click",()=>{const open=document.querySelector("#sidebar").classList.toggle("open");document.querySelector("#menu").setAttribute("aria-expanded",String(open));});
  // The current route does not emit hashchange, but its menu must still close.
  document.querySelectorAll("nav a").forEach(a=>a.addEventListener("click",event=>{
   if(!event.defaultPrevented&&event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&a.hash===location.hash){event.preventDefault();route();}
  }));
  document.querySelector(".skip").addEventListener("click",e=>{e.preventDefault();main.focus();main.scrollIntoView();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.querySelector("#sidebar").classList.contains("open")){document.querySelector("#sidebar").classList.remove("open");document.querySelector("#menu").setAttribute("aria-expanded","false");focus("#menu");}});
  route(false);if(!storageOK)flash("Local storage unavailable or unreadable. Check Data & settings.");
 }
 catch(err){main.textContent="Ultimo could not load: "+err.message+". Run the build and serve the dist directory over HTTP.";}
}
boot();
