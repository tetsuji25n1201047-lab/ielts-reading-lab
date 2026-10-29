/* Reading Lab: dependency-free static site. All original practice content lives in data/tests.js */
(() => {
  'use strict';
  const allTests = Array.isArray(window.READING_TESTS) ? window.READING_TESTS.filter(validTest) : [];
  const byId = id => document.getElementById(id);
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = v => String(v ?? '').trim().replace(/\s+/g,' ').toLowerCase().replace(/[‘’]/g,"'");
  const storageKey = test => `readinglab.v1.${test.id}`;
  const totalQuestions = test => test.passages.reduce((n,p) => n + p.sections.reduce((m,s)=>m+s.questions.length,0),0);
  const questions = test => test.passages.flatMap(p=>p.sections.flatMap(s=>s.questions));
  const pad = n => String(n).padStart(2,'0');
  const formatTime = secs => `${pad(Math.floor(secs/60))}:${pad(secs%60)}`;
  let current = null, attempt = null, passageIndex = 0, mobilePane = 'passage', phase = 'home', tickId = 0, activeFilter='all', savedToastTimeout = 0;
  function validTest(t){ return t && typeof t.id==='string' && t.id && Array.isArray(t.passages) && t.passages.length && t.passages.every(p => Array.isArray(p.sections) && p.sections.length && p.sections.every(s => Array.isArray(s.questions))); }
  function readSaved(test){try{const raw=localStorage.getItem(storageKey(test)); const data=raw?JSON.parse(raw):null; return data?.version===1 && data.testId===test.id && data.answers && typeof data.answers==='object' ? data : null;}catch{return null;}}
  function save(){if(!current||!attempt)return;try{localStorage.setItem(storageKey(current),JSON.stringify(attempt));byId('save-indicator').textContent='✓ 自動保存';}catch{byId('save-indicator').textContent='保存不可（ブラウザ設定をご確認ください）';}}
  function notice(text){const t=byId('toast');t.textContent=text;t.hidden=false;clearTimeout(savedToastTimeout);savedToastTimeout=setTimeout(()=>t.hidden=true,3300);}
  function setHash(hash){try{history.replaceState(null,'',hash);}catch{ /* Embeddable about:blank preview */ }}
  function showView(name){phase=name;byId('home-view').hidden=name!=='home';byId('intro-view').hidden=name!=='intro';byId('exam-view').hidden=name!=='exam';document.body.classList.toggle('is-exam',name==='exam'); window.scrollTo(0,0);}
  function library(){current=null;attempt=null;clearInterval(tickId);showView('home');renderLibrary();setHash('#library');setTimeout(()=>byId('library').scrollIntoView({block:'start'}),0);}
  function renderLibrary(){const grid=byId('test-grid');grid.replaceChildren();const query=byId('test-search').value.toLowerCase().trim();let count=0;
    for(const [i,test] of allTests.entries()){
      if(activeFilter!=='all' && test.kind!==activeFilter)continue;
      if(query && ![test.title,test.subtitle,test.tag,test.description].join(' ').toLowerCase().includes(query))continue;
      count++;
      const card=el('article','test-card');const cover=el('div',`test-cover tone${1+i%3}`);
      cover.innerHTML=`<div class="cover-top"><span class="cover-kicker">READING LAB / ${pad(i+1)}</span><span class="cover-label">${esc((test.kind||'mini')==='full'?'FULL TEST':'20-MIN PRACTICE')}</span></div><div class="cover-letter" aria-hidden="true">${esc((test.title||'R').charAt(0).toUpperCase())}</div><div class="cover-title">${esc(test.title)}<small>ORIGINAL PRACTICE</small></div>`;
      const main=el('div','card-main');main.innerHTML=`<span class="card-topic">${esc(test.tag||'READING')}</span><h3>${esc(test.title)}</h3><p class="card-description">${esc(test.description||'IELTS形式のオリジナルReading模試。')}</p><div class="card-meta"><span>◷ ${esc(test.durationMinutes||20)} min</span><span>☷ ${totalQuestions(test)} questions</span><span>▤ ${test.passages.length} passage${test.passages.length!==1?'s':''}</span></div>`;
      const footer=el('div','card-footer');const badge=el('span','free-label','● FREE');const button=el('button','card-action',readSaved(test)?.completed?'Review result ↗':readSaved(test)?'Continue ↗':'Start practice ↗');button.type='button';button.addEventListener('click',()=>openIntro(test.id));footer.append(badge,button);card.append(cover,main,footer);grid.append(card);
    }
    byId('empty-state').hidden=count!==0;byId('library-count').textContent=`${allTests.length} TEST${allTests.length!==1?'S':''} AVAILABLE`;
  }
  function openIntro(id){const found=allTests.find(x=>x.id===id);if(!found)return;current=found;passageIndex=0;attempt=null;showView('intro');byId('intro-title').textContent=found.title;byId('intro-description').textContent=found.description||found.subtitle||'';byId('intro-art-index').textContent=pad(Math.max(1,allTests.indexOf(found)+1));byId('intro-stats').innerHTML=`<span class="intro-stat"><small>DURATION</small>${found.durationMinutes||20} minutes</span><span class="intro-stat"><small>QUESTIONS</small>${totalQuestions(found)}</span><span class="intro-stat"><small>PASSAGES</small>${found.passages.length}</span>`;
    const saved=readSaved(found);byId('resume-test').hidden=!saved;byId('resume-test').textContent=saved?.completed?'結果と解説を見る →':'保存した回答から再開 →';byId('start-test').textContent=saved?'最初から解き直す →':'Start practice →';
    setHash(`#test=${encodeURIComponent(id)}`);
  }
  function resetAttempt(){if(!current)return;const existing=readSaved(current);if(existing && !confirm('保存されている回答と結果を消して、最初から始めますか？'))return;
    attempt={version:1,testId:current.id,answers:{},flags:[],deadline:Date.now()+(current.durationMinutes||20)*60000,startedAt:Date.now(),completed:false,submittedAt:null,wasAutomatic:false};save();openExam();
  }
  function resumeAttempt(){const existing=readSaved(current);if(!existing){resetAttempt();return;}attempt=existing;openExam();}
  function openExam(){clearInterval(tickId);passageIndex=0;mobilePane='passage';showView('exam');byId('exam-title').textContent=current.title;byId('exam-test-label').textContent=`${current.kind==='full'?'FULL TEST':'PRACTICE'}`;byId('exam-mobile-tabs').hidden=false;renderExam();if(!attempt.completed){updateClock();if(!attempt.completed)tickId=setInterval(updateClock,400);}}
  function setPane(name){mobilePane=name;byId('passage-pane').classList.toggle('mobile-active',name==='passage');byId('question-pane').classList.toggle('mobile-active',name==='questions');byId('mobile-passage').classList.toggle('active',name==='passage');byId('mobile-questions').classList.toggle('active',name==='questions');}
  function passageFor(number){return current.passages.findIndex(p => p.sections.some(s=>s.questions.some(q=>q.number===number)));}
  function jumpTo(number){const pIndex=passageFor(number);if(pIndex<0)return;if(pIndex!==passageIndex){passageIndex=pIndex;renderExam();}setPane('questions');const target=byId(`question-${number}`);target?.scrollIntoView({behavior:'smooth',block:'center'});document.querySelectorAll('.number-button').forEach(b=>b.classList.toggle('current',Number(b.dataset.number)===number));}
  function renderExam(){const p=current.passages[passageIndex];if(!p)return;const total=totalQuestions(current);const submitted=attempt.completed;
    byId('passage-buttons').replaceChildren(...current.passages.map((p,i)=>{const b=el('button',`passage-button ${i===passageIndex?'active':''}`,`Passage ${i+1}`);b.type='button';b.addEventListener('click',()=>{passageIndex=i;renderExam();});return b;}));
    byId('paper-kicker').textContent=`READING PASSAGE ${pad(passageIndex+1)} / ${pad(current.passages.length)}`;byId('passage-title').textContent=p.title||current.title;
    byId('passage-text').innerHTML=(p.paragraphs||[]).map(par=>`<p data-paragraph="${esc(par.label||'')}">${par.label?`<span class="para-label">${esc(par.label)}.</span>`:''}${esc(par.text)}</p>`).join('');
    byId('question-title').textContent=`Questions ${(p.sections[0]?.questions[0]?.number)||1}–${p.sections[p.sections.length-1]?.questions.at(-1)?.number||total}`;byId('question-subtitle').textContent='Read the text carefully and answer the questions.';
    byId('question-groups').replaceChildren(...p.sections.map(renderGroup));
    byId('result-summary').replaceChildren();if(submitted)renderResult();
    const footer=byId('question-nav');footer.replaceChildren();for(const q of questions(current)){
      const val=attempt.answers[q.number];const done=val!==undefined && String(val).trim()!=='';
      const b=el('button','number-button',String(q.number));b.type='button';b.dataset.number=q.number;if(done)b.classList.add('answered');if(attempt.flags.includes(q.number))b.classList.add('flagged');if(submitted)b.classList.add(isCorrect(q,val)?'correct':'wrong');b.setAttribute('aria-label',`Question ${q.number}${done?' answered':''}${attempt.flags.includes(q.number)?' flagged':''}`);b.addEventListener('click',()=>jumpTo(q.number));footer.append(b);
    }
    byId('footer-part').textContent=`Passage ${passageIndex+1}`;const localQ=p.sections.flatMap(s=>s.questions);const localDone=localQ.filter(q=>hasAnswer(q.number)).length;byId('footer-progress').textContent=`${localDone} of ${localQ.length} answered`;
    byId('submit-test').textContent=submitted?'Try again →':'Submit →';byId('submit-test').classList.toggle('review-mode',submitted);
    byId('clear-highlights').hidden=submitted;
    updateProgress();setPane(mobilePane);byId('passage-pane').scrollTop=0;byId('question-pane').scrollTop=0;
    if(submitted){byId('timer').textContent='FINISHED';byId('timer').classList.remove('warning');}
  }
  function renderGroup(group){const root=el('div','question-group');const head=el('div','group-head');const title=el('h3','',group.title);const instruction=el('p','',group.instructions);head.append(title,instruction);root.append(head);for(const q of group.questions)root.append(renderQuestion(q));return root;}
  function renderQuestion(q){const submitted=attempt.completed;const val=attempt.answers[q.number]??'';const good=isCorrect(q,val);const card=el('article','q-card',null);card.id=`question-${q.number}`;if(attempt.flags.includes(q.number))card.classList.add('is-flagged');if(submitted)card.classList.add(good?'is-correct':'is-incorrect');
    const head=el('div','q-head');head.append(el('span','q-no',`QUESTION ${pad(q.number)}`));if(!submitted){const flag=el('button',`flag-button ${attempt.flags.includes(q.number)?'flagged':''}`,attempt.flags.includes(q.number)?'⚑ Marked':'⚐ Review later');flag.type='button';flag.setAttribute('aria-label',`Question ${q.number} を見直し対象にする`);flag.addEventListener('click',()=>{const had=attempt.flags.includes(q.number);attempt.flags=had?attempt.flags.filter(n=>n!==q.number):[...attempt.flags,q.number];save();card.classList.toggle('is-flagged',!had);flag.classList.toggle('flagged',!had);flag.textContent=had?'⚐ Review later':'⚑ Marked';const nav=byId('question-nav').querySelector(`[data-number="${q.number}"]`);if(nav)nav.classList.toggle('flagged',!had);});head.append(flag);}
    card.append(head,el('div','q-prompt',q.prompt));
    if(q.type==='choice'||q.type==='radio'){
      const wrap=el('div','answer-options');for(const [i,opt] of (q.options||[]).entries()){
        const label=el('label','answer-option');const input=el('input');input.type='radio';input.name=`question-${q.number}`;input.value=String(opt);input.checked=String(val)===String(opt);input.disabled=submitted;input.addEventListener('change',()=>answer(q.number,input.value));label.append(input,el('span','',opt));wrap.append(label);
      }card.append(wrap);
    }else if(q.type==='select'){
      const sel=el('select','answer-select');sel.name=`question-${q.number}`;sel.setAttribute('aria-label',`Question ${q.number} answer`);sel.disabled=submitted;const placeholder=el('option','','Select an answer');placeholder.value='';sel.append(placeholder);for(const opt of q.options||[]){const option=el('option','',opt);option.value=String(opt);sel.append(option);}sel.value=String(val);sel.addEventListener('change',()=>answer(q.number,sel.value));card.append(sel);
    }else{
      const input=el('input','answer-input');input.type='text';input.name=`question-${q.number}`;input.autocomplete='off';input.spellcheck=false;input.placeholder='Type your answer here';input.setAttribute('aria-label',`Question ${q.number} answer`);input.value=String(val);input.disabled=submitted;input.addEventListener('input',()=>answer(q.number,input.value));card.append(input);
    }
    if(submitted){const note=el('div',`review-block ${good?'':'wrong'}`);note.append(el('strong','',good?'✓ 正解':'✕ 不正解・未回答'));
      note.append(el('p','',`あなたの解答：${String(val).trim()||'未回答'}`));note.append(el('p','',`正解：${Array.isArray(q.answer)?q.answer.join(' / '):q.answer}`));if(q.evidence)note.append(el('p','',`本文の根拠：段落 ${q.evidence}`));if(q.explanation)note.append(el('p','',q.explanation));
      if(q.evidence){const jump=el('button','review-jump','本文の根拠を見る ↗');jump.type='button';jump.addEventListener('click',()=>{setPane('passage');const para=Array.from(byId('passage-text').querySelectorAll('p')).find(x=>x.dataset.paragraph===q.evidence);if(para){byId('passage-text').querySelectorAll('.paragraph-focus').forEach(x=>x.classList.remove('paragraph-focus'));para.classList.add('paragraph-focus');para.scrollIntoView({behavior:'smooth',block:'center'});}});note.append(jump);}
      card.append(note);
    }
    return card;
  }
  function hasAnswer(n){return String(attempt.answers[n]??'').trim()!=='';}
  function answer(n,value){if(attempt.completed)return;attempt.answers[n]=value;save();updateProgress();const target=byId(`question-${n}`);if(target)target.classList.remove('is-correct','is-incorrect');for(const b of byId('question-nav').querySelectorAll('.number-button'))if(Number(b.dataset.number)===n){b.classList.toggle('answered',hasAnswer(n));b.setAttribute('aria-label',`Question ${n}${hasAnswer(n)?' answered':''}`);}
  }
  function updateProgress(){if(!current||!attempt)return;const all=questions(current),done=all.filter(q=>hasAnswer(q.number)).length;byId('exam-counter').textContent=`${done} / ${all.length} answered`;const local=current.passages[passageIndex].sections.flatMap(s=>s.questions);byId('footer-progress').textContent=`${local.filter(q=>hasAnswer(q.number)).length} of ${local.length} answered`;}
  function isCorrect(q,value){const accepted=Array.isArray(q.answer)?q.answer:[q.answer];return accepted.some(s=>normalize(s)===normalize(value));}
  function getScore(){const qs=questions(current);let right=0;const byType={};for(const q of qs){const type=q.type==='text'?'Sentence completion':q.type==='select'?'Matching':'Multiple choice / T-F-NG';const item=byType[type]??(byType[type]={right:0,total:0});item.total++;if(isCorrect(q,attempt.answers[q.number])){right++;item.right++;}}return{right,total:qs.length,byType};}
  function renderResult(){const result=el('section','result-summary');const s=getScore();const missed=s.total-questions(current).filter(q=>hasAnswer(q.number)).length;result.innerHTML=`<div class="result-eyebrow">YOUR READING PRACTICE RESULT</div><h2>${s.right} / ${s.total} correct</h2><p>正答率 ${Math.round(100*s.right/s.total)}% · 未回答 ${missed}問。下の設問ごとに、正解・解説・本文の根拠を確認できます。</p>`;const types=el('div','result-stats');for(const[name,x]of Object.entries(s.byType))types.append(el('span','',`${name}: ${x.right}/${x.total}`));result.append(types,el('p','result-note','※ 独自問題であり、結果は公式IELTS Bandを保証・推定するものではありません。'));byId('result-summary').append(result);}
  function updateClock(){if(!attempt||attempt.completed)return;const time=Math.max(0,Math.ceil((attempt.deadline-Date.now())/1000));byId('timer').textContent=formatTime(time);byId('timer').classList.toggle('warning',time<=300);if(time<=0)finishTest(true);}
  function finishTest(automatic=false){if(!attempt||attempt.completed)return;attempt.completed=true;attempt.wasAutomatic=automatic;attempt.submittedAt=Date.now();save();clearInterval(tickId);passageIndex=0;mobilePane='questions';renderExam();notice(automatic?'時間終了のため自動提出しました。':'解答を提出しました。');}
  function requestSubmit(){if(!attempt)return;if(attempt.completed){resetAttempt();return;}updateClock();if(attempt.completed)return;
    const blank=questions(current).filter(q=>!hasAnswer(q.number)).length;
    byId('dialog-message').textContent=`未回答は ${blank} 問です。提出後は回答を変更できません。`;const dialog=byId('submit-dialog');if(typeof dialog.showModal==='function'){dialog.showModal();}else{if(confirm(`未回答 ${blank} 問です。提出しますか？`))finishTest(false);}
  }
  function exitExam(){if(!attempt)return;if(!attempt.completed){save();notice('この端末に回答を保存しました。');}clearInterval(tickId);const id=current.id;openIntro(id);}
  // Add/remove plain-text highlight in passage. No copying or remote transfer.
  function highlightSelected(){if(phase!=='exam'||attempt?.completed)return;const selection=window.getSelection();if(!selection||selection.isCollapsed)return;const range=selection.getRangeAt(0);const area=byId('passage-text');if(!area.contains(range.commonAncestorContainer))return;const mark=el('mark');try{range.surroundContents(mark);selection.removeAllRanges();}catch{notice('ハイライトは、1段落の文章内で選択してください。');}}
  function clearHighlights(){const area=byId('passage-text');for(const mark of [...area.querySelectorAll('mark')]){const parent=mark.parentNode;while(mark.firstChild)parent.insertBefore(mark.firstChild,mark);mark.remove();parent.normalize();}notice('ハイライトを消去しました。');}
  // Events
  byId('brand-home').addEventListener('click',()=>{clearInterval(tickId);showView('home');setHash('#');});
  byId('intro-back').addEventListener('click',library);byId('exam-back').addEventListener('click',exitExam);
  byId('start-test').addEventListener('click',resetAttempt);byId('resume-test').addEventListener('click',resumeAttempt);
  byId('submit-test').addEventListener('click',requestSubmit);byId('mobile-passage').addEventListener('click',()=>setPane('passage'));byId('mobile-questions').addEventListener('click',()=>setPane('questions'));
  byId('passage-text').addEventListener('mouseup',highlightSelected);byId('clear-highlights').addEventListener('click',clearHighlights);
  byId('submit-dialog').addEventListener('close',()=>{if(byId('submit-dialog').returnValue==='confirm'){updateClock();if(!attempt.completed)finishTest(false);}});
  byId('test-search').addEventListener('input',renderLibrary);document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderLibrary();}));
  document.addEventListener('visibilitychange',()=>{if(phase==='exam')updateClock();});
  renderLibrary();const linkTest=new URLSearchParams(location.hash.slice(1)).get('test');if(linkTest && allTests.some(t=>t.id===linkTest))openIntro(linkTest);
})();
