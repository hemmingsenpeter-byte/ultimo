// Synthetic learner data only. Automated checks do not replace assistive-technology
// sessions, representative learners, independent curriculum review or WCAG audit.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const root=fileURLToPath(new URL('../',import.meta.url));
const key='ultimo.learner.v1';
const curriculum=JSON.parse(await readFile(new URL('../dist/curriculum.json',import.meta.url),'utf8'));
function routeHeading(route){
  const [name,id]=route.split('/');
  if(name==='course')return curriculum.courses.find(c=>c.id===id)?.title;
  if(name==='lesson'){const [course,lesson]=id.split('.');return curriculum.courses.find(c=>c.id===course)?.lessons.find(l=>l.id===lesson)?.title;}
  return {home:'A life well studied.',planner:'Your study planner',courses:'Faculties & courses',portfolio:'Evidence portfolio',settings:'Data and settings',tutor:'Tutor studio',library:'Reading library',frameworks:'Framework library'}[name];
}
let checks=0;
function check(condition,message){assert.ok(condition,message);checks++;}
function equal(actual,expected,message){assert.deepEqual(actual,expected,message);checks++;}
const server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory','dist'],{cwd:root,stdio:['ignore','pipe','pipe']});
let browser;
try {
  const port=await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(Error('Static test server did not start.')),10000);
    server.once('error',reject);
    server.once('exit',code=>reject(Error('Static test server exited: '+code)));
    server.stdout.on('data',chunk=>{const match=chunk.toString().match(/port (\d+)/);if(match){clearTimeout(timeout);resolve(Number(match[1]));}});
  });
  // localhost keeps the static-site journey separate from the optional 127.0.0.1 model gateway.
  const base=`http://localhost:${port}/`;
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
  const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
  const page=await context.newPage();
  const errors=[],remoteRequests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!==new URL(base).origin){remoteRequests.push(url.href);return route.abort();}
    return route.continue();
  });
  page.on('dialog',dialog=>dialog.accept());
  async function go(route='home'){
    await page.goto(base+'#'+route);
    const expected=routeHeading(route);
    assert.ok(expected,'Test route has a known heading: '+route);
    await page.waitForFunction(expected=>document.querySelector('main h1')?.textContent===expected&&document.title===expected+' — Ultimo',expected);
    check(!(await page.locator('main').innerText()).includes('could not load'),'App loads '+route);
    equal(await page.title(),(await page.locator('main h1').textContent())+' — Ultimo','Document title identifies '+route);
  }
  const stored=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  async function seed(state){await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key,state});await page.reload();await page.locator('main h1').waitFor();}
  async function importBackup(state){
    await go('settings');
    await keyboardTo('#importData');
    await page.locator('#importData').setInputFiles({name:'synthetic-backup.json',mimeType:'application/json',buffer:Buffer.from(typeof state==='string'?state:JSON.stringify(state))});
    await page.waitForFunction(()=>document.querySelector('#importData')?.value===''&&(document.querySelector('#notice')?.textContent.includes('Backup restored')||document.querySelector('#notice')?.textContent.includes('Import failed')));
  }
  async function keyboardTo(selector){
    for(let i=0;i<100;i++){
      if(await page.locator(selector).evaluate(el=>el===document.activeElement))return;
      await page.keyboard.press('Tab');
    }
    throw Error('Keyboard could not reach '+selector);
  }
  async function activate(selector){await keyboardTo(selector);await page.keyboard.press('Enter');}
  async function changePlan(plan){await go('planner');await page.locator('#studyPlan').selectOption(plan);await page.locator('#savePlan').click();equal((await stored()).studyPlan,plan,'Study plan saved: '+plan);}

  await go();
  // Start through the skip link and primary navigation using real keyboard input.
  await page.keyboard.press('Tab');
  equal(await page.locator(':focus').getAttribute('class'),'skip','Skip link is first keyboard stop');
  await page.keyboard.press('Enter');
  equal(await page.locator(':focus').getAttribute('id'),'main','Skip link moves focus into main');
  await keyboardTo('nav a[data-nav="planner"]');
  await page.keyboard.press('Enter');
  await page.locator('#studyPlan').waitFor();
  equal(await page.locator(':focus').getAttribute('id'),'main','Route navigation focuses main');
  await keyboardTo('#studyPlan');
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('5');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.studyPlan==='all',key);
  equal(await page.locator(':focus').getAttribute('id'),'savePlan','Saving retains a useful keyboard focus');
  equal(await page.locator('#studyPlan').inputValue(),'all','Keyboard selects all authored courses');
  const focus=await page.locator('#savePlan').evaluate(el=>({style:getComputedStyle(el).outlineStyle,width:parseFloat(getComputedStyle(el).outlineWidth)}));
  check(focus.style!=='none'&&focus.width>=2,'Keyboard focus has a visible outline');

  await changePlan('faculty:MEN');
  check((await page.locator('main').innerText()).includes('Learning how to learn'),'Faculty plan includes cross-faculty prerequisite');
  await page.reload();await page.locator('#studyPlan').waitFor();
  equal(await page.locator('#studyPlan').inputValue(),'faculty:MEN','Plan survives reload');

  // Complete a lesson with keyboard input and verify only self-check scores persist.
  await go('lesson/INT-101.L01');
  const total=await page.locator('#quiz .quiz-item').count();
  await keyboardTo('#attempt0');
  await page.keyboard.type('Synthetic retrieval answer; should not be stored.');
  for(let i=0;i<total;i++){
    await activate(`#quiz .quiz-item:nth-child(${i+1}) summary`);
    await keyboardTo(`#quiz .quiz-item:nth-child(${i+1}) .correct`);
    await page.keyboard.press('Space');
  }
  await activate('#saveQuiz');
  equal((await stored()).quizzes['INT-101.L01'].correct,total,'Self-check score saved');
  check(!JSON.stringify(await stored()).includes('Synthetic retrieval answer'),'Typed quiz answer is not persisted');
  await activate('#complete');
  check(Boolean((await stored()).completed['INT-101.L01']),'Read mark saved');
  equal(await page.locator(':focus').getAttribute('id'),'completionState','Read completion focuses its confirmation');
  check(Boolean((await stored()).reviews['INT-101.L01']),'First spaced review scheduled');
  check(await page.locator('#complete').isDisabled(),'Read mark cannot be accidentally repeated');

  const dueState=await stored();
  dueState.reviews['INT-101.L01'].due='2000-01-01';
  await seed(dueState);
  await activate('#reviewLesson');
  equal((await stored()).reviews['INT-101.L01'].step,1,'Due review advances one step');
  equal(await page.locator(':focus').getAttribute('id'),'completionState','Review completion focuses its confirmation');

  await go('portfolio/INT-101');
  await keyboardTo('#eNote');
  await page.keyboard.type('Synthetic evidence: explained a fictional retrieval example.');
  await activate('#addEvidence');
  equal((await stored()).evidence.length,1,'Practice evidence saved');
  equal(await page.locator(':focus').getAttribute('id'),'addEvidence','Saving evidence retains keyboard focus');
  check((await page.locator('.evidence-row').innerText()).includes('Synthetic evidence'),'Saved evidence displayed');

  const preserved=await stored();
  await changePlan('all');
  const switched=await stored();
  for(const field of ['completed','reviews','quizzes','evidence'])equal(switched[field],preserved[field],'Plan switch preserves '+field);
  await go('home');
  equal(await page.locator('#activePlanTitle').textContent(),'All written courses','Dashboard identifies active plan');
  check(await page.locator('a.card-link[href="#course/INT-109"]').count()===1,'Expanded authored courses appear on dashboard');

  await go('settings');
  const downloadPromise=page.waitForEvent('download');
  await activate('#exportData');
  const downloaded=await downloadPromise;
  const backup=JSON.parse(await readFile(await downloaded.path(),'utf8'));
  equal(backup.studyPlan,'all','Backup contains selected plan');
  equal(backup.evidence,switched.evidence,'Backup preserves evidence');
  await activate('#erase');
  equal(await stored(),null,'Erase removes persisted learner records');
  equal(await page.locator(':focus').getAttribute('id'),'erase','Erasure retains keyboard focus');
  await importBackup(backup);
  equal((await stored()).completed,backup.completed,'Restore recovers read marks');
  equal(await page.locator(':focus').getAttribute('id'),'importData','Backup restoration retains keyboard focus');
  equal((await stored()).evidence,backup.evidence,'Restore recovers evidence');
  equal((await stored()).studyPlan,'all','Restore recovers selected plan');
  const legacy={...backup};delete legacy.studyPlan;
  await importBackup(legacy);
  equal((await stored()).studyPlan,'foundation','Old version-1 backup defaults to foundation');
  equal((await stored()).evidence,backup.evidence,'Old backup migration preserves evidence');
  await importBackup({...backup,studyPlan:'faculty:INVALID'});
  equal((await stored()).studyPlan,'foundation','Unknown plan defaults safely');
  const beforeInvalid=await stored();
  await importBackup('{invalid json');
  equal(await stored(),beforeInvalid,'Malformed backup does not replace learner data');
  check((await page.locator('#notice').textContent()).startsWith('Import failed:'),'Malformed backup has clear feedback');
  await importBackup({...backup,version:999});
  equal(await stored(),beforeInvalid,'Unsupported backup version preserves learner data');
  await go('portfolio');await activate('[data-delete-evidence="0"]');
  equal((await stored()).evidence.length,0,'Individual evidence can be deleted');
  equal(await page.locator(':focus').getAttribute('id'),'eNote','Deleting last evidence focuses the note field');

  // Seed synthetic records to cover prerequisite unlocking and overdue-budget pressure.
  const synthetic={version:1,completed:{},reviews:{},quizzes:{},evidence:[],hours:1,last:null,studyPlan:'faculty:MEN'};
  for(const lesson of curriculum.courses.find(c=>c.id==='INT-101').lessons)synthetic.completed['INT-101.'+lesson.id]='2000-01-01';
  for(const course of curriculum.courses.filter(c=>c.authored).slice(0,10))synthetic.reviews[course.id+'.L01']={due:'2000-01-01',step:0};
  await go('planner');await seed(synthetic);
  const budgetText=await page.locator('#studyQueue').innerText();
  check(budgetText.includes('60 / 60 minutes planned'),'Overdue review queue respects one-hour weekly budget');
  equal(await page.locator('#studyQueue a').count(),4,'Four fifteen-minute reviews fit weekly budget');
  equal(await page.getByRole('link',{name:'Review lesson',exact:true}).count(),10,'Full overdue list remains visible');
  synthetic.reviews={};await seed(synthetic);
  check(await page.locator('#studyQueue a[href="#lesson/MEN-101.L01"]').count()===1,'Completing prerequisite unlocks faculty study');
  await changePlan('foundation');

  const routes=['home','planner','courses','course/INT-101','lesson/INT-101.L01','lesson/EMO-103.L01','portfolio','settings','tutor','library','frameworks'];
  // Axe rules run without exclusions. Automated findings are a subset of accessibility testing.
  for(const route of routes){
    await go(route);
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']).analyze();
    equal(result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),[],'Axe accessibility checks: '+route);
  }
  // Include touch-sized viewports and 200% text sizing without changing browser semantics.
  for(const width of [320,390,768,1280]){
    await page.setViewportSize({width,height:900});
    for(const route of ['home','planner','lesson/EMO-103.L01','portfolio','settings','tutor']){
      await go(route);
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`No page overflow: ${route} at ${width}px`);
      if(width<=390){
        await page.locator('#menu').click();
        equal(await page.locator('#menu').getAttribute('aria-expanded'),'true','Mobile menu opens');
        await page.locator('nav a[data-nav="planner"]').click();
        await page.locator('#studyPlan').waitFor();
        equal(await page.locator('#menu').getAttribute('aria-expanded'),'false','Mobile menu closes after navigation');
      }
    }
  }
  await page.setViewportSize({width:1280,height:900});
  for(const route of ['home','planner','lesson/INT-101.L01','settings']){
    await go(route);
    await page.evaluate(()=>document.documentElement.style.fontSize='200%');
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page overflow with 200% text: '+route);
    check(await page.locator('main h1').isVisible(),'Heading remains visible at 200% text: '+route);
  }
  const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const touchPage=await touch.newPage();
  touchPage.on('pageerror',error=>errors.push(error.message));
  await touchPage.goto(base+'#home');
  await touchPage.locator('main h1').waitFor();
  await touchPage.locator('#menu').tap();
  await touchPage.locator('nav a[data-nav="planner"]').tap();
  await touchPage.locator('#studyPlan').waitFor();
  equal(await touchPage.locator('#menu').getAttribute('aria-expanded'),'false','Touch navigation closes the mobile menu');
  await touchPage.locator('#studyPlan').selectOption('all');
  await touchPage.locator('#savePlan').tap();
  equal(await touchPage.locator('#studyPlan').inputValue(),'all','Touch-sized plan controls remain usable');
  await touch.close();
  equal(errors,[],'No uncaught exceptions or browser console errors');
  equal(remoteRequests,[],'No learner journey requests leave the static origin');
  console.log(`Browser/accessibility suite passed ${checks} checks in Chromium ${browser.version()}.`);
  console.log('Coverage: synthetic learner journey; keyboard; 320/390/768/1280px; 200% text; axe WCAG A/AA and best-practice rules on 11 routes.');
  console.log('Still required: real screen-reader sessions, representative learners and other browser engines/devices.');
} finally {
  if(browser)await browser.close();
  server.kill();
}
