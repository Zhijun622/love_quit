(() => {
  const data = window.QUIZ_DATA;
  const types = ['P','Q','S','F','R','D'];
  const symbols = {P:'☀',Q:'☾',S:'❀',F:'✧',R:'♜',D:'✦'};
  const chapters = [
    {name:'心动的开始',start:0,end:4},
    {name:'暧昧与拉扯',start:5,end:9},
    {name:'关系中的另一面',start:10,end:14},
    {name:'冲突与选择',start:15,end:19},
    {name:'关于爱与自我',start:20,end:24}
  ];
  const $ = id => document.getElementById(id);
  let current = 0;
  let answers = Array(data.questions.length).fill(null);
  let resultCode = null;
  const screens = ['home-screen','quiz-screen','result-screen'];
  function showScreen(id){ screens.forEach(s => $(s).classList.toggle('hidden',s!==id)); window.scrollTo({top:0,behavior:'smooth'}); }
  function start(){ current=0; answers=Array(data.questions.length).fill(null); renderQuestion(); showScreen('quiz-screen'); }
  function renderQuestion(){
    const item=data.questions[current];
    const chapter=chapters.find(c=>current>=c.start&&current<=c.end);
    $('progress-text').textContent=String(current+1).padStart(2,'0')+' / '+String(data.questions.length).padStart(2,'0');
    $('progress-fill').style.width=((current+1)/data.questions.length*100)+'%';
    $('chapter-mark').textContent=String(chapters.indexOf(chapter)+1).padStart(2,'0');
    $('chapter-name').textContent=chapter.name;
    $('scene-text').textContent=item.scene;
    $('question-text').textContent=item.q;
    $('back-btn').disabled=current===0;
    $('answered-count').textContent='已回答 '+answers.filter(Boolean).length+' 题';
    const list=$('options-list'); list.innerHTML='';
    item.options.forEach((option,index)=>{
      const button=document.createElement('button'); button.className='option-btn'+(answers[current]===option[1]?' selected':''); button.type='button';
      const letter=document.createElement('span'); letter.className='option-letter'; letter.textContent=String.fromCharCode(65+index);
      const text=document.createElement('span'); text.textContent=option[0];
      button.append(letter,text); button.addEventListener('click',()=>choose(option[1])); list.appendChild(button);
    });
  }
  function choose(code){
    answers[current]=code;
    $('answered-count').textContent='已回答 '+answers.filter(Boolean).length+' 题';
    if(current<data.questions.length-1){current++;renderQuestion();}else{showResult();}
  }
  function calculate(){
    const raw=Object.fromEntries(types.map(t=>[t,0]));
    const possible=Object.fromEntries(types.map(t=>[t,0]));
    data.questions.forEach((q,i)=>q.options.forEach(o=>possible[o[1]]++));
    answers.forEach(code=>{if(code)raw[code]++;});
    // Standardize each type against how often it appeared as an option.
    // This reduces the advantage of types that appear in more questions and the volatility of rare options.
    const normalized=Object.fromEntries(types.map(t=>{
      const n=possible[t];
      const expected=n*0.25;
      const deviation=n?Math.sqrt(n*0.25*0.75):1;
      return [t,n?(raw[t]-expected)/deviation:-Infinity];
    }));
    const ranked=types.slice().sort((a,b)=>normalized[b]-normalized[a] || raw[b]-raw[a]);
    return {ranked,raw,normalized,possible};
  }
  function fillList(id,items){const ul=$(id);ul.innerHTML='';items.forEach(t=>{const li=document.createElement('li');li.textContent=t;ul.appendChild(li);});}
  function showResult(){
    const score=calculate(); resultCode=score.ranked[0]; const r=data.results[resultCode];
    $('result-symbol').textContent=symbols[resultCode]; $('result-en').textContent=r.en; $('result-name').textContent=r.name;
    $('result-tag').textContent=r.tag; $('result-quote').textContent='“'+r.quote+'”';
    $('result-intro').textContent=r.intro; $('result-hidden').textContent=r.hidden;
    $('result-keywords').innerHTML=''; r.keywords.split(' · ').forEach(k=>{const s=document.createElement('span');s.textContent=k;$('result-keywords').appendChild(s);});
    fillList('result-pros',r.pros); fillList('result-cons',r.cons);
    const match=Object.entries(data.results).find(([,v])=>v.name===r.match);
    $('match-icon').textContent=match?symbols[match[0]]:'♡'; $('match-name').textContent=r.match;
    $('match-why').textContent=r.matchWhy; $('second-match').textContent=r.second;
    $('result-challenge').textContent=r.challenge; $('result-advice').textContent=r.advice;
    showScreen('result-screen');
  }
  function share(){
    const r=data.results[resultCode];
    const text=`我测出的恋爱类型是「${r.name}」｜${r.tag}\n${r.quote}\n你也来测测：${location.href.split('?')[0]}`;
    if(navigator.share){navigator.share({title:'测测你的恋爱类型',text,url:location.href.split('?')[0]}).catch(()=>{});}
    else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(()=>toast('结果文案已复制，快去分享给朋友吧！')).catch(()=>fallbackCopy(text));}
    else fallbackCopy(text);
  }
  function fallbackCopy(text){const area=document.createElement('textarea');area.value=text;document.body.appendChild(area);area.select();try{document.execCommand('copy');toast('结果文案已复制，快去分享给朋友吧！');}catch(e){toast('复制失败，请手动复制结果。');}area.remove();}
  let toastTimer;function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2300);}
  $('start-btn').addEventListener('click',start);
  $('back-btn').addEventListener('click',()=>{if(current>0){current--;renderQuestion();}});
  $('retry-btn').addEventListener('click',start);
  $('share-btn').addEventListener('click',share);
  if(new URLSearchParams(location.search).get('start')==='1') start(); else showScreen('home-screen');
})();
