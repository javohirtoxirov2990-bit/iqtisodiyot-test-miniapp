const tg = window.Telegram?.WebApp;
tg?.ready(); tg?.expand();
const initData = tg?.initData || "";
const headers = {"X-Telegram-Init-Data": initData, "Content-Type":"application/json"};
let currentSubject="", questions=[], answers={}, index=0, userName="Talaba", meData=null, lastResult=null;
let timerInterval=null, secondsLeft=300;
const $ = id => document.getElementById(id);
async function api(path, options={}) {
  const res=await fetch(path,{...options,headers:{...headers,...options.headers}});
  let data={}; try{data=await res.json()}catch{}
  if(!res.ok) throw new Error(data.detail || "Xatolik yuz berdi");
  return data;
}
function showView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
  $(name+"-view").classList.remove("hidden");
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===name));
  if(name==="ranking") loadRanking();
  if(name==="profile") loadProfile();
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>showView(t.dataset.view)));
function failMessage(msg){const box=$("subjects");box.innerHTML=`<div class="empty">${escapeHtml(msg)}</div>`}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function start(){
  if(!initData){failMessage("Platformani Telegram ichidagi bot tugmasi orqali oching. Telegram Mini App ma’lumotlari talab qilinadi.");return;}
  try{
    meData=await api("/api/me");
    userName=[meData.first_name,meData.last_name].filter(Boolean).join(" ")||"Talaba";
    $("welcome").textContent=userName;$("avatar").textContent=userName[0].toUpperCase();
    $("best-score").textContent=(meData.best_percent||0)+"%";
    $("profile-name").textContent=userName;
    $("profile-handle").textContent=meData.username?"@"+meData.username:"Telegram foydalanuvchisi";
    $("profile-avatar").textContent=userName[0].toUpperCase();
    $("attempts").textContent=meData.attempts||0;
    $("correct-total").textContent=meData.correct_answers||0;
    $("profile-best").textContent=(meData.best_percent||0)+"%";
    const subjects=await api("/api/subjects");
    $("subject-count").textContent=subjects.length+" TA FAN";
    const box=$("subjects");box.innerHTML="";
    if(!subjects.length){box.innerHTML='<div class="empty">Hozircha fanlar qo‘shilmagan.</div>';return;}
    const icons=["📘","📊","🌐","💹","🏛️","🧠","⚙️","📈"];
    subjects.forEach((s,i)=>{
      const name=typeof s==="string"?s:s.subject;
      const count=typeof s==="string"?"":`${s.count} ta savol`;
      const b=document.createElement("button");b.className="subject-card";
      b.innerHTML=`<span class="subject-icon">${icons[i%icons.length]}</span><b>${escapeHtml(name)}</b><small>${count||"Bilimingizni sinab ko‘ring"}</small><span class="subject-arrow">↗</span>`;
      b.addEventListener("click",()=>begin(name));box.appendChild(b);
    });
  }catch(e){failMessage(e.message);}
}
async function begin(subject){
  try{
    currentSubject=subject;questions=await api("/api/questions/"+encodeURIComponent(subject));
    if(!questions.length){alert("Bu fandan savollar topilmadi.");return;}
    answers={};index=0;secondsLeft=300;
    showView("quiz");$("quiz-subject").textContent=subject.toUpperCase();
    render();startTimer();
  }catch(e){alert(e.message);}
}
function startTimer(){
  clearInterval(timerInterval);updateTimer();
  timerInterval=setInterval(()=>{secondsLeft--;updateTimer();if(secondsLeft<=0){clearInterval(timerInterval);finish(true);}},1000);
}
function updateTimer(){
  const m=String(Math.floor(secondsLeft/60)).padStart(2,"0"),s=String(secondsLeft%60).padStart(2,"0");
  $("timer").textContent=m+":"+s;
  $("timer").style.color=secondsLeft<=30?"#ff7c91":"";
}
function render(){
  const q=questions[index];
  $("counter").textContent=`${index+1}/${questions.length}`;
  $("progress").style.width=((index+1)/questions.length*100)+"%";
  $("question").textContent=q.question;
  const box=$("answers");box.innerHTML="";
  ["a","b","c","d"].forEach(k=>{
    const b=document.createElement("button");b.className="answer"+(answers[q.id]===k?" selected":"");
    b.innerHTML=`<span class="letter">${k.toUpperCase()}</span>${escapeHtml(q[k])}`;
    b.addEventListener("click",()=>{answers[q.id]=k;render();});box.appendChild(b);
  });
  const next=$("next");next.disabled=!answers[q.id];next.innerHTML=index===questions.length-1?'Yakunlash <span>✓</span>':'Keyingi savol <span>→</span>';
  next.onclick=()=>index===questions.length-1?finish(false):(index++,render());
}
async function finish(timeUp=false){
  if(!questions.length)return;
  clearInterval(timerInterval);$("next").disabled=true;
  try{
    const result=await api("/api/submit",{method:"POST",body:JSON.stringify({
      subject:currentSubject,answers,question_ids:questions.map(q=>q.id),full_name:userName
    })});
    lastResult={...result,subject:currentSubject,name:userName,date:new Date().toLocaleDateString("uz-UZ")};
    $("score").textContent=`${result.correct}/${result.total}`;
    $("result-fill").style.width=result.percent+"%";
    $("score-text").textContent=`Natija: ${result.percent}%${timeUp?" · Vaqt tugadi":""}`;
    $("certificate-note").textContent=result.certificate_eligible?"Tabriklaymiz! Sertifikat olish huquqini qo‘lga kiritdingiz.":"Sertifikat uchun kamida 70% natija talab etiladi.";
    $("certificate-btn").disabled=!result.certificate_eligible;
    $("certificate-btn").style.opacity=result.certificate_eligible?"1":".4";
    showView("result");
  }catch(e){alert(e.message);$("next").disabled=false;}
}
$("quit-quiz").addEventListener("click",()=>{clearInterval(timerInterval);showView("home");});
$("again-btn").addEventListener("click",()=>{lastResult=null;showView("home");start();});
$("certificate-btn").addEventListener("click",()=>{
  if(!lastResult?.certificate_eligible)return;
  const r=lastResult;
  const w=window.open("","_blank","width=900,height=650");
  if(!w){alert("Sertifikat oynasi bloklandi. Brauzerda pop-up oynalarga ruxsat bering.");return;}
  w.document.write(`<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>IQ+ Sertifikat</title><style>
  *{box-sizing:border-box}body{margin:0;padding:35px;background:#eef3fb;font-family:Arial,sans-serif;color:#122544}
  .cert{max-width:850px;min-height:560px;margin:auto;padding:55px;border:12px solid #173b70;outline:2px solid #d6ad55;outline-offset:-22px;background:white;text-align:center;position:relative}
  .logo{font-size:18px;font-weight:900;color:#2f72d8;letter-spacing:4px}.kicker{margin-top:48px;color:#b18b3f;letter-spacing:5px;font-size:13px;font-weight:bold}
  h1{font-size:42px;margin:12px 0;color:#173b70}.name{font-size:30px;font-weight:bold;margin:30px 0 12px;border-bottom:1px solid #c9d5e7;padding-bottom:14px}
  p{font-size:16px;line-height:1.7;color:#50617b}.score{font-size:28px;color:#2869c7;font-weight:bold;margin:25px}.foot{display:flex;justify-content:space-between;margin-top:55px;font-size:12px;color:#61718a}
  @media print{body{background:white;padding:0}.cert{margin:0 auto;page-break-inside:avoid}}
  </style></head><body><div class="cert"><div class="logo">IQ+ · IQTISODIYOT TEST ARENA</div><div class="kicker">BILIM VA YUTUQLAR</div><h1>SERTIFIKAT</h1><p>Ushbu sertifikat</p><div class="name">${escapeHtml(r.name)}</div><p><b>${escapeHtml(r.subject)}</b> fanidan bilim sinovini muvaffaqiyatli yakunlab,<br>yuqori natija ko‘rsatganligi uchun taqdim etiladi.</p><div class="score">${r.percent}% · ${r.correct}/${r.total}</div><div class="foot"><span>Sana: ${escapeHtml(r.date)}</span><span>IQ+ TEST PLATFORMASI</span></div></div><script>window.onload=()=>window.print()<\/script></body></html>`);
  w.document.close();
});
async function loadRanking(){
  try{
    const rows=await api("/api/leaderboard"),box=$("leaderboard");box.innerHTML="";
    if(!rows.length){box.innerHTML='<div class="empty">Reyting hozircha shakllanmagan.</div>';return;}
    rows.forEach((r,i)=>{
      const el=document.createElement("div");el.className="rank-row";
      el.innerHTML=`<span class="rank-number">${i+1}</span><span class="rank-name">${escapeHtml(r.full_name)}<small>${r.attempts} ta test · aniqlik ${r.accuracy||0}%</small></span><span class="rank-points">${r.points} ball</span>`;
      box.appendChild(el);
    });
  }catch(e){$("leaderboard").innerHTML=`<div class="empty">${escapeHtml(e.message)}</div>`;}
}
async function loadProfile(){
  try{
    const rows=await api("/api/history"),box=$("history");box.innerHTML="";
    if(!rows.length){box.innerHTML='<div class="empty">Test ishlashni boshlang — natijalaringiz shu yerda ko‘rinadi.</div>';return;}
    rows.forEach(r=>{
      const el=document.createElement("div");el.className="history-row";
      el.innerHTML=`<span>${escapeHtml(r.subject)}<br><small>${escapeHtml(r.created_at||"")}</small></span><b>${r.correct}/${r.total} · ${r.percent}%</b>`;
      box.appendChild(el);
    });
  }catch(e){$("history").innerHTML=`<div class="empty">${escapeHtml(e.message)}</div>`;}
}
start();
