const tg = window.Telegram?.WebApp;
tg?.ready(); tg?.expand();
const initData = tg?.initData || "";
const headers = {"X-Telegram-Init-Data": initData, "Content-Type":"application/json"};
let currentSubject="", questions=[], answers={}, index=0, userName="";

async function api(path, options={}) {
  const res=await fetch(path,{...options,headers:{...headers,...options.headers}});
  const data=await res.json();
  if(!res.ok) throw new Error(data.detail || "Xatolik yuz berdi");
  return data;
}
async function start(){
  if(!initData){document.getElementById("subjects").innerHTML="<p>Bu platformani Telegram ichidagi bot tugmasi orqali oching.</p>";return;}
  try{
    const me=await api("/api/me");
    userName=me.first_name || "Talaba";
    document.getElementById("welcome").textContent=`Xush kelibsiz, ${userName}!`;
    const subjects=await api("/api/subjects");
    const box=document.getElementById("subjects"); box.innerHTML="";
    subjects.forEach(s=>{const b=document.createElement("button");b.className="subject";b.textContent="📚 "+s;b.onclick=()=>begin(s);box.appendChild(b)});
    if(!subjects.length) box.textContent="Hozircha fanlar qo‘shilmagan.";
  }catch(e){document.getElementById("subjects").textContent=e.message;}
}
async function begin(subject){
  try{
    currentSubject=subject;questions=await api("/api/questions/"+encodeURIComponent(subject));
    if(!questions.length){alert("Bu fandan savollar topilmadi.");return;}
    answers={};index=0;document.getElementById("home").classList.add("hidden");
    document.getElementById("quiz").classList.remove("hidden");
    document.getElementById("subject-title").textContent=subject;render();
  }catch(e){alert(e.message)}
}
function render(){
  const q=questions[index];document.getElementById("counter").textContent=`${index+1}/${questions.length}`;
  document.getElementById("progress").style.width=((index+1)/questions.length*100)+"%";
  document.getElementById("question").textContent=q.question;
  const box=document.getElementById("answers");box.innerHTML="";
  ["a","b","c","d"].forEach(k=>{const b=document.createElement("button");b.className="answer"+(answers[q.id]===k?" selected":"");b.textContent=k.toUpperCase()+". "+q[k];b.onclick=()=>{answers[q.id]=k;render()};box.appendChild(b)});
  const next=document.getElementById("next");next.disabled=!answers[q.id];next.textContent=index===questions.length-1?"Testni yakunlash":"Keyingi savol";
  next.onclick=()=>index===questions.length-1?finish(): (index++,render());
}
async function finish(){
  try{
    const result=await api("/api/submit",{method:"POST",body:JSON.stringify({subject:currentSubject,answers,questions,full_name:userName})});
    document.getElementById("quiz").classList.add("hidden");document.getElementById("result").classList.remove("hidden");
    document.getElementById("score").textContent=`${result.correct}/${result.total}`;
    document.getElementById("score-text").textContent=`Natija: ${result.percent}%`;
  }catch(e){alert(e.message)}
}
start();
