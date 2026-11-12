import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getAuth,signInWithEmailAndPassword,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,onSnapshot} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';
const $=s=>document.querySelector(s);
const err=$('#auth-error'),status=$('#sync-status'),session=$('#session');
let auth,db,unsub=null,saveTimer=null,currentUid=null,dirty=false,loaded=false,remoteUpdate=false;
const setStatus=s=>status.textContent=s;
try{
 const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
}catch(e){err.textContent='Configure firebase-config.js antes de usar o aplicativo.';}
$('#login').addEventListener('submit',async ev=>{
 ev.preventDefault();if(!auth)return;
 err.textContent='';$('#login-button').disabled=true;
 try{await signInWithEmailAndPassword(auth,$('#email').value.trim(),$('#password').value)}
 catch(e){err.textContent='Não foi possível entrar. Verifique e-mail, senha e autorização.'}
 finally{$('#login-button').disabled=false;$('#password').value=''}
});
async function flush(){
 if(!currentUid||!loaded||!dirty||!auth.currentUser||auth.currentUser.uid!==currentUid)return;
 const uid=currentUid;dirty=false;setStatus('Sincronizando…');
 try{await setDoc(doc(db,'users',uid,'state','main'),{data:structuredClone(window.medpathGetState()),updatedAt:new Date().toISOString()});if(uid===currentUid)setStatus('Sincronizado')}
 catch(e){dirty=true;setStatus('Erro ao salvar — confira a conexão');console.error('Falha ao salvar progresso',e)}
}
window.medpathQueueSave=()=>{if(!loaded||remoteUpdate)return;dirty=true;setStatus('Alterações pendentes');clearTimeout(saveTimer);saveTimer=setTimeout(flush,900)};
window.addEventListener('pagehide',()=>{if(dirty)flush()});
$('#logout').onclick=async()=>{clearTimeout(saveTimer);await flush();await signOut(auth)};
if(auth)onAuthStateChanged(auth,async user=>{
 clearTimeout(saveTimer);unsub?.();unsub=null;loaded=false;dirty=false;currentUid=user?.uid||null;
 document.body.classList.remove('ready');session.hidden=true;$('#n').replaceChildren();$('#m').replaceChildren();
 if(!user){err.textContent='';return}
 try{
  err.textContent='Carregando biblioteca privada…';
  const [catSnap,stateSnap]=await Promise.all([getDoc(doc(db,'catalog','main')),getDoc(doc(db,'users',user.uid,'state','main'))]);
  if(!catSnap.exists())throw Error('Catálogo privado ainda não foi importado.');
  if(currentUid!==user.uid)return;
  const catalog=catSnap.data().dataJson?JSON.parse(catSnap.data().dataJson):catSnap.data().data;
  window.medpathHydrate(catalog,stateSnap.exists()?stateSnap.data().data:null);
  loaded=true;document.body.classList.add('ready');session.hidden=false;setStatus('Sincronizado');err.textContent='';
  // Estado inicial gerado por migrações deve ser persistido no perfil correto.
  window.medpathQueueSave();
  unsub=onSnapshot(doc(db,'users',user.uid,'state','main'),snap=>{
   if(!loaded||!snap.exists()||dirty)return;
   const incoming=snap.data().data;
   if(JSON.stringify(incoming)===JSON.stringify(window.medpathGetState()))return;
   remoteUpdate=true;try{window.medpathHydrate(catalog,incoming)}finally{remoteUpdate=false}
  },e=>setStatus('Falha na sincronização'));
 }catch(e){err.textContent=e.message||'Erro ao carregar dados privados.';console.error(e)}
});
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(console.warn);
