const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const HANGZHOU = { latitude: 30.2741, longitude: 120.1551 };
const $ = id => document.getElementById(id);
const state = { supabase:null,user:null,notes:[],drawing:null,editId:null,toastTimer:null };
const todayCN = () => new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
function toast(s){$("toast").textContent=s;$("toast").classList.add("show");clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>$("toast").classList.remove("show"),3000)}
function authMessage(s){$("auth-message").textContent=s}
function openAuth(){$("auth-modal").classList.remove("hidden");authMessage("")}
function closeAuth(){$("auth-modal").classList.add("hidden")}
function configured(){return SUPABASE_URL.startsWith("https://")&&SUPABASE_ANON_KEY.length>20}
function initSupabase(){
 if(!configured()){$("auth-open").textContent="配置登录服务";$("notes-subtitle").textContent="登录服务尚未配置；森林可以体验，便签保存暂不可用。";return}
 if(!window.supabase?.createClient){toast("登录组件无法加载，请检查网络。");return}
 state.supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
 state.supabase.auth.onAuthStateChange((_e,s)=>{state.user=s?.user||null;renderAuth();if(state.user){closeAuth();loadNotes()}else{state.notes=[];renderNotes()}});
 state.supabase.auth.getSession().then(({data})=>{state.user=data.session?.user||null;renderAuth();if(state.user)loadNotes()})
}
function renderAuth(){$("auth-open").classList.toggle("hidden",!!state.user);$("logout").classList.toggle("hidden",!state.user);$("login-prompt").classList.toggle("hidden",!!state.user);$("note-editor").classList.toggle("hidden",!state.user);$("notes-subtitle").textContent=state.user?"每一张便签都会留在你的墙上。跨日后，旧便签会成为只读回忆。":(configured()?"登录后，就可以把想法留在这里。":"登录服务尚未配置；森林可以体验，便签保存暂不可用。");if(state.user)$("auth-open").textContent=state.user.email||"已登录"}
function showAuth(){openAuth();if(!configured())authMessage("需要先在 script.js 配置 Supabase 项目 URL 与公开 anon/publishable key，并执行 supabase/schema.sql。当前不会把便签伪装成已云端保存。")}
async function authAction(mode){
 if(!state.supabase){showAuth();return}const email=$("auth-email").value.trim(),password=$("auth-password").value;
 if(!email||(mode!=="reset"&&!password)){authMessage("请填写邮箱和密码。");return}authMessage("正在处理…");let r;
 if(mode==="signup")r=await state.supabase.auth.signUp({email,password});
 else if(mode==="reset")r=await state.supabase.auth.resetPasswordForEmail(email,{redirectTo:location.href});
 else r=await state.supabase.auth.signInWithPassword({email,password});
 if(r.error){authMessage(r.error.message);return}
 if(mode==="signup"&&!r.data.session)authMessage("注册请求已提交，请查看邮箱完成验证后登录。");
 else if(mode==="reset")authMessage("如果该邮箱已注册，密码重置说明将发送到邮箱。");
 else{authMessage("成功，正在进入小世界…");toast("欢迎回来。")}
}
function renderNotes(){
 const wall=$("notes-wall");wall.replaceChildren();$("note-count").textContent=state.notes.length+" 张";
 if(!state.user){wall.innerHTML='<div class="empty-wall">登录后，你的便签才会出现在这里。<br>每一天的想法都会被好好保存。</div>';return}
 if(!state.notes.length){wall.innerHTML='<div class="empty-wall">便签墙还空着。<br>等你把第一份想法带回家。</div>';return}
 state.notes.forEach(n=>{const card=document.createElement("article");card.className="note-card";card.style.background=n.color||"#f5e6a9";const p=document.createElement("p");p.textContent=n.body||"";card.append(p);if(n.drawing_data){const img=document.createElement("img");img.src=n.drawing_data;img.alt="便签手绘";card.append(img)}const f=document.createElement("footer"),d=document.createElement("span");d.textContent=n.created_on||"";f.append(d);if(n.created_on===todayCN()){const actions=document.createElement("span"),e=document.createElement("button"),del=document.createElement("button");e.className=del.className="note-delete";e.textContent="编辑";del.textContent="删除";e.onclick=()=>editNote(n);del.onclick=()=>deleteNote(n.id);actions.append(e,del);f.append(actions)}else{const ro=document.createElement("span");ro.className="readonly-label";ro.textContent="已封存 · 只读";f.append(ro)}card.append(f);wall.append(card)})
}
async function loadNotes(){if(!state.supabase||!state.user)return;const {data,error}=await state.supabase.from("bunny_notes").select("id,body,drawing_data,color,created_on,created_at").order("created_at",{ascending:false});if(error){toast("读取便签失败："+error.message);return}state.notes=data||[];renderNotes()}
function setupCanvas(){const c=$("drawing"),ctx=c.getContext("2d");ctx.lineCap="round";ctx.lineJoin="round";ctx.lineWidth=4;function pt(e){const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height}}c.onpointerdown=e=>{state.drawing=pt(e);c.setPointerCapture(e.pointerId);ctx.beginPath();ctx.moveTo(state.drawing.x,state.drawing.y)};c.onpointermove=e=>{if(!state.drawing)return;const p=pt(e);ctx.strokeStyle=$("pen-color").value;ctx.lineTo(p.x,p.y);ctx.stroke();state.drawing=p};const end=()=>state.drawing=null;c.onpointerup=end;c.onpointercancel=end;$("pen-color").oninput=()=>ctx.strokeStyle=$("pen-color").value;$("clear-drawing").onclick=()=>ctx.clearRect(0,0,c.width,c.height)}
function editNote(n){if(n.created_on!==todayCN()){toast("这张便签已经跨日封存，不能再修改。");return}state.editId=n.id;$("note-text").value=n.body||"";$("pen-color").value=n.color||"#6f8c79";const c=$("drawing"),ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);if(n.drawing_data){const im=new Image();im.onload=()=>ctx.drawImage(im,0,0,c.width,c.height);im.src=n.drawing_data}$("save-note").textContent="保存修改　↗";$("save-status").textContent="仅当天可编辑。";$("note-text").scrollIntoView({behavior:"smooth",block:"center"})}
async function saveNote(){
 if(!state.supabase||!state.user){toast("请先登录，才能保存便签。");return}
 const body=$("note-text").value.trim(),c=$("drawing"),blank=document.createElement("canvas");blank.width=c.width;blank.height=c.height;const draw=c.toDataURL("image/png")===blank.toDataURL("image/png")?null:c.toDataURL("image/png");
 if(!body&&!draw){toast("先写一点文字，或在画布上画点什么吧。");return}
 const colors=["#f5e6a9","#f3d4cf","#d6e7ee","#dce9d1","#e8ddf0"],color=colors[Math.floor(Math.random()*colors.length)];$("save-note").disabled=true;$("save-status").textContent="正在保存…";let r;
 if(state.editId)r=await state.supabase.from("bunny_notes").update({body,drawing_data:draw,color}).eq("id",state.editId).eq("created_on",todayCN()).select();
 else r=await state.supabase.from("bunny_notes").insert({user_id:state.user.id,body,drawing_data:draw,color}).select();
 $("save-note").disabled=false;if(r.error){$("save-status").textContent="保存失败";toast("保存失败："+r.error.message);return}if(!r.data?.length){toast("未保存：便签可能已跨日封存，请刷新确认。");return}
 $("note-text").value="";c.getContext("2d").clearRect(0,0,c.width,c.height);state.editId=null;$("save-note").textContent="贴到墙上　↗";$("save-status").textContent="便签会按中国标准时间记录日期。";toast("便签已保存。");await loadNotes()
}
async function deleteNote(id){const n=state.notes.find(x=>x.id===id);if(!n||n.created_on!==todayCN()){toast("这张便签已封存，不能删除。");return}if(!confirm("确定删除今天这张便签吗？删除后无法恢复。"))return;const {error,data}=await state.supabase.from("bunny_notes").delete().eq("id",id).eq("created_on",todayCN()).select();if(error){toast("删除失败："+error.message);return}if(!data?.length){toast("未删除：便签可能已跨日封存。");return}toast("已删除今天的便签。");await loadNotes()}
function enterHome(){$("world").classList.add("hidden");$("home-view").classList.remove("hidden");window.scrollTo({top:0,behavior:"smooth"});if(state.user)loadNotes()}
function leaveHome(){$("home-view").classList.add("hidden");$("world").classList.remove("hidden");window.scrollTo({top:0,behavior:"smooth"})}
function wander(){const b=$("bunny");b.style.animationDuration="1.8s";$("weather-note").textContent=["兔兔在闻一闻花香。","兔兔轻轻跳了两下。","兔兔停下来看看云。","兔兔想去树下坐一会儿。","兔兔正在慢悠悠地散步。"][Math.floor(Math.random()*5)];setTimeout(()=>b.style.animationDuration="",2000)}
function applyTime(){const h=Number(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Shanghai",hour:"2-digit",hourCycle:"h23"}).format(new Date())),w=$("world");w.classList.remove("night","evening");if(h<5||h>=19){w.classList.add("night");$("scene-time").textContent="森林 · 星星亮了"}else if(h>=16){w.classList.add("evening");$("scene-time").textContent="森林 · 黄昏时分"}else $("scene-time").textContent=h<10?"森林 · 清晨":"森林 · 午后"}
async function loadWeather(){const cached=localStorage.getItem("lb-weather");if(cached){try{renderWeather(JSON.parse(cached),true)}catch{}}try{const url="https://api.open-meteo.com/v1/forecast?latitude="+HANGZHOU.latitude+"&longitude="+HANGZHOU.longitude+"&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FShanghai";const res=await fetch(url,{cache:"no-store"});if(!res.ok)throw Error("weather unavailable");const data=await res.json(),p={current:data.current,fetchedAt:new Date().toISOString()};localStorage.setItem("lb-weather",JSON.stringify(p));renderWeather(p,false)}catch{if(!cached){$("weather-pill").textContent="杭州 · 天气暂不可用";$("weather-note").textContent="暂时无法获取实时天气，森林仍然会安静地陪着你。"}}}
function renderWeather(p,cached){const c=p.current;if(!c)return;const code=Number(c.weather_code),rain=[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code),cloud=[2,3,45,48].includes(code),w=$("world");w.classList.toggle("rainy",rain);w.classList.toggle("cloudy",cloud);applyTime();const labels={0:"晴朗",1:"大致晴朗",2:"局部多云",3:"阴天",45:"雾",48:"雾凇",51:"毛毛雨",53:"毛毛雨",55:"毛毛雨",61:"小雨",63:"中雨",65:"大雨",71:"小雪",73:"中雪",75:"大雪",80:"阵雨",81:"阵雨",82:"强阵雨",95:"雷雨"};const t=new Date(p.fetchedAt).toLocaleTimeString("zh-CN",{timeZone:"Asia/Shanghai",hour:"2-digit",minute:"2-digit"});$("weather-pill").textContent="杭州 · "+Math.round(c.temperature_2m)+"° · "+(labels[code]||"多变天气")+(cached?" · 缓存 "+t:"");$("weather-note").textContent=(cached?"显示上次天气数据 · "+t:"杭州实时天气 · 更新于 "+t)+"。兔兔在这里慢慢生活。"}
function init(){initSupabase();setupCanvas();applyTime();loadWeather();setInterval(applyTime,60000);setInterval(loadWeather,900000);$("auth-open").onclick=showAuth;$("prompt-login").onclick=showAuth;$("auth-close").onclick=closeAuth;$("auth-modal").onclick=e=>{if(e.target===$("auth-modal"))closeAuth()};$("auth-form").onsubmit=e=>{e.preventDefault();authAction("login")};$("sign-up").onclick=()=>authAction("signup");$("forgot-password").onclick=()=>authAction("reset");$("logout").onclick=async()=>{if(state.supabase)await state.supabase.auth.signOut();state.user=null;state.notes=[];renderAuth();renderNotes();toast("已退出登录。")};$("enter-home").onclick=enterHome;$("leave-home").onclick=leaveHome;$("wander").onclick=wander;$("season-hint").onclick=()=>toast("四季花园会按日期变化；完整季节植物效果将在后续阶段完善。");$("save-note").onclick=saveNote;renderAuth();renderNotes()}
document.addEventListener("DOMContentLoaded",init);