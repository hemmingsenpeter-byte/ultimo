import {KEY,fresh,clean,today,complete,review,due,courseProgress,nextLessons,plan} from "./state.mjs";
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
const heading=(s)=>'<h2>'+esc(s)+'</h2>';
const flash=s=>{notice.textContent=s;clearTimeout(flash.timer);flash.timer=setTimeout(()=>{notice.textContent="";},3500);};
function persist(){
  try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;flash("Browser storage unavailable. Export before leaving.");}
}
function loadState(){
  try{const raw=localStorage.getItem(KEY);return raw?clean(JSON.parse(raw),valid,courseIds):fresh();}
  catch{storageOK=false;return fresh();}
}
function setPage(html){main.innerHTML=html+'<footer>Ultimo · v0.4 pilot · Curriculum drafts, not accredited instruction.</footer>';}
function courseCard(c){
 const done=courseProgress(state,c);
 return '<a class="card card-link" href="'+href("course",c.id)+'"><div class="row between"><span class="eyebrow">'+esc(c.id)+'</span>'+badge(c.authored?"Draft lessons":"Syllabus only",c.authored)+'</div><h3>'+esc(c.title)+'</h3><p class="muted compact">'+esc(facultyMap.get(c.faculty).title)+' · Year '+c.year+' · '+c.estimated_hours+'h</p>'+(c.authored?bar(done,c.lessons.length,c.title+" lessons completed")+'<small>'+done+' / '+c.lessons.length+' lessons completed</small>':'<small>'+c.lessons.length+' lesson blueprints</small>')+'</a>';
}
function home(){
 const reviews=due(state), next=nextLessons(state,data.courses,data.semester), k=next.includes(state.last)?state.last:next[0];
 const resume=k?box('<p class="eyebrow">Continue learning</p><h2>'+esc(lessonTitle(k))+'</h2><p>Follow the foundation semester at your own pace. Practice and review matter more than completion speed.</p>'+link("lesson",k,"Open next lesson","primary")):box('<p class="eyebrow">Continue learning</p><h2>Explore your next step</h2><p>Review completed material or explore the course catalogue.</p>'+link("courses","","Browse courses","primary"));
 setPage(hero("Your university","A life well studied.","Build capability, character, connection and flourishing — one meaningful lesson at a time.")+
 '<div class="stats">'+box('<p class="eyebrow">Lessons completed</p><div class="stat">'+countDone()+' / '+valid.size+'</div>')+box('<p class="eyebrow">Courses read</p><div class="stat">'+numDoneCourses()+' / '+available().length+'</div>')+box('<p class="eyebrow">Reviews due</p><div class="stat">'+reviews.length+'</div>')+'</div>'+
 '<section class="section split">'+resume+box('<p class="eyebrow">Your study plan</p><h2>'+state.hours+' hours / week</h2><p>'+reviews.length+' reviews due. A flexible plan based on the authored semester and prerequisite order.</p>'+link("planner","","View study plan","primary"))+'</section>'+
 '<section class="section">'+heading("Your faculties")+'<p class="muted compact">Reading progress only, not a measure of your competence or worth.</p>'+box(data.faculties.map(f=>{const cs=data.courses.filter(c=>c.faculty===f.id);const n=cs.reduce((a,c)=>a+courseProgress(state,c),0),d=cs.reduce((a,c)=>a+c.lessons.length,0);return '<div class="bar"><span>'+esc(f.title)+'</span>'+bar(n,d,f.title+" completion")+'<span>'+n+' / '+d+'</span></div>';}).join(""))+'</section>'+
 '<section class="section"><div class="row between">'+heading("Foundation semester")+link("courses","","Full catalogue")+'</div><div class="cards">'+data.semester.map(id=>courseCard(courses.get(id))).join("")+'</div></section>');
}
function catalogue(){
 setPage(hero("Curriculum","Faculties & courses","Explore all sixteen faculties. Draft courses can be studied now; other courses show their learning outcomes and planned lessons.")+
 '<div class="controls"><div><label for="search">Search courses</label><input id="search" type="search" placeholder="e.g. negotiation, sleep, philosophy"></div><div><label for="faculty">Faculty</label><select id="faculty"><option value="">All faculties</option>'+data.faculties.map(f=>'<option value="'+esc(f.id)+'">'+esc(f.title)+'</option>').join("")+'</select></div><div><label for="availability">Availability</label><select id="availability"><option value="">All courses</option><option value="authored">Written drafts</option><option value="planned">Syllabus only</option></select></div></div><p id="result-count" class="muted" aria-live="polite"></p><div id="results" class="cards"></div>');
 const update=()=>{const q=document.querySelector("#search").value.toLowerCase().trim(),f=document.querySelector("#faculty").value,a=document.querySelector("#availability").value;const list=data.courses.filter(c=>(!f||c.faculty===f)&&(!a||(a==="authored")===c.authored)&&(!q||[c.id,c.title,facultyMap.get(c.faculty).title,...c.lessons.map(l=>l.title)].join(" ").toLowerCase().includes(q)));document.querySelector("#result-count").textContent=list.length+" courses";document.querySelector("#results").innerHTML=list.length?list.map(courseCard).join(""):'<p class="empty">No courses match your filters.</p>';};
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
 '<div class="article">'+l.sections.filter(s=>s.title&&s.title!=="Knowledge check").map(s=>'<section><h2>'+esc(s.title)+'</h2>'+md(s.body)+'</section>').join("")+
 '<section class="section" id="quiz">'+heading("Knowledge check")+'<p>Recall an answer before opening the model response, then mark whether your own answer was correct. This is formative self-assessment, not AI grading.</p>'+
 box(q.map((x,i)=>'<div class="quiz-item"><p><strong>'+ (i+1)+'. '+esc(x.prompt)+'</strong></p><label for="attempt'+i+'" class="sr-only">Your answer '+(i+1)+'</label><textarea id="attempt'+i+'" placeholder="Write your answer (not saved)"></textarea><details><summary>Reveal model answer</summary><div class="answer">'+esc(x.answer)+'</div><p class="muted compact">'+esc(x.feedback)+'</p><label class="checkbox"><input class="correct" type="checkbox"> My answer matched the essential idea</label></details></div>').join("")+button("saveQuiz","Save self-check",true)+'<p id="quizResult" class="muted" aria-live="polite">'+(state.quizzes[key]?"Previous self-check: "+state.quizzes[key].correct+" / "+state.quizzes[key].total:"No saved self-check yet.")+'</p>')+'</section>'+
 '<section class="section">'+heading("Competency & evidence")+box('<p>'+esc(l.evidence_criterion)+'</p><details><summary>View progression rubric</summary><ol start="0">'+competency.levels.map((x,i)=>'<li><strong>'+esc(data.levels[i].title)+':</strong> '+esc(x)+'</li>').join("")+'</ol></details><p class="muted compact">Reading and self-check scores never award a verified competency level.</p>'+link("portfolio",c.id,"Add practice evidence"))+'</section>'+
 '<section class="section">'+heading("Review and completion")+box('<p id="completionState">'+(done?"Marked read "+esc(state.completed[key]):"Mark complete after reading and attempting the practice.")+'</p>'+button("complete",done?"Already marked read":"Mark lesson read",true)+(r&&r.step<4?'<p>Review '+(r.step+1)+' of 4 due '+esc(r.due)+'</p>'+button("reviewLesson","Complete due review"):''))+'</section>'+nav+'</div>');
 document.querySelector("#saveQuiz").addEventListener("click",()=>{
  if([...document.querySelectorAll("#quiz details")].some(d=>!d.open)){flash("Reveal and compare all three answers before saving.");return;}
  const correct=[...document.querySelectorAll(".correct")].filter(x=>x.checked).length;state.quizzes[key]={date:today(),correct,total:q.length};persist();document.querySelector("#quizResult").textContent="Saved self-check: "+correct+" / "+q.length+". No competency awarded.";flash("Self-check saved locally.");
 });
 document.querySelector("#complete").disabled=done;
 document.querySelector("#complete").addEventListener("click",()=>{complete(state,key);persist();flash("Lesson marked read. First review scheduled.");showLesson(key);document.querySelector("#completionState").scrollIntoView({block:"center"});});
 document.querySelector("#reviewLesson")?.addEventListener("click",()=>{if(!review(state,key)){flash("This review is not yet due.");return;}persist();flash("Review recorded.");showLesson(key);document.querySelector("#completionState").scrollIntoView({block:"center"});});
}
function planner(){
 const p=plan(state,data.courses,data.semester);
 setPage(hero("Study rhythm","Your study planner","Build a sustainable weekly rhythm. New study is suggested only when prerequisites are marked read; reviews are prioritised.")+
 box('<label for="hours">Available study hours per week (1–20)</label><input id="hours" type="number" min="1" max="20" step="1" value="'+state.hours+'"><p class="muted compact">One hour per lesson, fifteen minutes per review. Capstone time is separate. These are estimates, not targets you must meet.</p>'+button("saveHours","Update plan",true))+
 '<section class="section">'+heading("Due reviews")+(p.reviews.length?box(p.reviews.map(k=>'<div class="review row between"><div><strong>'+esc(lessonTitle(k))+'</strong><br><small>Due '+esc(state.reviews[k].due)+'</small></div>'+link("lesson",k,"Review lesson")+'</div>').join("")):'<p class="empty">No reviews due. Reviews appear after you mark a lesson read.</p>')+'</section>'+
 '<section class="section">'+heading("Suggested next lessons")+'<p class="muted">'+p.minutes+' minutes estimated, including due reviews. This is a rolling queue; completing a lesson unlocks the next suggestion.</p>'+(p.lessons.length?box(p.lessons.map((k,i)=>'<div class="review row between"><span class="plan-number">'+(i+1)+'</span><strong>'+esc(lessonTitle(k))+'</strong>'+link("lesson",k,"Study")+'</div>').join("")):'<p class="empty">No new lessons fit the current plan. Review material, adjust hours or browse courses.</p>')+'</section>');
 document.querySelector("#saveHours").addEventListener("click",()=>{const n=Number(document.querySelector("#hours").value);if(!Number.isInteger(n)||n<1||n>20){flash("Enter a whole number from 1 to 20.");return;}state.hours=n;persist();planner();flash("Study plan updated.");});
}
function sourceCard(s){return box('<div class="row between">'+badge(s.type||"reference")+badge(s.review_status||"Reference candidate")+'</div><p class="source-title">'+ext(s.url,s.title)+'</p><p class="muted compact">'+esc(s.authors||"")+'</p>'+(s.notes?'<p class="compact">'+esc(s.notes)+'</p>':""));}
function library(){
 setPage(hero("Reading room","Reading library","Books, research and reference material linked to the curriculum. References are not necessarily independently verified. External reading may require purchase or library access.")+
 '<label for="librarySearch">Search titles, authors or subjects</label><input id="librarySearch" type="search" placeholder="Find a book or research paper"><p id="libraryCount" class="muted" aria-live="polite"></p><div id="libraryResults" class="cards"></div>');
 const update=()=>{const q=document.querySelector("#librarySearch").value.toLowerCase().trim(),rows=data.sources.filter(s=>[s.title,s.authors,s.type,s.notes].join(" ").toLowerCase().includes(q));document.querySelector("#libraryCount").textContent=rows.length+" references";document.querySelector("#libraryResults").innerHTML=rows.length?rows.map(sourceCard).join(""):'<p class="empty">No matching references.</p>';};document.querySelector("#librarySearch").addEventListener("input",update);update();
}
function frameworks(){
 setPage(hero("Mental models","Framework library","Reusable frameworks extracted directly from the forty written draft lessons. These are teaching heuristics, not independently validated interventions.")+
 '<label for="frameworkSearch">Search frameworks</label><input id="frameworkSearch" type="search" placeholder="e.g. retrieval, budget, listening"><p id="frameworkCount" class="muted" aria-live="polite"></p><div id="frameworkResults" class="cards"></div>');
 const update=()=>{const q=document.querySelector("#frameworkSearch").value.toLowerCase().trim(),rows=data.frameworks.filter(f=>[f.title,f.body,courseTitle(f.course)].join(" ").toLowerCase().includes(q));document.querySelector("#frameworkCount").textContent=rows.length+" frameworks";document.querySelector("#frameworkResults").innerHTML=rows.length?rows.map(f=>box('<p class="eyebrow">'+esc(courseTitle(f.course))+'</p><h3>'+esc(f.title)+'</h3>'+md(f.body)+link("lesson",f.id,"Study original lesson"))).join(""):'<p class="empty">No matching frameworks.</p>';};document.querySelector("#frameworkSearch").addEventListener("input",update);update();
}
function portfolio(selected=""){
 const choices=available();
 setPage(hero("Practice & evidence","Evidence portfolio","Keep a brief record of fictional or non-sensitive practical work. These notes are self-recorded and are not assessed or certified by Ultimo.")+
 '<p class="notice">Stored only in this browser, not encrypted or synchronised. Do not enter health records, financial account details, intimate information or confidential work.</p>'+
 box('<label for="eCourse">Course</label><select id="eCourse">'+choices.map(c=>'<option value="'+esc(c.id)+'"'+(c.id===selected?" selected":"")+'>'+esc(c.title)+'</option>').join("")+'</select><label for="eNote">Practice evidence (max 4,000 characters)</label><textarea id="eNote" maxlength="4000" placeholder="Describe the task, your reasoning, feedback and next step. Use fictional or anonymised examples."></textarea>'+button("addEvidence","Save practice note",true))+
 '<section class="section">'+heading("Saved practice notes")+(state.evidence.length?box(state.evidence.map((e,i)=>'<div class="evidence-row"><div class="row between"><strong>'+esc(courseTitle(e.course))+'</strong><small>'+esc(e.date)+'</small></div><p>'+esc(e.note)+'</p><button type="button" data-delete-evidence="'+i+'" class="danger">Delete note</button></div>').join("")):'<p class="empty">No practice notes recorded yet.</p>')+'</section>');
 document.querySelector("#addEvidence").addEventListener("click",()=>{const course=document.querySelector("#eCourse").value,note=document.querySelector("#eNote").value.trim();if(!note||note.length>4000){flash("Enter a brief practice note.");return;}if(state.evidence.length>=500){flash("Portfolio limit reached. Export and remove old notes.");return;}const id=globalThis.crypto?.randomUUID?.()??Date.now()+"-"+Math.random().toString(36).slice(2);state.evidence.unshift({id,course,note,date:today()});persist();portfolio(course);flash("Practice note saved locally.");});
 document.querySelectorAll("[data-delete-evidence]").forEach(b=>b.addEventListener("click",()=>{if(!confirm("Delete this note?"))return;state.evidence.splice(Number(b.dataset.deleteEvidence),1);persist();portfolio(selected);flash("Note deleted.");}));
}
function settings(){
 setPage(hero("Privacy & portability","Data and settings","You own your learning records. No account, analytics, cloud storage or AI inference is used by this pilot.")+
 '<div class="notice">'+(storageOK?"Browser storage is available.":"Browser storage could not be read or written. Export before closing this page.")+' Data is local to this browser and website origin, not encrypted. Anyone with access to this browser profile may access it.</div>'+
 '<section class="section stack">'+box('<h2>Export your records</h2><p>Download a JSON backup containing read marks, review dates, quiz self-check scores and practice notes. Treat it as private.</p>'+button("exportData","Download JSON backup",true))+box('<h2>Restore a backup</h2><p>Restoring replaces local records. Only valid curriculum IDs and supported data fields are accepted.</p><label for="importData">Choose JSON file (max 5 MB)</label><input id="importData" type="file" accept=".json,application/json">')+box('<h2>Erase local records</h2><p>Removes all Ultimo learner records from this browser. It does not remove exported copies.</p><button type="button" id="erase" class="danger">Erase all local data</button>')+'</section>');
 document.querySelector("#exportData").addEventListener("click",()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="ultimo-backup-"+today()+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 document.querySelector("#importData").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error("Backup exceeds 5 MB.");const imported=clean(JSON.parse(await file.text()),valid,courseIds);if(!confirm("Replace all existing local records with this backup?"))return;state=imported;persist();settings();flash("Backup restored.");}catch(err){flash("Import failed: "+err.message);}finally{e.target.value="";}});
 document.querySelector("#erase").addEventListener("click",()=>{if(!confirm("Permanently erase all local Ultimo records?"))return;state=fresh();try{localStorage.removeItem(KEY);storageOK=true;}catch{storageOK=false;}settings();flash(storageOK?"Local data erased.":"In-memory data erased; browser storage unavailable.");});
}
function missing(){setPage(hero("Ultimo","Page not found","This course or lesson is not in the current curriculum.")+link("home","","Return to overview","primary"));}
function route(focus=true){
 const raw=location.hash.slice(1)||"home";if(raw==="main"){main.focus();return;}
 let [page,arg=""]=raw.split("/");try{arg=decodeURIComponent(arg);}catch{return missing();}
 const pages={home,courses:catalogue,course:()=>showCourse(arg),lesson:()=>showLesson(arg),planner,library,frameworks,portfolio:()=>portfolio(arg),settings};
 if(!Object.hasOwn(pages,page))return missing();
 document.querySelectorAll("nav a").forEach(a=>{if(a.dataset.nav===(["course","lesson"].includes(page)?"courses":page))a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
 document.querySelector("#sidebar").classList.remove("open");document.querySelector("#menu").setAttribute("aria-expanded","false");
 pages[page]();if(focus){main.focus({preventScroll:true});window.scrollTo(0,0);}
}
async function boot(){
 try{const response=await fetch("./curriculum.json");if(!response.ok)throw Error("Curriculum data unavailable");data=await response.json();courses=new Map(data.courses.map(c=>[c.id,c]));sourceMap=new Map(data.sources.map(s=>[s.id,s]));compMap=new Map(data.competencies.map(c=>[c.id,c]));facultyMap=new Map(data.faculties.map(f=>[f.id,f]));valid=new Set(available().flatMap(c=>c.lessons.map(l=>c.id+"."+l.id)));courseIds=new Set(available().map(c=>c.id));state=loadState();window.addEventListener("hashchange",()=>route());document.querySelector("#menu").addEventListener("click",()=>{const open=document.querySelector("#sidebar").classList.toggle("open");document.querySelector("#menu").setAttribute("aria-expanded",String(open));});route(false);if(!storageOK)flash("Local storage unavailable or unreadable. Check Data & settings.");}
 catch(err){main.textContent="Ultimo could not load: "+err.message+". Run the build and serve the dist directory over HTTP.";}
}
boot();
