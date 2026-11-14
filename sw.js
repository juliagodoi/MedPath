// Cache SOMENTE da casca pública. Nunca cachear Firestore, Firebase Auth, Google Drive ou dados pessoais.
const CACHE='medpath-shell-v20261113-139-unified';
const ASSETS=['./','./index.html','./style.css','./app.js','./firebase-loader.js','./firebase-config.js','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin)return;
 if(!ASSETS.some(a=>new URL(a,self.registration.scope).pathname===url.pathname))return;
 event.respondWith(fetch(req).then(resp=>{if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return resp}).catch(()=>caches.match(req)));
});
