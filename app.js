
const K='medpath.v1',$=s=>document.querySelector(s),e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),U=()=>Math.random().toString(36).slice(2,9);
const localDateKey=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
const D=()=>localDateKey(new Date()),add=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return localDateKey(x)},fmt=d=>d?d.split('-').reverse().join('/'):'—';
const wkS=()=>{const x=new Date(D()+'T12:00:00');return add(D(),-((x.getDay()+6)%7))};
const blank=()=>({cfg:{sem:'',total:12,intern:'',conc:'',theme:'',hrs:[0,2,2,2,2,2,1],goal:10},subs:[],cons:[],themes:[],qs:[],ans:[],errs:[],tasks:[],hist:[],qsessions:[]});
let S=blank();
function save(){window.medpathQueueSave?.(S)}
const ST=['Não iniciado','Em andamento','Finalizado'],AREAS=['Clínica Médica','Cirurgia Geral','Ginecologia e Obstetrícia','Pediatria','Medicina Preventiva e Social','Medicina de Família e Comunidade','Radiologia'],ERR=['Falta de conhecimento','Dificuldade de interpretação','Confusão entre diagnósticos','Dificuldade em identificar a conduta','Esquecimento','Desatenção'],DAYS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],DL=['Não iniciado','Em andamento','Finalizado','Revisado','Reforçar','Bom desempenho'],DC=['#8aa0b8','#5b95dc','#4cb5c9','#7a62d9','#d0554f','#12a58f'],PC={Faculdade:'#1e4f8f','Revisão':'#7a62d9','Residência':'#12a58f',Manual:'#8aa0b8'};
const sub=i=>S.subs.find(x=>x.id==i),con=i=>S.cons.find(x=>x.id==i),th=i=>S.themes.find(x=>x.id==i),qq=i=>S.qs.find(x=>x.id==i);
const studied=c=>!!c&&c.status!=='Não iniciado',finished=c=>!!c&&c.status==='Finalizado';
function acc(c){
  const external=(S.qsessions||[]).filter(x=>x.con===c.id).reduce((a,x)=>{a.n+=Number(x.total)||0;a.ok+=Number(x.correct)||0;return a},{n:0,ok:0});
  const internal=S.ans.filter(x=>x.con===c.id);
  const n=external.n+internal.length,ok=external.ok+internal.filter(x=>x.ok).length;
  return n?{n,ok,err:n-ok,p:Math.round(ok/n*100),sessions:(S.qsessions||[]).filter(x=>x.con===c.id).length}:{n:0,ok:0,err:0,p:null,sessions:0};
}
// Intervalos são regras de organização do estudo, não previsão de desempenho em provas.
function scorePlan(c){
  const a=acc(c);
  if(!a.n)return{days:3,name:'Sem questões registradas',level:'neutro',a};
  if(a.p<50)return{days:1,name:'Prioridade alta',level:'alta',a};
  if(a.n<5)return{days:3,name:'Amostra pequena',level:'moderada',a};
  if(a.p<70)return{days:3,name:'Reforçar',level:'moderada',a};
  if(a.p<85)return{days:7,name:'Acompanhar',level:'regular',a};
  return{days:14,name:'Boa evolução',level:'boa',a};
}
function dom(c){
  if(!studied(c))return 0;
  if(!finished(c))return 1;
  const a=acc(c);
  if(a.n>=5&&a.p<70)return 4;
  if(a.n>=5&&a.p>=85)return 5;
  if((c.revs||0)>=1)return 3;
  return 2;
}
const chip=c=>`<span class="chip" style="background:${DC[dom(c)]}">${DL[dom(c)]}</span>`,dueList=()=>S.cons.filter(c=>studied(c)&&c.next&&c.next<=D()).sort((a,b)=>a.next<b.next?-1:1);
const scoreText=c=>{const z=scorePlan(c);return `<span class="rev-priority">${z.a.n?`<b>${z.a.p}% de acertos</b> · ${z.a.ok}/${z.a.n} questões · `:''}${e(z.name)} · revisão a cada ${z.days} ${z.days===1?'dia':'dias'}${z.a.n&&z.a.n<5?' (dados iniciais)':''}</span>`};
const O=(l,s)=>l.map(x=>{x=Array.isArray(x)?x:[x,x];return `<option value="${e(x[0])}"${x[0]==s?' selected':''}>${e(x[1])}</option>`}).join(''),subO=()=>S.subs.map(s=>[s.id,`${s.sem}º · ${s.name}`]),conO=()=>[['','—'],...S.cons.map(c=>[c.id,c.name])],thO=()=>[['','—'],...S.themes.map(t=>[t.id,t.name])];
function F(title,fl,v,cb){v=v||{};const d=document.createElement('dialog');
const inp=([k,l,t,o,r])=>{let x;if(t=='a')x=`<textarea id="f_${k}">${e(v[k])}</textarea>`;else if(t=='s')x=`<select id="f_${k}">${O(typeof o=='function'?o():o,v[k])}</select>`;else if(t=='m')x=(o().map(z=>`<span class="ck"><input type="checkbox" name="f_${k}" value="${z[0]}"${(v[k]||[]).includes(z[0])?' checked':''}> ${e(z[1])}</span>`).join('')||'<small>Nada cadastrado ainda.</small>');else x=`<input id="f_${k}" type="${t||'text'}" value="${e(v[k])}">`;return `<div class="fl"><span>${l}${r?' *':''}</span>${x}</div>`};
d.innerHTML=`<h3>${title}</h3>${fl.map(inp).join('')}<p class="err" id="fe"></p><div class="row"><button class="b2" id="fc">Cancelar</button><button class="b" id="fs">Salvar</button></div>`;document.body.append(d);d.showModal();
d.querySelector('#fc').onclick=()=>d.remove();
d.querySelector('#fs').onclick=()=>{const o={};for(const[k,l,t,,r]of fl){if(t=='m')o[k]=[...d.querySelectorAll(`[name=f_${k}]:checked`)].map(i=>i.value);else{o[k]=d.querySelector('#f_'+k).value.trim();if(t=='number')o[k]=o[k]===''?'':+o[k];if(r&&o[k]===''){d.querySelector('#fe').textContent='Preencha: '+l;return}}}cb(o);d.remove();save();go()};return d}
function C(m,cb){const d=document.createElement('dialog');d.innerHTML=`<p>${m}</p><div class="row"><button class="b2" id="cn">Cancelar</button><button class="b" id="cy">Confirmar</button></div>`;document.body.append(d);d.showModal();d.querySelector('#cn').onclick=()=>d.remove();d.querySelector('#cy').onclick=()=>{d.remove();cb()}}
function del(c,id){C('Excluir este item?',()=>{if(c=='subs')S.cons=S.cons.filter(x=>x.sub!=id);if(c=='themes')S.cons.forEach(x=>x.themes=(x.themes||[]).filter(t=>t!=id));S[c]=S[c].filter(x=>x.id!=id);if(fsel==id)fsel='';save();go()})}
// Migração idempotente: converte o status antigo sem apagar questões, revisões ou histórico.
function migrateProgress(){
  if(!Array.isArray(S.qsessions))S.qsessions=[];
  if(S.studyV6)return;
  S.cons.forEach(c=>{
    if(!ST.includes(c.status)){
      c.status=c.status==='Não iniciado'||c.status==='Previsto para semestre futuro'?'Não iniciado':c.status==='Em andamento'?'Em andamento':'Finalizado';
    }
    if(!calendarValidDate(c.started)&&calendarValidDate(c.studied))c.started=c.studied;
    if(studied(c)&&!calendarValidDate(c.started))c.started=D();
    if(studied(c))c.studied=c.started;
    else c.next='';
  });
  S.studyV6=1;save();
}
// O início cria a primeira revisão para o dia seguinte, mesmo se o conteúdo estiver Em andamento.
function fix(c,wasStudied=false,dateChanged=false){
  if(!c)return false;
  let changed=false;
  if(!studied(c))return false;
  if(!calendarValidDate(c.started)){
    c.started=calendarValidDate(c.studied)?c.studied:D();changed=true;
  }
  if(c.studied!==c.started){c.studied=c.started;changed=true}
  if(!calendarValidDate(c.next)||!wasStudied||dateChanged){
    c.int=1;c.next=add(c.started,1);changed=true;
  }
  return changed;
}
function repairReviews(){
  let changed=false;
  S.cons.forEach(c=>{if(studied(c))changed=fix(c,true,false)||changed});
  if(changed)save();
}
function setSt(i,status){
  const c=con(i);if(!c||!ST.includes(status))return;
  const old=c.status,was=studied(c);c.status=status;
  if(studied(c)){
    if(!calendarValidDate(c.started))c.started=D();
    fix(c,was);
  }else{c.started='';c.studied='';c.next=''}
  if(old!==status)S.hist.push({d:D(),con:i,ev:'Status: '+status});
  save();go();
}
function updateStart(i,date){
  const c=con(i);if(!c||!calendarValidDate(date))return;
  c.started=date;
  if(!studied(c))c.status='Em andamento';
  c.studied=date;c.next=add(date,1);c.int=1;
  S.hist.push({d:D(),con:i,ev:'Início do estudo: '+fmt(date)});
  save();go();
}
function markStudied(i){
  const c=con(i);if(!c)return;
  c.status='Em andamento';updateStart(i,D());
}
function changeReviewDate(i){
  const c=con(i);if(!c||!studied(c))return;
  F('Alterar próxima revisão',[['next','Data','date',0,1]],{next:c.next||add(D(),1)},o=>{
    if(!calendarValidDate(o.next))return;c.next=o.next;
    S.hist.push({d:D(),con:i,ev:'Revisão reagendada: '+fmt(o.next)});
  });
}
function completeReview(i){
  const c=con(i);if(!c||!studied(c))return;
  const z=scorePlan(c);
  c.int=z.days;c.next=add(D(),z.days);c.last=D();c.revs=(Number(c.revs)||0)+1;
  S.hist.push({d:D(),con:i,ev:'Revisão concluída — '+z.name+(z.a.n?' ('+z.a.p+'% em '+z.a.n+' questões)':'')});
  save();go();
}
function rev(i){completeReview(i)}
function edCon(id,sb){
  const old=id?con(id):null,sbId=old?.sub||sb;
  const v=old?{...old,started:old.started||old.studied||''}:{status:'Não iniciado',started:''};
  const dlg=F('Conteúdo',[['name','Nome do conteúdo','text',0,1],['status','Status','s',ST],['started','Data de início','date']],v,o=>{
    let c=id?con(id):null;
    const was=!!c&&studied(c),oldDate=c?.started||'';
    if(c)Object.assign(c,o);else{c={id:U(),sub:sb,themes:[],cx:{},...o};S.cons.push(c)}
    if(studied(c)){
      if(!calendarValidDate(c.started))c.started=D();
      fix(c,was,!!oldDate&&c.started!==oldDate);
    }else{c.next='';c.studied='';c.started=''}
  });
  if(dlg){
    const field=dlg.querySelector('#f_name');
    if(field){
      const preview=document.createElement('div');preview.className='inc-live';
      const libPreview=document.createElement('div');libPreview.className='lib-live';
      field.closest('.fl').append(preview,libPreview);
      const sync=()=>{
        preview.innerHTML=incPreview(field.value,sbId,id?con(id)?.incMatch:'');preview.hidden=!preview.innerHTML.trim();
        libPreview.innerHTML=libPreviewHtml(field.value,sbId);libPreview.hidden=!libPreview.innerHTML.trim();
      };
      field.addEventListener('input',sync);sync();
    }
    const startField=dlg.querySelector('#f_started');
    const statField=dlg.querySelector('#f_status');
    if(startField&&statField){
      statField.addEventListener('change',()=>{if(statField.value!=='Não iniciado'&&!startField.value)startField.value=D()});
    }
  }
}

function edSub(id,sm){F('Disciplina',[['name','Nome','text',0,1],['sem','Semestre','number',0,1],['desc','Descrição','a'],['mat','Materiais de estudo','a'],['notes','Anotações','a']],id?sub(id):{sem:sm||S.cfg.sem},o=>id?Object.assign(sub(id),o):S.subs.push({id:U(),...o}))}
function mv(id,d){const i=S.cons.findIndex(x=>x.id==id),sb=S.cons[i].sub;let j=i+d;while(S.cons[j]&&S.cons[j].sub!=sb)j+=d;if(!S.cons[j])return;[S.cons[i],S.cons[j]]=[S.cons[j],S.cons[i]];save();go()}
function edTheme(id){F('Tema de residência',[['area','Grande área','s',AREAS],['name','Tema / doença','text',0,1],['desc','Descrição','a'],['dx','Diagnóstico','a'],['ddx','Diagnósticos diferenciais','a'],['exams','Exames complementares','a'],['tx','Tratamento e condutas','a'],['tips','Pontos importantes para provas','a'],['src','Fonte / origem do material','text']],id?th(id):{},o=>id?Object.assign(th(id),o):S.themes.push({id:U(),...o}))}

function edQ(id){const q=id?qq(id):{};F('Questão',[['text','Enunciado','a',0,1],['o0','Alternativa A','text',0,1],['o1','Alternativa B','text',0,1],['o2','Alternativa C','text',0,1],['o3','Alternativa D','text',0,1],['ans','Correta','s',[[0,'A'],[1,'B'],[2,'C'],[3,'D']]],['expl','Explicação','a'],['con','Conteúdo vinculado','s',conO,1],['theme','Tema de residência','s',thO],['diff','Dificuldade','s',['','Fácil','Média','Difícil']],['src','Fonte (só se você souber)','text']],id?{...q,o0:q.opts[0],o1:q.opts[1],o2:q.opts[2],o3:q.opts[3]}:{},o=>{const n={text:o.text,opts:[o.o0,o.o1,o.o2,o.o3],ans:+o.ans,expl:o.expl,con:o.con,theme:o.theme,diff:o.diff,src:o.src||'Cadastrada por mim'};id?Object.assign(q,n):S.qs.push({id:U(),...n})})}
function edT(id,plannedDate){F('Tarefa',[['txt','Descrição','text',0,1],['date','Data','date',0,1],['time','Horário (ex.: 08:30; sem horário = dia inteiro)','text'],['h','Duração em horas','number'],['p','Tipo','s',Object.keys(PC)],['dif','Dificuldade / observação','a']],id?S.tasks.find(t=>t.id==id):{date:plannedDate||D(),p:'Manual',h:1},o=>{if(id)Object.assign(S.tasks.find(t=>t.id==id),o);else S.tasks.push({id:U(),h:1,done:false,manual:1,...o})})}
function edCfg(){F('Configuração da jornada',[['sem','Semestre atual','number',0,1],['total','Duração total (semestres)','number',0,1],['intern','Semestre de início do internato','number'],['conc','Previsão de conclusão (ex.: 12/2029)','text'],['goal','Meta semanal (horas)','number']],S.cfg,o=>Object.assign(S.cfg,o))}
const tog=i=>{const t=S.tasks.find(x=>x.id==i);t.done=!t.done;if(t.done&&t.con){const c=con(t.con);if(c)S.hist.push({d:D(),con:c.id,ev:'Tarefa concluída'})}save();go()};
function post(i){const t=S.tasks.find(x=>x.id==i),c=[1,2,3].map(n=>add(t.date,n)).filter(d=>S.cfg.hrs[new Date(d+'T12:00').getDay()]>0);const ld=d=>S.tasks.filter(x=>x.date==d).length;t.date=c.sort((a,b)=>ld(a)-ld(b))[0]||add(t.date,1);save();go()}
function pick(qid,i){
  const q=qq(qid);if(!q||!q.con)return;
  const ok=i==q.ans;
  S.ans.push({id:U(),q:qid,con:q.con,pick:i,ok,d:D()});QA[qid]=i;
  if(!ok)S.errs.push({id:U(),q:qid,con:q.con,pick:i,reason:'',d:D()});
  const c=con(q.con);
  if(c){
    if(!studied(c)){c.status='Em andamento';c.started=D();c.studied=D()}
    c.next=add(D(),scorePlan(c).days);c.int=scorePlan(c).days;
  }
  save();go();
}

let fsel='',isel='',QF={},QA={};const V={};
const flt=(i,s)=>document.querySelectorAll(s).forEach(x=>x.style.display=x.textContent.toLowerCase().includes(i.value.toLowerCase())?'':'none');
const weekT=()=>{const ws=wkS();return S.tasks.filter(t=>t.date>=ws&&t.date<=add(ws,6)).sort((a,b)=>a.date<b.date?-1:1)};

// Exportação iCalendar (.ics) para calendários externos. Não acessa contas nem modifica calendários sem ação do usuário.
const calendarValidDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''))&&!Number.isNaN(new Date(s+'T12:00:00').getTime());
function calendarTime(s){
  const v=String(s||'').trim().replace(',',':');
  if(!v)return null;
  const m=v.match(/^(\d{1,2})(?:[:h.](\d{1,2})?)?$/i);
  if(!m)return null;
  const h=+m[1],min=+(m[2]||0);
  return h<=23&&min<=59?String(h).padStart(2,'0')+':'+String(min).padStart(2,'0'):null;
}
const calUTC=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
const calDay=d=>String(d).replace(/-/g,'');
function calendarDates(t){
  if(!calendarValidDate(t.date))return null;
  const hm=calendarTime(t.time);
  if(hm){
    const st=new Date(t.date+'T'+hm+':00');
    if(!Number.isNaN(st.getTime())){
      const h=Math.max(0.25,Math.min(24,Number(t.h)||1));
      const end=new Date(st.getTime()+h*3600000);
      return {allDay:false,start:calUTC(st),end:calUTC(end)};
    }
  }
  return {allDay:true,start:calDay(t.date),end:calDay(add(t.date,1))};
}
const calEscape=t=>String(t??'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
function calFold(line){
  // RFC 5545: no máximo 75 octetos por linha, inclusive texto UTF-8.
  const te=new TextEncoder();let out='',part='',bytes=0;
  for(const c of line){const n=te.encode(c).length;if(bytes+n>75){out+=part+'\r\n ';part='';bytes=1}part+=c;bytes+=n}
  return out+part;
}
function calendarIcs(tasks){
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MedPath//Cronograma de Estudos//PT-BR','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:MedPath - Estudos'];
  const now=calUTC(new Date());
  for(const t of tasks){
    const dt=calendarDates(t);if(!dt)continue;
    const note=['MedPath - '+(t.p||'Estudos')];
    if(t.dif)note.push('Observações: '+t.dif);
    if(t.con){const c=con(t.con);if(c)note.push('Disciplina: '+(sub(c.sub)?.name||''),'Conteúdo: '+c.name)}
    lines.push('BEGIN:VEVENT','UID:medpath-'+String(t.id||'sem-id').replace(/[^a-zA-Z0-9_-]/g,'')+'@medpath.local','DTSTAMP:'+now,
      'SUMMARY:'+calEscape(t.txt||'Estudar'),
      (dt.allDay?'DTSTART;VALUE=DATE:':'DTSTART:')+dt.start,
      (dt.allDay?'DTEND;VALUE=DATE:':'DTEND:')+dt.end,
      'DESCRIPTION:'+calEscape(note.join('\n')),
      'STATUS:CONFIRMED','END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(calFold).join('\r\n')+'\r\n';
}
function exportCalendar(mode,id){
  const tasks=id?S.tasks.filter(x=>x.id===id):mode==='week'?weekT():S.tasks;
  const valid=tasks.filter(t=>calendarValidDate(t.date));
  if(!valid.length){alert('Não há tarefas com data válida para exportar. Gere o cronograma ou adicione uma tarefa primeiro.');return}
  const b=new Blob([calendarIcs(valid)],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(b);
  const a=document.createElement('a');a.href=url;a.download='MedPath_'+(id?'tarefa':mode==='week'?'semana_'+wkS():'cronograma')+'.ics';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function googleCalendarTask(id){
  const t=S.tasks.find(x=>x.id===id);if(!t)return;
  const dt=calendarDates(t);if(!dt){alert('Informe uma data válida nesta tarefa.');return}
  const q=new URLSearchParams({action:'TEMPLATE',text:t.txt||'Estudar',dates:dt.start+'/'+dt.end,details:'MedPath · '+(t.p||'Estudos')+(t.dif?'\n'+t.dif:'')});
  const u='https://calendar.google.com/calendar/render?'+q.toString();
  const a=document.createElement('a');a.href=u;a.target='_blank';a.rel='noopener noreferrer';document.body.append(a);a.click();a.remove();
}
function openCalendarTask(id){
  const t=S.tasks.find(x=>x.id===id);if(!t)return;
  const d=document.createElement('dialog');
  d.innerHTML='<h3>Adicionar ao calendário</h3><p><b>'+e(t.txt)+'</b><br><small>'+fmt(t.date)+(calendarTime(t.time)?' · '+e(t.time):' · Dia inteiro')+'</small></p><p class="mu" style="font-size:13px">Escolha Google Agenda para abrir um evento pronto para confirmar, ou baixe o arquivo .ics para importar no calendário do celular, Apple ou Outlook.</p><div class="row"><button class="b" id="calGoogle">Google Agenda</button><button class="b2" id="calIcs">Baixar .ics</button><button class="b2" id="calClose">Fechar</button></div>';
  document.body.append(d);d.showModal();
  const close=()=>d.close();
  d.querySelector('#calGoogle').onclick=()=>{googleCalendarTask(id);close()};
  d.querySelector('#calIcs').onclick=()=>{exportCalendar('one',id);close()};
  d.querySelector('#calClose').onclick=close;
  d.addEventListener('close',()=>d.remove());
}

const tk=t=>`<div class="row tk ${t.done?'dn':''}"><input type="checkbox" ${t.done?'checked':''} onchange="tog('${t.id}')"><span class="chip" style="background:${PC[t.p]||'#888'}">${t.p}</span><span class="gr">${e(t.txt)}${t.time?` <small>· ${e(t.time)}</small>`:''}${t.dif?`<br><small>Obs.: ${e(t.dif)}</small>`:''}</span><small>${fmt(t.date)}</small><button class="b2" onclick="post('${t.id}')">Adiar</button><button class="b2" onclick="edT('${t.id}')">✎</button><button class="b2" onclick="del('tasks','${t.id}')">✕</button></div>`;
const bar=(l,p,n)=>`<div class="br"><span>${e(l)}</span><i><u style="width:${p}%"></u></i><small>${p}% · ${n}</small></div>`,K_=(a,b,c)=>`<div class="card"><small>${a}</small><div class="big">${b}</div><small>${c||''}</small></div>`,emp=t=>`<div class="card mu">${t}</div>`;
function accBy(f,externalKey=()=>null){
 const m={};
 const addData=(k,n,ok)=>{if(!k)return;(m[k]??={n:0,o:0});m[k].n+=n;m[k].o+=ok};
 S.ans.forEach(a=>addData(f(a),1,a.ok?1:0));
 (S.qsessions||[]).forEach(x=>addData(externalKey(x),Number(x.total)||0,Number(x.correct)||0));
 return Object.entries(m).map(([k,v])=>bar(k,Math.round(100*v.o/v.n),v.n+' questões')).join('')||'<p class="mu">Sem questões respondidas ainda.</p>';
}
function phase(){const sem=+S.cfg.sem||0,end=+S.cfg.intern||+S.cfg.total||0;if(!sem||!end)return null;if(S.cfg.intern&&sem>=+S.cfg.intern)return[4,'Você já está no semestre de internato definido.'];const r=sem/end,sh=S.cons.length?S.cons.filter(studied).length/S.cons.length:0;let p=r<.4?1:r<.7?2:3,w=`Você está no ${sem}º de ${end} semestres até o internato`;if(p>1&&sh<.4){p--;w+=`, mas só ${Math.round(sh*100)}% dos conteúdos cadastrados foram estudados (domínio real pesa mais que o tempo)`}return[p,w+'.']}
V.dashboard=()=>{const st=S.cons.filter(finished).length,wk=weekT(),dn=wk.filter(t=>t.done),A=S.ans.length+(S.qsessions||[]).reduce((v,x)=>v+(Number(x.total)||0),0),ok=S.ans.filter(x=>x.ok).length+(S.qsessions||[]).reduce((v,x)=>v+(Number(x.correct)||0),0),sem=+S.cfg.sem||0,tot=+S.cfg.total||0,dl=dueList(),rc=rec(),cur=S.subs.filter(s=>s.sem==sem);
return `<h1>Início</h1>`+(S.subs.length?'':`<div class="card ok"><b>Comece por aqui</b><p>Informe seu semestre e cadastre suas disciplinas e conteúdos. Nenhum dado acadêmico é preenchido por padrão.</p><button class="b" onclick="edCfg()">Configurar jornada</button></div>`)+`<div class="grid">${K_('Semestre atual',sem?sem+'º':'—',tot?`${Math.round(100*Math.max(sem-1,0)/tot)}% do curso concluído`:'Defina em Semestres')}${K_('Conteúdos estudados',`${st}/${S.cons.length}`)}${K_('Revisões pendentes',dl.length)}${K_('Acertos em questões',A?Math.round(100*ok/A)+'%':'—',A+' respondidas')}${K_('Horas na semana',dn.reduce((s,t)=>s+(t.h||1),0)+'h',`meta ${S.cfg.goal||'—'}h`)}${K_('Cronograma',wk.length?Math.round(100*dn.length/wk.length)+'%':'—',`${dn.length}/${wk.length} tarefas`)}</div><h3 style="margin-top:16px">Recomendado para você</h3>`+(rc.length?rc.map(x=>`<div class="card"><b>${e(x.t)}</b><br><small>Por quê: ${e(x.w)}</small></div>`).join(''):emp('Sem recomendações ainda. Cadastre conteúdos, vincule-os a temas de residência e registre seus estudos.'))+`<h3>Minha semana</h3><div class="card">${wk.map(tk).join('')||'<span class="mu">Nenhuma tarefa. Gere sua semana em Cronograma.</span>'}</div><div class="grid"><div class="card"><h3>Disciplinas em andamento</h3>${cur.map(s=>e(s.name)).join('<br>')||'<span class="mu">—</span>'}</div><div class="card"><h3>Estudados recentemente</h3>${S.cons.filter(c=>c.started).sort((a,b)=>a.started<b.started?1:-1).slice(0,5).map(c=>`${e(c.name)} <small>${fmt(c.started)}</small>`).join('<br>')||'<span class="mu">—</span>'}</div><div class="card"><h3>Precisam de reforço</h3>${S.cons.filter(c=>dom(c)==4).map(c=>e(c.name)).join('<br>')||'<span class="mu">—</span>'}</div></div>`}
V.jornada=()=>{const c=S.cfg,sem=+c.sem||0,t=+c.total||0;let h=`<h1>Semestres</h1><div class="card row"><div class="gr">Semestre atual: <b>${sem||'—'}</b> · Duração: <b>${t||'—'}</b> · Internato: <b>${c.intern||'—'}</b> · Conclusão: <b>${e(c.conc)||'—'}</b></div><button class="b" onclick="edCfg()">Editar</button></div>`;if(!sem)return h+emp('Defina o semestre atual e a duração do curso para ver seus semestres.');h+='<div class="grid">';for(let i=1;i<=t;i++){const ss=S.subs.filter(s=>s.sem==i),cs=S.cons.filter(x=>sub(x.sub)?.sem==i),tg=i<sem?'Cursado':i==sem?'Atual':'Futuro';h+=`<div class="card" style="${i==sem?'border-color:var(--p)':''}"><div class="row"><b class="gr">${i}º semestre</b><span class="chip" style="background:${i==sem?'#1e4f8f':i<sem?'#12a58f':'#8aa0b8'}">${tg}${c.intern&&i>=+c.intern?' · internato':''}</span></div>${ss.map(s=>`<div class="row"><a class="gr" href="#" onclick="openSub('${s.id}');return false">${e(s.name)}</a><button class="x" title="Excluir" onclick="del('subs','${s.id}')">✕</button></div>`).join('')||'<small>Sem disciplinas</small>'}<small>${cs.filter(finished).length}/${cs.length} conteúdos estudados</small><br><button class="b2" onclick="edSub(0,${i})">+ Disciplina</button></div>`}return h+'</div>'}




// O mês visível segue automaticamente a data local atual até a pessoa navegar.
let MC_VIEW=null,MC_SELECTED=null,MC_LAST_TODAY=D();
const mcView=()=>MC_VIEW||D().slice(0,7);
function mcSelect(date){MC_SELECTED=date;MC_VIEW=date.slice(0,7);go()}
function mcMove(n){const [y,m]=mcView().split('-').map(Number),d=new Date(y,m-1+n,1,12),ym=localDateKey(d).slice(0,7);
  const originalDay=+(MC_SELECTED||D()).slice(8,10),last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  MC_VIEW=ym;MC_SELECTED=ym+'-'+String(Math.min(originalDay,last)).padStart(2,'0');go()}
function mcToday(){MC_VIEW=null;MC_SELECTED=null;go()}
// Revisões são eventos calculados em tempo real a partir da data c.next.
// Atrasadas aparecem no dia de hoje, indicando a data original de vencimento.
function mcAutoRevisions(){
  const today=D();
  return S.cons.filter(c=>studied(c)&&calendarValidDate(c.next)).map(c=>({
    autoReview:true,con:c.id,p:'Revisão',due:c.next,
    date:c.next<today?today:c.next,
    txt:(c.next<today?'Revisão atrasada: ':'Revisar: ')+c.name
  }));
}
// Oculta somente tarefas de revisão geradas automaticamente por versões antigas,
// quando já existe a revisão calculada correspondente. Nunca apaga dados.
function mcVisibleTask(t){
  if(t.p!=='Revisão'||t.manual||t.done||!t.con)return true;
  const c=con(t.con);
  return !(c&&studied(c)&&calendarValidDate(c.next));
}
function mcRevisionRow(item){
  const c=con(item.con);if(!c)return '';
  return `<div class="row tk mc-auto-review"><span class="gr"><span class="mc-review-label">${item.due<D()?'Revisão atrasada':'Revisão programada'}</span><br><b>${e(c.name)}</b><br><small>${e(sub(c.sub)?.name||'')} · prevista ${fmt(item.due)}</small><br>${scoreText(c)}</span><div class="mc-review-actions"><button class="b2" onclick="logQuestions(null,'${c.id}')">+ Questões</button><button class="b" onclick="completeReview('${c.id}')">Concluir revisão</button></div></div>`;
}

function mcCalendar(){
  const [y,m]=mcView().split('-').map(Number),today=D(),first=new Date(y,m-1,1,12),leading=(first.getDay()+6)%7;
  const firstCell=new Date(y,m-1,1-leading,12),length=Math.ceil((leading+new Date(y,m,0).getDate())/7)*7;
  const selected=MC_SELECTED||today;
  const byDate={};
  const tasks=S.tasks.filter(mcVisibleTask),reviews=mcAutoRevisions();
  [...tasks,...reviews].forEach(t=>{if(calendarValidDate(t.date))(byDate[t.date]??=[]).push(t)});
  Object.values(byDate).forEach(a=>a.sort((a,b)=>Number(!!b.autoReview)-Number(!!a.autoReview)||(a.time||'99:99').localeCompare(b.time||'99:99')||String(a.txt).localeCompare(String(b.txt))));
  let days='';for(let i=0;i<length;i++){
    const d=new Date(firstCell);d.setDate(firstCell.getDate()+i);const key=localDateKey(d),a=byDate[key]||[];
    const outside=key.slice(0,7)!==mcView(),isToday=key===today,isSelected=key===selected;
    const classes=['mc-day',outside?'mc-out':'',isToday?'mc-today':'',isSelected?'mc-selected':''].filter(Boolean).join(' ');
    days+=`<button type="button" class="${classes}" aria-label="${e(d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'}))}: ${a.length} ${a.length===1?'atividade':'atividades'}" ${isToday?'aria-current="date"':''} ${isSelected?'aria-pressed="true"':'aria-pressed="false"'} onclick="mcSelect('${key}')"><span class="mc-num">${d.getDate()}</span>${a.slice(0,2).map(t=>`<span class="mc-event ${t.done?'mc-done':''}" style="--event-color:${PC[t.p]||'#8aa0b8'}" title="${e(t.txt)}">${t.time?e((calendarTime(t.time)||t.time)+' · '):''}${e(t.txt)}</span>`).join('')}${a.length>2?`<span class="mc-more">+${a.length-2}</span>`:''}</button>`;
  }
  const dayEvents=byDate[selected]||[],monthTasks=tasks.filter(t=>(t.date||'').startsWith(mcView())),done=monthTasks.filter(t=>t.done).length;
  const monthReviews=reviews.filter(r=>r.date.startsWith(mcView())).length;
  const monthLabel=first.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}),title=monthLabel[0].toUpperCase()+monthLabel.slice(1);
  const rawDayText=new Date(selected+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'}),selectedText=rawDayText[0].toUpperCase()+rawDayText.slice(1);
  return `<div class="card"><div class="mc-toolbar"><h3>${e(title)}</h3><div class="mc-actions"><button class="b2" aria-label="Mês anterior" title="Mês anterior" onclick="mcMove(-1)">‹</button><button class="b2" onclick="mcToday()">Hoje</button><button class="b2" aria-label="Próximo mês" title="Próximo mês" onclick="mcMove(1)">›</button></div></div><div class="mc-weekdays">${['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(t=>`<span>${t}</span>`).join('')}</div><div class="mc-grid">${days}</div><div class="mc-day-details"><div class="row"><h3 class="gr">${e(selectedText)}${selected===today?' · Hoje':''}</h3><button class="b2" onclick="edT(null,'${selected}')">+ Tarefa neste dia</button></div>${dayEvents.length?dayEvents.map(t=>t.autoReview?mcRevisionRow(t):tk(t)).join(''):'<p class="mu" style="margin:10px 0 0">Nenhuma atividade neste dia.</p>'}</div></div><div class="row mc-review-count" style="margin-top:-4px;margin-bottom:12px">${done}/${monthTasks.length} tarefas concluídas neste mês · ${monthReviews} ${monthReviews===1?'revisão automática':'revisões automáticas'}</div>`;
}

V.cronograma=()=>`<div class="row" style="margin-bottom:12px"><h1 class="gr" style="margin:0">Cronograma</h1><button class="b2" onclick="edT()">+ Tarefa</button><button class="b" onclick="gen()">Gerar semana</button></div><div class="card"><h3>Disponibilidade (horas por dia; 0 = descanso)</h3><div class="row">${[1,2,3,4,5,6,0].map(d=>`<label>${DAYS[d]}<br><input type="number" min="0" max="12" style="width:64px" value="${S.cfg.hrs[d]}" onchange="S.cfg.hrs[${d}]=+this.value||0;save()"></label>`).join('')}</div></div>${mcCalendar()}`;

V.revisoes=()=>{
 const today=D(),all=S.cons.filter(c=>studied(c)&&calendarValidDate(c.next)).sort((a,b)=>a.next.localeCompare(b.next)||a.name.localeCompare(b.name));
 const overdue=all.filter(c=>c.next<today),due=all.filter(c=>c.next===today),upcoming=all.filter(c=>c.next>today);
 const task=(c,ready)=>`<div class="row tk"><span class="gr"><b>${e(c.name)}</b><br><small>${e(sub(c.sub)?.name||'Sem disciplina')} · ${fmt(c.next)}</small><br>${scoreText(c)}</span><div class="q-log-actions"><button class="b2" onclick="logQuestions(null,'${c.id}')">+ Questões</button>${ready?`<button class="b" onclick="completeReview('${c.id}')">Concluir revisão</button>`:''}<button class="b2" onclick="changeReviewDate('${c.id}')">Data</button></div></div>`;
 return `<h1>Revisões</h1><p class="review-board-intro mu">A primeira revisão é agendada para o dia seguinte ao início do estudo. Depois, os intervalos são ajustados pelo desempenho nas questões registradas. Você também pode concluir uma revisão sem registrar questões.</p>
 <div class="grid"><div class="card"><small>Atrasadas</small><div class="big">${overdue.length}</div></div><div class="card"><small>Hoje</small><div class="big">${due.length}</div></div><div class="card"><small>Próximas</small><div class="big">${upcoming.length}</div></div></div>
 <div class="card review-due"><h3>Atrasadas</h3>${overdue.map(c=>task(c,true)).join('')||'<div class="review-empty">Nenhuma revisão atrasada.</div>'}</div>
 <div class="card review-due"><h3>Hoje</h3>${due.map(c=>task(c,true)).join('')||'<div class="review-empty">Nenhuma revisão para hoje.</div>'}</div>
 <div class="card review-upcoming"><h3>Próximas revisões</h3>${upcoming.map(c=>task(c,false)).join('')||'<div class="review-empty">Nenhuma revisão agendada.</div>'}</div>
 <div class="card"><h3>Histórico recente</h3>${S.hist.filter(x=>x.ev.startsWith('Revisão concluída')).slice(-10).reverse().map(x=>`<div class="review-mini">${fmt(x.d)} · ${e(con(x.con)?.name||'Conteúdo removido')} — ${e(x.ev)}</div>`).join('')||'<span class="mu">Nenhuma revisão concluída.</span>'}</div>`;
}

const sq=(k,v)=>{QF[k]=v;go()};
V.questoes=()=>{const f=QF,qs=S.qs.filter(q=>{const c=con(q.con),t=th(q.theme);return(!f.area||t?.area==f.area)&&(!f.sub||c?.sub==f.sub)&&(!f.con||q.con==f.con)&&(!f.theme||q.theme==f.theme)&&(!f.diff||q.diff==f.diff)&&(!f.st||(f.st=='e')==!!(c&&studied(c)))}),sl=(k,l,o)=>`<select onchange="sq('${k}',this.value)">${O([['',l],...o],f[k])}</select>`;return `<div class="row"><h1 class="gr">Questões</h1><button class="b" onclick="edQ()">+ Questão</button></div><div class="card row">${sl('area','Área',AREAS)}${sl('sub','Disciplina',subO())}${sl('con','Conteúdo',conO().slice(1))}${sl('theme','Tema',thO().slice(1))}${sl('diff','Dificuldade',['Fácil','Média','Difícil'])}${sl('st','Estudo',[['e','Já estudado'],['n','Não estudado']])}<button class="b2" onclick="QF={};go()">Limpar</button></div>`+(S.qs.length?'':emp('Nenhuma questão. Adicione manualmente as questões que você tem de fontes autorizadas; o sistema não inclui bancos de questões.'))+qs.map(q=>{const a=QA[q.id],c=con(q.con);return `<div class="card"><small>${e(c?.name)||'sem conteúdo'} · ${e(th(q.theme)?.name)||'sem tema'} · ${e(q.diff)||'—'} · Fonte: ${e(q.src)}</small><p>${e(q.text)}</p>${q.opts.map((o,i)=>`<div><button class="b2" style="width:100%;text-align:left;${a!=null?(i==q.ans?'border-color:var(--g)':i==a?'border-color:var(--r)':''):''}" ${a!=null?'disabled':`onclick="pick('${q.id}',${i})"`}>${'ABCD'[i]}) ${e(o)}</button></div>`).join('')}${a!=null?`<p><b>${a==q.ans?'Correto.':'Incorreto. Resposta: '+'ABCD'[q.ans]}</b> ${e(q.expl)}</p>`:''}<button class="b2" onclick="edQ('${q.id}')">✎</button> <button class="b2" onclick="del('qs','${q.id}')">✕</button></div>`}).join('')}
V.erros=()=>`<h1>Caderno de erros</h1>`+(S.errs.length?`<div class="card">${ERR.map(r=>`<span class="chip" style="background:#5d7089">${r}: ${S.errs.filter(x=>x.reason==r).length}</span>`).join(' ')}</div>`+[...S.errs].reverse().map(x=>{const q=qq(x.q),c=con(x.con);return q?`<div class="card"><small>${fmt(x.d)} · ${e(c?.name)} · próxima revisão ${fmt(c?.next)}</small><p>${e(q.text)}</p>Marcada: ${'ABCD'[x.pick]} · Correta: ${'ABCD'[q.ans]}<p>${e(q.expl)}</p><select onchange="S.errs.find(y=>y.id=='${x.id}').reason=this.value;save();go()">${O([['','Motivo do erro…'],...ERR],x.reason)}</select> <button class="b2" onclick="del('errs','${x.id}')">✕</button></div>`:''}).join(''):emp('Nenhum erro registrado. Erros em questões entram aqui automaticamente.'));
const oldErrorBoard=V.erros;
V.erros=()=>{
  const low=S.cons.map(c=>({c,z:scorePlan(c)})).filter(x=>x.z.a.err>0).sort((a,b)=>b.z.a.err-a.z.a.err);
  const intro=`<h1>Caderno de erros</h1><div class="card"><h3>Erros por conteúdo</h3><small>Resumo de erros registrados em questões externas e no banco do MedPath. Você pode lançar novos resultados sem transcrever enunciados.</small>${low.length?low.map(({c,z})=>`<div class="row q-log-row"><span class="gr"><b>${e(c.name)}</b> <small>· ${e(sub(c.sub)?.name)}</small><br><small>${z.a.err} erros de ${z.a.n} questões · ${z.a.p}% de acertos</small><br>${scoreText(c)}</span><button class="b2" onclick="logQuestions(null,'${c.id}')">+ Questões</button></div>`).join(''):'<p class="mu">Nenhum erro registrado ainda.</p>'}</div>`;
  return intro+oldErrorBoard().replace('<h1>Caderno de erros</h1>','');
};
V.estatisticas=()=>{const A=S.ans.length+(S.qsessions||[]).reduce((n,x)=>n+(Number(x.total)||0),0),ev=S.cons.filter(c=>c.studied).slice(0,6),wk=[5,4,3,2,1,0].map(i=>{const a=add(wkS(),-7*i),b=add(a,6),x=S.ans.filter(y=>y.d>=a&&y.d<=b),z=(S.qsessions||[]).filter(y=>y.date>=a&&y.date<=b),n=x.length+z.reduce((v,y)=>v+Number(y.total),0),ok=x.filter(y=>y.ok).length+z.reduce((v,y)=>v+Number(y.correct),0);return n?bar('Sem. '+fmt(a).slice(0,5),Math.round(100*ok/n),n+' q.'):''}).join('');return `<h1>Estatísticas</h1><div class="grid"><div class="card"><h3>Questões por área</h3>${accBy(a=>th(qq(a.q)?.theme)?.area,x=>{const c=con(x.con);return c?(rel(c).temas?.[0]?.t?.area||sub(c.sub)?.name):null})}</div><div class="card"><h3>Questões por disciplina</h3>${accBy(a=>sub(con(a.con)?.sub)?.name,x=>sub(x.sub)?.name)}</div></div><div class="card"><h3>Evolução semanal</h3>${wk||'<span class="mu">Sem dados.</span>'}</div><div class="card"><h3>Evolução por semestre</h3>${[...new Set(S.subs.map(s=>s.sem))].sort((a,b)=>a-b).map(n=>{const cs=S.cons.filter(c=>sub(c.sub)?.sem==n);return bar(n+'º semestre',cs.length?Math.round(100*cs.filter(finished).length/cs.length):0,cs.length+' conteúdos')}).join('')||'<span class="mu">Sem dados.</span>'}</div><div class="card"><h3>Mapa de domínio</h3><div class="row">${DL.map((l,i)=>`<span class="chip" style="background:${DC[i]}">${l}</span>`).join('')}</div>${S.subs.map(s=>`<p><b>${e(s.name)}</b><br>${S.cons.filter(c=>c.sub==s.id).map(c=>`${e(c.name)} ${chip(c)}`).join(' · ')||'<small>—</small>'}</p>`).join('')||'<p class="mu">Cadastre disciplinas e conteúdos.</p>'}<small>Indicadores são ferramentas de acompanhamento de estudo, não avaliação formal de competência clínica. O nível de domínio exige estudo, revisões e questões, não só percentual de acertos.</small></div><div class="card"><h3>Evolução integrada</h3>${ev.map(c=>`<p>Você estudou ${e(c.name)} em ${fmt(c.studied)}${c.revs?`, revisou ${c.revs}×`:''}${rel(c).temas.length?` e se relaciona com ${rel(c).temas.slice(0,2).map(x=>x.tm).join(', ')}`:''}.</p>`).join('')||'<span class="mu">Sem histórico ainda.</span>'}</div>`}
V.config=()=>`<h1>Configurações</h1><div class="card row"><span class="gr">Tema</span>${[['','Automático'],['light','Claro'],['dark','Escuro']].map(([v,l])=>`<button class="b2" onclick="S.cfg.theme='${v}';save();ap();go()">${l}</button>`).join('')}<button class="b2" onclick="edCfg()">Semestre e metas</button></div><div class="card"><h3>Backup (exportar / importar)</h3><p><small>Os dados ficam só neste navegador. Copie o texto abaixo para guardar um backup, ou cole um backup e importe.</small></p><textarea id="bk" style="min-height:140px">${e(JSON.stringify(S))}</textarea><div class="row"><button class="b2" onclick="$('#bk').select();document.execCommand('copy')">Copiar</button><input type="file" accept=".json,text/plain" onchange="const r=new FileReader();r.onload=()=>$('#bk').value=r.result;r.readAsText(this.files[0])"><button class="b" onclick="try{const o=JSON.parse($('#bk').value);if(!o.subs||!o.cons)throw 0;S={...blank(),...o};save();ap();go()}catch(x){C('Backup inválido.',()=>{})}">Importar</button><button class="b2" onclick="C('Apagar todos os dados?',()=>{S=blank();save();go()})">Apagar tudo</button></div></div>`;
const NAV=[['inicio','Início'],['semestres','Semestres'],['residencia','Residência'],['questoes','Questões'],['cronograma','Cronograma'],['desempenho','Desempenho']];
const TB={};let RS='',BK=null,GS='';
const sec=(k,l,f)=>{const a=TB[k]||l[0][0];return `<div class="row" style="margin-bottom:12px">${l.map(([v,t])=>`<button class="${v==a?'b':'b2'}" onclick="TB['${k}']='${v}';go()">${t}</button>`).join('')}</div>`+f[a]()};
const bk=()=>BK?`<button class="b2" style="margin-bottom:10px" onclick="const f=BK.fn;BK=null;f()">← Voltar: ${e(BK.lab)}</button>`:'';
const nm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''),nw=s=>nm(s).split(/\W+/);
function to(h,k,v){if(k)TB[k]=v;location.hash=='#'+h?go():location.hash=h}
function openTh(id){const s=sub(fsel);BK={lab:s?s.name:'disciplina',fn:()=>{if(s)fsel=s.id;to('semestres','semestres','disc')}};RS=id;to('residencia','res','lib')}



function setTh(i,v){th(i).st=v;save();go()}
let G1 = null;let G2 = null;
let GE=[],GT={};
function freq(t){if(t.g){const[ge,gt]=t.g.split('|'),r=(GT[ge]||[]).find(x=>x[0]==gt);if(r)return{p:+r[1],esp:ge,tm:gt,lv:+r[1]>=20?'Muito prevalente':+r[1]>=10?'Prevalente':'Menor prevalência'}}const n=nm(t.name);let b=null;if(n.length<4)return b;Object.entries(GT).forEach(([esp,l])=>l.forEach(([tm,p])=>{const m=nm(tm);if((n.includes(m)||m.includes(n))&&(!b||+p>b.p))b={p:+p,esp,tm}}));return b}



V.histq=()=>`<h1>Histórico de questões</h1>`+(S.ans.length?`<div class="card">${[...S.ans].reverse().slice(0,60).map(a=>{const q=qq(a.q);return `<div class="tk">${a.ok?'✔':'✘'} <small>${fmt(a.d)}</small> ${e((q?q.text:'(questão removida)').slice(0,90))} <small>· ${e(con(a.con)?.name)}</small></div>`}).join('')}</div>`:emp('Nenhuma questão respondida ainda.'));
V.inicio=()=>sec('inicio',[['r','Resumo'],['c','Configurações']],{r:V.dashboard,c:V.config});
V.semestres=()=>sec('semestres',[['sem','Semestres'],['disc','Disciplinas']],{sem:V.jornada,disc:V.faculdade});
const CR=V.cronograma;
let LQ='',OT='';
function freq(t){if(t.g){const[ge,gt]=t.g.split('|'),r=(GT[ge]||[]).find(x=>x[0]==gt);if(r)return{p:+r[1],esp:ge,tm:gt,lv:+r[1]>=20?'Muito prevalente':+r[1]>=10?'Prevalente':'Menor prevalência'}}const n=nm(t.name);let b=null;if(n.length<4)return b;Object.entries(GT).forEach(([esp,l])=>{if(t.esp&&t.esp!=esp)return;l.forEach(([tm,p])=>{const m=nm(tm);if((n.includes(m)||m.includes(n))&&(!b||+p>b.p))b={p:+p,esp,tm,lv:+p>=20?'Muito prevalente':+p>=10?'Prevalente':'Menor prevalência'}})});return b}
const pb=t=>{const f=freq(t);return f?`<span class="chip" style="background:${{'Muito prevalente':'#12a58f','Prevalente':'#5b95dc'}[f.lv]||'#8aa0b8'}">${f.lv}</span>`:''};
// Classificação das especialidades do catálogo nas grandes áreas.
// A função AG estava ausente e impedia a migração após o login.
function AG(value){
  const n=nm(value);
  if(AREAS.some(a=>nm(a)===n))return AREAS.find(a=>nm(a)===n);
  if(/pediatr|neonat|puericult/.test(n))return 'Pediatria';
  if(/ginec|obstetr|mastolog/.test(n))return 'Ginecologia e Obstetrícia';
  if(/cirurg|ortoped|otorrino|oftalm|urolog|anestes|traumatolog|proctolog/.test(n))return 'Cirurgia Geral';
  if(/preventiv|saude coletiva|epidemiolog|saude publica|medicina social/.test(n))return 'Medicina Preventiva e Social';
  if(/familia|comunidade|atencao primaria/.test(n))return 'Medicina de Família e Comunidade';
  if(/radiolog|imagem/.test(n))return 'Radiologia';
  return 'Clínica Médica';
}
const ar=x=>AG(x);

function mig() {
  if (S.v2) return;

  S.themes.forEach(t => {
    if (!t.esp) {
      const f = freq(t);
      t.esp = f ? f.esp : '';
    }
  });

  GE.forEach(([esp]) => {
    const temas = GT[esp] || [];

    temas.forEach(([tm]) => {
      if (!S.themes.some(t =>
        nm(t.name) == nm(tm) ||
        (t.esp == esp && (freq(t) || {}).tm == tm)
      )) {
        S.themes.push({
          id: U(),
          area: ar(esp),
          esp,
          name: tm,
          src: 'Guia Estatístico ENAMED (Estratégia MED): estrutura e prevalência; conteúdo ainda não importado'
        });
      }
    });
  });

  S.v2 = 1;
  save();
}

const AUTO_TEXT_MARKERS={"fisio":["43e37cd1:187","ca6f4e99:232","e5040aea:534"],"classif":["3c90dd43:453","57bb1472:329","6dcec96d:683","893814e0:500","b026e0c1:396","e3315ef8:336"],"dx":["1d8c5fe1:885","422dab88:549","521cb74b:627","7c6a465f:841","b5335041:1638","d2ab35a4:305","f6b6e5e8:172"],"exams":["107d0e3a:460","5ba31e13:442","7e0e69d4:294","a044fe2c:346"],"tx":["1461cccf:768","2fa1b0df:1406","3ac53b46:724","4d0a04df:1632","66ce1b32:908","c57c9272:307","e4c04fb3:1807"],"ddx":["020b5223:706"],"compl":["911a4138:749"],"tips":["681d8e4e:329","6b99206c:403","71e5de33:137","f761f906:227"],"outros":["f172c237:1110"],"src":["4bf0a0c4:121","66dc5c51:144","801ce9b8:131","a57f5495:204","bd8b31ce:159","c3d5ef09:133"],"desc":["026afdc6:306","10cdb3f0:214","675bae6a:364","808fbd7b:200"]};
// Remove apenas os preenchimentos inseridos automaticamente em versoes anteriores.
// Anotacoes editadas ou escritas pelo usuario nao sao alteradas.
function autoTextHash(value){
  let h=2166136261;
  for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);
  return (h>>>0).toString(16).padStart(8,'0')+':'+value.length;
}
function cleanAutoText(){
  if(S.v5)return;
  let changed=false;
  for(const t of S.themes){
    for(const [field,hashes] of Object.entries(AUTO_TEXT_MARKERS)){
      if(typeof t[field]==='string'&&hashes.includes(autoTextHash(t[field]))){delete t[field];changed=true;}
    }
  }
  S.v5=1;
  save();
}

function openTh(id){const s=sub(fsel);BK={lab:s?s.name:'disciplina',fn:()=>{if(s)fsel=s.id;to('semestres','semestres','disc')}};OT=id;to('residencia','res','lib')}

function edTheme(id){F('Assunto da Biblioteca',[['area','Grande área','s',AREAS],['esp','Especialidade','text'],['name','Assunto / doença','text',0,1],['desc','Resumo','a'],['fisio','Fisiopatologia','a'],['classif','Classificação','a'],['dx','Diagnóstico','a'],['exams','Exames complementares','a'],['tx','Tratamento e conduta','a'],['compl','Complicações','a'],['tips','Particularidades para provas','a'],['outros','Outros subtópicos','a'],['src','Fonte / origem (Estratégia, Medcof, Medway…)','text'],['linkMedway','Link do PDF no Medway (opcional)','text'],['linkEstrategia','Link do PDF na Estratégia (opcional)','text'],['linkMedcof','Link do PDF no Medcof (opcional)','text']],id?th(id):{},o=>id?Object.assign(th(id),o):S.themes.push({id:U(),...o}))}


// PDFs encontrados nas pastas conectadas do Drive e em catálogos anteriores do MedPath.
// A identificação da aula é independente do percentual no Guia Estatístico.
let DRIVE_AULAS_INDEX = null;
let DRIVE_TOPIC_EXTRA = null;
const DRIVE_PROVIDERS=[['medway','Medway'],['estrategia','Estratégia'],['medcof','Medcof']];
const driveKey=t=>incNorm(String(t.esp||'')+'|'+String(t.name||''));
function driveFileUrl(id){
  // Só transformar IDs de arquivo já catalogados em URLs diretas do Google Drive.
  return /^[A-Za-z0-9_-]{12,128}$/.test(String(id||''))
    ?'https://drive.google.com/file/d/'+encodeURIComponent(id)+'/view':null;
}
function driveSubject(esp){
  const n=incNorm(esp||'');
  if(n==='medicina preventiva e social'||n==='medicina de familia e comunidade')return 'preventiva';
  if(n==='cirurgia geral')return 'cirurgia';
  return n;
}
function driveWords(s){return incWords(s).filter(w=>w.length>=3)}
function driveTopicScore(input,candidate){
  const a=incNorm(input),b=incNorm(candidate);
  if(a===b)return 120;
  const aw=driveWords(input),bw=driveWords(candidate);
  if(!aw.length||!bw.length)return 0;
  if(aw.length===bw.length && aw.every(x=>bw.includes(x)))return 111;
  // Apenas associações com pelo menos duas palavras específicas em comum.
  const common=aw.filter(w=>bw.includes(w)).length;
  if(common<2)return 0;
  const precision=common/Math.max(aw.length,bw.length);
  if(precision>=.75)return 84+Math.round(precision*18);
  if(precision>=.60 && Math.min(aw.length,bw.length)>=3)return 73;
  return 0;
}
function driveFilesFor(t){
  if(!t)return [];
  const matches=[];
  const specialty=driveSubject(t.esp);
  for(const [key,files] of Object.entries(DRIVE_AULAS_INDEX||{})){
    const cut=key.indexOf('|'),esp=key.slice(0,cut),title=key.slice(cut+1);
    if(esp!==specialty)continue;
    const score=driveTopicScore(t.name,title);
    if(score>=73)matches.push({score,files});
  }
  matches.sort((a,b)=>b.score-a.score);
  const found=[];
  // Se existe PDF exato, não misturar com outros assuntos apenas semelhantes.
  const best=matches[0]?.score||0;
  for(const m of matches.filter(x=>x.score>=Math.max(73,best-13)).slice(0,5))
    for(const [provider,value] of Object.entries(m.files||{})){
      const id=value?.[0],name=value?.[1];
      if(driveFileUrl(id))found.push({provider,id,name:String(name||'Aula em PDF'),origin:'catalogado'});
    }
  const key=specialty+'|'+t.name;
  for(const [k,files] of Object.entries(DRIVE_TOPIC_EXTRA||{})){
    const p=k.indexOf('|');
    if(k.slice(0,p)!==specialty||incNorm(k.slice(p+1))!==incNorm(t.name))continue;
    for(const [provider,list] of Object.entries(files))
      for(const item of list||[]){const [id,name]=item;
        if(driveFileUrl(id))found.push({provider,id,name,origin:'verificado'});
      }
  }
  for(const [provider,field] of [['medway','linkMedway'],['estrategia','linkEstrategia'],['medcof','linkMedcof']]){
    const url=String(t[field]||'').trim();
    const m=url.match(/(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([A-Za-z0-9_-]{12,128})/);
    if(m&&driveFileUrl(m[1]))found.push({provider,id:m[1],name:t.name+' — PDF adicionado manualmente',origin:'manual'});
  }
  const seen=new Set();
  return found.filter(f=>{if(seen.has(f.id))return false;seen.add(f.id);return true;})
    .sort((a,b)=>DRIVE_PROVIDERS.findIndex(x=>x[0]===a.provider)-DRIVE_PROVIDERS.findIndex(x=>x[0]===b.provider));
}
function showDriveFiles(tId){
  const t=th(tId);if(!t)return;
  const files=driveFilesFor(t);
  if(files.length===1){window.open(driveFileUrl(files[0].id),'_blank','noopener,noreferrer');return;}
  const d=document.createElement('dialog');d.className='drive-dialog';
  const lists=DRIVE_PROVIDERS.map(([provider,label])=>{
    const group=files.filter(f=>f.provider===provider);
    if(!group.length)return '';
    return `<div class="drive-source"><b>${e(label)} <small>(${group.length} ${group.length===1?'PDF':'PDFs'})</small></b>`+
      group.map(f=>`<a class="drive-file" target="_blank" rel="noopener noreferrer" href="${driveFileUrl(f.id)}"><span class="gr">${e(f.name)}</span><span aria-hidden="true">↗</span></a>`).join('')+'</div>';
  }).join('');
  d.innerHTML=`<div class="row"><h3 class="gr">Ver no Drive</h3><button class="b2" id="drive-close">Fechar</button></div><p class="mu">${e(t.name)}</p>`+
    (lists||`<p>Não há link direto para um PDF deste assunto cadastrado nesta versão. Você pode adicionar os links pelo botão <b>Editar</b> na Biblioteca.</p>`);
  document.body.append(d);d.showModal();
  d.querySelector('#drive-close').onclick=()=>d.close();
  d.addEventListener('close',()=>d.remove());
}
const driveButton=t=>`<button class="b2" onclick="showDriveFiles('${t.id}')" title="Abrir PDFs do assunto no Google Drive">Ver no Drive</button>`;

function libDet(t){const f=freq(t),cs=S.cons.filter(c=>(c.themes||[]).includes(t.id)),B=[['Resumo',t.desc],['Fisiopatologia',t.fisio],['Classificação',t.classif],['Diagnóstico',t.dx],['Diagnósticos diferenciais',t.ddx],['Exames complementares',t.exams],['Tratamento e conduta',t.tx],['Complicações',t.compl],['Particularidades para provas',t.tips],['Outros subtópicos',t.outros]].filter(x=>x[1]);return `<div class="row"><button class="b2" onclick="OT='';go()">← Biblioteca</button><h1 class="gr">${e(t.name)}</h1>${driveButton(t)}<button class="b2" onclick="edTheme('${t.id}')">Editar</button><button class="b2" onclick="del('themes','${t.id}')">Excluir</button></div><div class="card"><div class="row"><span class="gr">${e(t.area)} › ${e(t.esp||'—')}</span><select onchange="setTh('${t.id}',this.value)">${O(['Não estudado','Em estudo','Estudado','Revisado'],t.st||'Não estudado')}</select></div>${f?`<p>${pb(t)} <small>${f.p.toFixed(2).replace('.',',')}% dos itens de ${e(f.esp)} no Guia Estatístico (percentual dentro da especialidade; base: Revalida INEP 2011–2025 + ENAMED/ENARE 2025/26). Frequência histórica, não garantia de cobrança.</small></p>`:''}${t.src?`<small>Fonte: ${e(t.src)}</small>`:''}${t.mat?`<br><small>Materiais nas suas pastas: ${t.mat.split('').map(c=>({E:'Estratégia',M:'Medcof',W:'Medway'}[c])).join(', ')}</small>`:''}</div>`+(B.length?B.map(x=>`<div class="card"><small>${x[0]}</small><br>${e(x[1])}</div>`).join(''):'')+`<button class="b2" onclick="QF={theme:'${t.id}'};to('questoes','questoes','q')">Questões deste assunto (${S.qs.filter(q=>q.theme==t.id).length})</button>`}

// Registros externos: anota somente os totais, sem exigir o enunciado de cada questão.
function logQuestions(id=null,presetCon=''){
  const old=id?(S.qsessions||[]).find(x=>x.id===id):null;
  const preset=con(presetCon||old?.con),ss=old?.sub||preset?.sub||S.subs[0]?.id||'';
  const d=document.createElement('dialog');d.className='question-log-dialog';
  const subjectOptions=()=>O(S.subs.map(x=>[x.id,x.name]),ss);
  d.innerHTML=`<h3>${old?'Editar registro':'Lançar questões feitas'}</h3><p class="mu" style="margin:6px 0 12px">Registre questões feitas fora do MedPath. Os erros, a prioridade e o intervalo de revisão são calculados automaticamente.</p>
  <div class="q-log-fields"><label>Matéria <select id="ql_sub">${subjectOptions()}</select></label><label>Conteúdo <select id="ql_con"></select></label>
  <label>Quantidade de questões <input id="ql_total" type="number" min="1" step="1" value="${old?old.total:10}"></label><label>Quantidade de acertos <input id="ql_correct" type="number" min="0" step="1" value="${old?old.correct:0}"></label>
  <label>Data da atividade <input id="ql_date" type="date" value="${e(old?.date||D())}"></label><label>Origem (opcional) <input id="ql_source" value="${e(old?.source||'')}" placeholder="Ex.: questões de apostila, simulado"></label></div>
  <div class="q-score" id="ql_preview"></div><p class="err" id="ql_error"></p>
  <div class="row"><button class="b2" id="ql_cancel">Cancelar</button><button class="b" id="ql_save">${old?'Salvar alterações':'Registrar resultado'}</button></div>`;
  document.body.append(d);d.showModal();
  const get=k=>d.querySelector('#ql_'+k),select=get('con');
  const refreshContents=()=>{
    const prior=select.value||old?.con||preset?.id||'';
    const items=S.cons.filter(c=>c.sub===get('sub').value);
    select.innerHTML=O(items.map(x=>[x.id,x.name]),prior);
    if(items.some(x=>x.id===prior))select.value=prior;
    select.disabled=!items.length;
    validate();
  };
  const validate=()=>{
    const total=Number(get('total').value),correct=Number(get('correct').value),err=total-correct;
    const valid=!!select.value&&Number.isSafeInteger(total)&&total>0&&Number.isSafeInteger(correct)&&correct>=0&&correct<=total&&calendarValidDate(get('date').value);
    get('save').disabled=!valid;
    get('preview').innerHTML=valid?`<strong>${correct} acertos</strong><span>·</span><strong>${err} erros</strong><span>·</span><strong>${Math.round(correct/total*100)}% de acertos</strong>`:'<span class="mu">Escolha um conteúdo, uma data e números válidos. Acertos não podem superar o total.</span>';
    return valid;
  };
  get('sub').addEventListener('change',()=>{select.value='';refreshContents()});
  ['total','correct','date','con'].forEach(k=>get(k).addEventListener('input',validate));
  get('cancel').onclick=()=>d.remove();
  get('save').onclick=()=>{
    if(!validate())return;
    const c=con(select.value),date=get('date').value;
    const entry={id:old?.id||U(),sub:get('sub').value,con:c.id,total:Number(get('total').value),correct:Number(get('correct').value),date,source:get('source').value.trim()};
    const previous=old&&old.con!==entry.con?con(old.con):null;if(old)Object.assign(old,entry);else S.qsessions.push(entry);
    // Registrar questões conta como início de estudo para conteúdo ainda não iniciado.
    if(!studied(c)){c.status='Em andamento';c.started=date;c.studied=date}
    if(!calendarValidDate(c.started))c.started=date;
    // Recalcular o intervalo com todos os acertos/erros disponíveis para o assunto.
    const interval=scorePlan(c).days;c.int=interval;
    // Mantém a próxima revisão vinculada à data do último exercício, sem retroceder o relógio.
    const latest=(S.qsessions||[]).filter(x=>x.con===c.id).reduce((v,x)=>x.date>v?x.date:v,'');
    c.next=add(latest||date,interval);
    if(previous&&studied(previous)){const oldScore=scorePlan(previous),oldLatest=(S.qsessions||[]).filter(x=>x.con===previous.id).reduce((v,x)=>x.date>v?x.date:v,'');previous.int=oldScore.days;previous.next=oldLatest?add(oldLatest,oldScore.days):previous.last?add(previous.last,oldScore.days):add(previous.started,1)}
    S.hist.push({d:D(),con:c.id,ev:`Questões registradas: ${entry.correct}/${entry.total} (${Math.round(entry.correct/entry.total*100)}%)`});
    d.remove();save();go();
  };
  refreshContents();
}
function deleteLog(id){C('Excluir este registro de questões?',()=>{
  const x=(S.qsessions||[]).find(y=>y.id===id),c=x&&con(x.con);
  S.qsessions=(S.qsessions||[]).filter(y=>y.id!==id);
  if(c&&studied(c)){
    const z=scorePlan(c);c.int=z.days;
    const last=(S.qsessions||[]).filter(y=>y.con===c.id).reduce((v,y)=>y.date>v?y.date:v,'');
    c.next=last?add(last,z.days):c.last?add(c.last,z.days):add(c.started,1);
  }
  save();go();
})}
function externalRecords(){
  const logs=[...(S.qsessions||[])].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const stats=S.cons.map(c=>({c,z:scorePlan(c)})).filter(x=>x.z.a.n>0).sort((a,b)=>a.z.days-b.z.days||a.z.a.p-b.z.a.p);
  const sum=logs.reduce((o,x)=>{o.n+=Number(x.total)||0;o.ok+=Number(x.correct)||0;return o},{n:0,ok:0});
  return `<div class="row" style="margin-bottom:12px"><h1 class="gr" style="margin:0">Questões feitas</h1><button class="b" onclick="logQuestions()">+ Lançar resultado</button></div>
  <div class="grid"><div class="card"><small>Questões registradas</small><div class="big">${sum.n}</div></div><div class="card"><small>Acertos</small><div class="big">${sum.ok}</div></div><div class="card"><small>Erros</small><div class="big">${sum.n-sum.ok}</div></div><div class="card"><small>Aproveitamento</small><div class="big">${sum.n?Math.round(sum.ok/sum.n*100)+'%':'—'}</div></div></div>
  <div class="card"><h3>Prioridade de revisão por conteúdo</h3><small>A classificação usa as questões feitas fora e dentro do site. Quanto menor o aproveitamento, menor o intervalo recomendado.</small>
  ${stats.length?stats.map(({c,z})=>`<div class="row q-log-row"><div class="gr"><b>${e(c.name)}</b> <small>· ${e(sub(c.sub)?.name)}</small><br>${scoreText(c)}</div><button class="b2" onclick="logQuestions(null,'${c.id}')">+ Resultado</button></div>`).join(''):'<div class="q-empty">Os assuntos aparecerão aqui após o primeiro registro.</div>'}</div>
  <div class="card"><h3>Registros anteriores</h3>${logs.length?logs.map(x=>{const c=con(x.con);return `<div class="row q-log-row"><span class="gr"><b>${e(c?.name||'Conteúdo removido')}</b><br><small>${e(sub(x.sub)?.name||'')} · ${fmt(x.date)} ${x.source?' · '+e(x.source):''}</small><br><small>${x.total} questões · ${x.correct} acertos · ${x.total-x.correct} erros · ${Math.round(x.correct/x.total*100)}%</small></span><div class="q-log-actions"><button class="b2" onclick="logQuestions('${x.id}')">Editar</button><button class="b2" onclick="deleteLog('${x.id}')">Excluir</button></div></div>`}).join(''):'<div class="q-empty">Nenhum registro externo ainda. Lance o resultado de um bloco de questões, simulado ou lista de exercícios.</div>'}</div>`;
}

V.bancoQuestoes=V.questoes;
V.residencia=()=>V.lib();
V.questoes=()=>sec('questoes',[
  ['registro','Questões feitas'],
  ['r','Revisões'],
  ['q','Banco ('+S.qs.length+')'],
  ['x','Caderno de erros'],
  ['h','Histórico ('+S.ans.length+')']
],{registro:externalRecords,r:V.revisoes,q:V.bancoQuestoes,x:V.erros,h:V.histq});
V.cronograma=()=>CR();
V.desempenho=V.estatisticas;
function ap(){if(S.cfg.theme)document.documentElement.dataset.theme=S.cfg.theme;else document.documentElement.removeAttribute('data-theme')}
function go(){migrateProgress();repairReviews();cleanAutoText();let k=location.hash.slice(1);if(!NAV.some(x=>x[0]==k))k='inicio';$('#n').innerHTML='<b>MedPath</b>'+NAV.map(([v,l])=>`<a href="#${v}" class="${v==k?'on':''}" onclick="BK=null;RS=''">${l}</a>`).join('');$('#m').innerHTML=bk()+V[k]();if(RS){const x=$('#t_'+RS);if(x)x.scrollIntoView();RS=''}}
const OPEN={},TG=(i,o)=>{OPEN[i]=o};
const CI=`filtracao glomerular|taxa de filtracao|ritmo de filtracao|clearance@lesao renal aguda,doenca renal cronica,glomerulopatias
reabsorcao|secrecao tubular|funcao tubular|tubulo|nefron|concentracao e diluicao|diluicao urinaria@lesao renal aguda,doenca renal cronica,equilibrio acidobasico
hidroeletrol|sodio|potassio|volume extracelular|osmolalidade|balanco hidrico@equilibrio acidobasico,lesao renal aguda,doenca renal cronica
acido base|acidobasic|ph sanguineo|tampao|bicarbonato@equilibrio acidobasico
glomerul|sindrome nefrit|sindrome nefrot|proteinuria@glomerulopatias
pressao arterial|debito cardiaco|resistencia vascular|hemodinam|renina|angiotensina|barorreceptor@hipertensao arterial,insuficiencia cardiaca
ciclo cardiaco|valva|sopro|bulhas@valvopatias,insuficiencia cardiaca
coronari|aterosclero|infarto|lipoproteina|colesterol@aterosclerose
potencial de acao cardiaco|eletrocardiograma|(^| )ecg|automatismo|conducao cardiaca|no sinusal@arritmias cardiacas
contratilidade|pre carga|pos carga|frank starling|disfuncao ventricular@insuficiencia cardiaca
ventilacao|mecanica ventilatoria|complacencia|espirometria|volumes pulmonares@asma,dpoc
troca gasosa|difusao de gases|hipoxemia|transporte de oxigenio@dpoc
pleura@derrame pleural
insulina|glicose|glicem|carboidrato|gliconeogenese|glicolise|pancreas endocrino@diabetes
tireoid|(^| )tsh@tireoide
adrenal|suprarrenal|cortisol|aldosterona@adrenal,hipertensao arterial
paratireoide|calcio|fosforo|vitamina d|remodelamento osseo@metabolismo osseo
obesidade|leptina|tecido adiposo|balanco energetico@obesidade
hemostasia|coagulacao|plaqueta|fibrinolise@hemostasia
leucocito|linfocito|linfonodo|sistema linfatico@linfomas,leucemias
hematopoese|medula ossea|leucemia@leucemias
imunologia|resposta imune|autoimun|anticorpo|hipersensibilidade|complemento@doencas autoimunes,artropatias inflamatorias,vasculites
micobacteri|bacilo de koch|granuloma@tuberculose
arbovirus|flavivirus|dengue|zika|chikungunya|febre amarela|aedes@arboviroses
retrovirus|(^| )hiv@hiv
meningite|encefalite|liquor@infeccoes do sistema nervoso central
circulacao cerebral|vascularizacao encefalica|poligono de willis|irrigacao cerebral@acidentes vasculares cerebrais,coma e alteracoes
nucleos da base|via extrapiramidal|dopamina@disturbios do movimento
formacao reticular|nivel de consciencia|sono e vigilia@coma e alteracoes
digestao|motilidade gastrica|secrecao gastrica|estomago@estomago,hemorragia digestiva,neoplasias do sistema digestivo
intestino|absorcao intestinal|(^| )colon( |$)@intestinos,neoplasias do sistema digestivo
figado|hepatic|bilirrubina|metabolismo hepatico@hepatites virais,cirrose,outras hepatopatias
(^| )pele|epiderme|(^| )derme|tegumento@anatomia e fisiologia da pele,cancer de pele
ciclo menstrual|eixo hipotalamo hipofise gonadal|esteroides sexuais|menopausa|(^| )ovario@ginecologia endocrina
placenta|embriologia|gestacao|gravidez|adaptacao materna@doencas associadas a gestacao,pre natal,medicina fetal,intercorrencias obstetricas
(^| )mama|lactacao@mastologia
(^| )utero|colo uterino|endometrio|(^| )vagina|vulva@oncologia ginecologica,ginecologia geral,infeccoes em ginecologia
crescimento e desenvolvimento|recem nascido|neonato@puericultura,neonatologia
vacina|imunizacao@puericultura,epidemiologia
epidemiologia|bioestatistica|indicador|vigilancia|saude publica|saude coletiva@epidemiologia,sistema unico de saude
atencao primaria|saude da familia@medicina de familia,sistema unico de saude
(^| )etica|bioetica|sigilo@etica medica
saude do trabalhador|ocupacional@saude do trabalhador
psicofarmaco|antidepressivo|antipsicotico|benzodiazepin|neurotransmissor@psicofarmacologia,transtornos de humor
depressao|bipolar|serotonina|(^| )humor( |$)@transtornos de humor
alcool|opioide|cocaina|dependencia quimica@dependencia quimica,intoxicacoes exogenas
intoxicacao|toxicologia|antidoto@intoxicacoes exogenas
politrauma|atls|choque hemorragico@trauma
abdome agudo|parede abdominal|apendic|peritonio@urgencias abdominais
osteologia|fratura|musculo esqueletico|articulacao|coluna vertebral@ortopedia geral,trauma ortopedico
retina|cornea|(^| )ocular|(^| )visao@olho vermelho,traumatismos oculares,glaucoma,optica
laringe|faringe|ouvido|nariz@infeccoes das vias aereas superiores
bexiga|ureter|trato urinario|uretra|prostata@infeccao do trato urinario,urologia
diuretico|(^| )ieca|betabloqueador|anti hipertensivo@hipertensao arterial,insuficiencia cardiaca
anticoagulante|heparina|varfarina|antiagregante@hemostasia,arritmias cardiacas
inflamacao|anti inflamatorio|(^| )aine|corticoide@artropatias inflamatorias,doencas autoimunes,asma
dislipidemia|lipidio@aterosclerose,obesidade`.split('\n').map(l=>{const[a,b]=l.split('@');return[new RegExp(a),b.split(',')]});
// O guia estatístico pode não conter tópicos para todas as especialidades.
// Não inventar frequências: ignorar entradas ausentes e preservar os dados existentes.
let WL=null;
const wl=()=>WL||(WL=(Array.isArray(GE)?GE:[]).flatMap(x=>
  (Array.isArray(GT?.[x[0]])?GT[x[0]]:[]).map(([t,q])=>({
    esp:x[0],tm:t,n:nm(t),w:(Number(x[2])||0)*(Number(q)||0)/100
  }))
));
const WM=()=>Math.max(0,...wl().map(x=>x.w));
const sc=w=>w>0?Math.max(1,Math.min(10,Math.round(10*Math.sqrt(w/WM())))):0;

/* MedPath: associação automática de conteúdos às especialidades e temas do Guia Estatístico.
   Os assuntos (A) do catálogo do guia são apenas marcados como destaque; não possuem % individual. */
let INC_ALIASES = null;
// Os aliases privados são carregados somente após a autenticação pelo Firestore.
let INC_SUBJECTS = null;
// Normalização tolerante a acentos, grafias alternativas e flexões comuns.
// As palavras compostas continuam sendo avaliadas no contexto da disciplina.
let INC_REPLACE = null;
const INC_STOP=new Set(['de','da','do','dos','das','em','na','no','nas','nos','e','para','com','por','um','uma','ao','aos','as','os','à','o','a']);
const incNorm=s=>nm(s).replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')
  .split(' ').map(w=>(INC_REPLACE||{})[w]||w).join(' ');
const incHas=(hay,needle)=>!!needle&&(' '+hay+' ').includes(' '+needle+' ');
const incStem=w=>{
  if(w.endsWith('oes')&&w.length>=7)return w.slice(0,-3)+'ao';
  if(w.endsWith('s')&&w.length>=6&&!w.endsWith('us'))return w.slice(0,-1);
  return w;
};
const incWords=t=>incNorm(t).split(' ').filter(w=>w&&!INC_STOP.has(w)).map(incStem);
// Distância de edição Damerau-Levenshtein: aceita letras omitidas, inseridas,
// trocadas e também inversões vizinhas (ex.: 'adbome' -> 'abdome').
function incEditDist(a,b){
  const m=a.length,n=b.length,d=Array.from({length:m+1},()=>new Array(n+1));
  for(let i=0;i<=m;i++)d[i][0]=i;
  for(let j=0;j<=n;j++)d[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])
      d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
  }
  return d[m][n];
}
function incWordSimilarity(a,b,hasAnchor=false,multiWord=false){
  if(a===b)return {ok:true,d:0};
  const min=Math.min(a.length,b.length),diff=Math.abs(a.length-b.length);
  // Não fazer aproximações para siglas e palavras curtas como HAS, HIV e asma.
  const limit=min>=9?2:(hasAnchor&&min>=6?2:1);
  if(min<5&&!(multiWord&&min>=4))return {ok:false,d:99};
  if(diff>limit)return {ok:false,d:99};
  const dist=incEditDist(a,b);
  return {ok:dist<=limit,d:dist};
}
function incMatchDetail(input,alias){
  const a=incNorm(alias),n=incNorm(input);
  if(!a||!n||n.length<2||a.length<2)return {score:0,kind:'',alias};
  if(a===n)return {score:250+Math.min(a.length,45),kind:'nome exato',alias};
  if(incHas(n,a))return {score:210+Math.min(a.length,45),kind:'termo presente no nome',alias};
  if(n.length>=9&&incHas(a,n))return {score:170+Math.min(n.length,25),kind:'tema mais amplo',alias};
  const aw=incWords(a),nw=incWords(n);
  if(!aw.length||!nw.length)return {score:0,kind:'',alias};
  // Preservar o reconhecimento por palavras-chave exatas sem preposições.
  if(nw.length>=2&&nw.length<=aw.length&&nw.every(w=>aw.includes(w)))
    return {score:163+Math.min(nw.join('').length,25),kind:'palavras equivalentes',alias};
  // Para reconhecer uma frase, todos os termos importantes do alias precisam
  // estar representados na entrada; isso reduz aproximações equivocadas.
  if(aw.length>nw.length || nw.length>aw.length+6)return {score:0,kind:'',alias};
  const hasAnchor=aw.some(w=>nw.includes(w));
  const used=new Set();let total=0,fuzzy=0;
  for(const target of aw){
    let bestIdx=-1,bestDist=99;
    nw.forEach((word,i)=>{
      if(used.has(i))return;
      const r=incWordSimilarity(target,word,hasAnchor,aw.length>1&&nw.length>1);
      if(r.ok&&r.d<bestDist){bestIdx=i;bestDist=r.d}
    });
    if(bestIdx<0)return {score:0,kind:'',alias};
    used.add(bestIdx);total+=bestDist;if(bestDist)fuzzy++;
  }
  if(!fuzzy)return {score:155+Math.min(aw.join('').length,25),kind:'palavras equivalentes',alias};
  // A aproximação é intencionalmente mais fraca que uma correspondência exata.
  // Para entradas longas, exige que ao menos metade dos termos sejam idênticos.
  if(aw.length>=3&&fuzzy>Math.ceil(aw.length/2))return {score:0,kind:'',alias};
  return {score:146-total*10-Math.max(0,nw.length-aw.length)*4,
    kind:'grafia aproximada',alias};
}
const incMatchScore=(input,alias)=>incMatchDetail(input,alias).score;
const incSubject=(name)=>{
  const n=incNorm(name),found=[];
  // Ginecologia e Obstetrícia: preservar as duas áreas, sem restringir à primeira.
  for(const [area, aliases] of Object.entries(INC_SUBJECTS||{}))
    if(aliases.some(a=>incHas(n,incNorm(a)) || (incNorm(a).length>=6&&n.includes(incNorm(a))))) found.push(area);
  // Quando o usuário cadastra "Clínica Médica", "SP", "Morfofuncional", etc.,
  // o assunto pode pertencer a várias especialidades: não impor uma classificação arbitrária.
  return [...new Set(found)];
};
let INC_TOP=null;
function incTop(){
  if(INC_TOP)return INC_TOP;
  INC_TOP=[];
  for(const block of LIST.split('#').slice(1)){
    const lines=block.split('\n'),esp=lines[0].trim();
    for(const line of lines.slice(1))if(line.startsWith('A '))
      line.slice(2).split('|').forEach((raw,i)=>{
        const name=raw.split('~')[0].trim();
        if(name)INC_TOP.push({esp,name,rank:i+1});
      });
  }
  return INC_TOP;
}
function incTopMatches(name,accepted){
  return incTop().filter(x=>accepted.includes(x.esp))
    .map(x=>({...x,score:incMatchScore(name,x.name)}))
    .filter(x=>x.score>=90)
    .sort((a,b)=>b.score-a.score).slice(0,3);
}
function incCandidates(name,areas){
  const found=[];
  for(const [key,aliases] of Object.entries(INC_ALIASES||{})){
    const [esp,tm]=key.split('|');
    if(areas.length&&!areas.includes(esp))continue;
    // O catálogo pode usar maiúsculas/acentos diferentes nos nomes dos temas.
    // Localizar pelo nome normalizado e preservar os nomes canônicos de GT.
    const realEsp=Object.keys(GT).find(k=>incNorm(k)===incNorm(esp));
    if(!realEsp)continue;
    const row=(GT[realEsp]||[]).find(t=>incNorm(t[0])===incNorm(tm));
    if(!row)continue;
    let best=incMatchDetail(name,row[0]);
    for(const alias of aliases){
      const candidate=incMatchDetail(name,alias);
      if(candidate.score>best.score)best=candidate;
    }
    if(best.score>=110)found.push({esp:realEsp,tm:row[0],p:+row[1],score:best.score,
      matchType:best.kind,matchedAlias:best.alias});
  }
  return found.sort((a,b)=>b.score-a.score||b.p-a.p);
}
function setIncMatch(id,value){const c=con(id);if(!c)return;c.incMatch=value;save();go()}
function incLevel(p){return p>=20?'Muito prevalente':p>=10?'Prevalente':'Menor prevalência'}
// O diagnóstico digitado sempre é procurado em TODO o Guia Estatístico.
// A disciplina só desempata associações de qualidade equivalente.
function incChooseMatches(name,subjectAreas){
  const candidates=incCandidates(name,[]);
  if(!candidates.length)return [];
  const best=candidates[0].score;
  // Evita que uma palavra solta em um tema não relacionado esconda uma
  // correspondência mais completa e inequívoca em outra especialidade.
  const close=candidates.filter(x=>x.score>=Math.max(110,best-8));
  const local=close.filter(x=>subjectAreas.includes(x.esp));
  let winner=local[0];
  if(!winner){
    // Em disciplinas amplas ou sem correspondência, termos como 'asma'
    // referem-se à especialidade geral, salvo contexto explícito pediátrico.
    const normalized=incNorm(name);
    winner=(normalized==='asma'&&close.find(x=>x.esp==='Pneumologia'))||close[0];
  }
  // Não somar percentuais de especialidades distintas: cada assunto recebe
  // somente a associação mais específica/confiante. A escolha manual permite
  // definir outro tema quando o nome do conteúdo é ambíguo.
  return [winner];
}
function rel(c){
  const subject=sub(c.sub),name=(c.name||'').trim();
  const subjectAreas=incSubject(subject?.name||'');
  const explicit=c.incMatch||'';
  let matches=[];
  if(explicit==='__none__')return {s:null,ctx:false,temas:[],topAss:[],note:'Associação desativada manualmente.'};
  if(explicit.includes('|')){
    const [esp,tm]=explicit.split('|');
    const row=(GT[esp]||[]).find(x=>x[0]===tm);
    if(row)matches=[{esp,tm,p:+row[1],score:999,matchType:'associação escolhida por você'}];
  }
  if(!matches.length)matches=incChooseMatches(name,subjectAreas);
  const gids=new Set(matches.map(x=>x.esp+'|'+x.tm));
  const temas=wl().filter(x=>gids.has(x.esp+'|'+x.tm))
    .map(x=>({...x,sc:sc(x.w),lv:incLevel(+((GT[x.esp]||[]).find(y=>y[0]===x.tm)?.[1]||0)),p:+((GT[x.esp]||[]).find(y=>y[0]===x.tm)?.[1]||0),
      t:S.themes.find(t=>{const f=freq(t);return f&&f.tm===x.tm&&f.esp===x.esp}),
      source:matches.find(y=>y.esp===x.esp&&y.tm===x.tm)?.matchType,
      matchedAlias:matches.find(y=>y.esp===x.esp&&y.tm===x.tm)?.matchedAlias}))
    .sort((a,b)=>b.w-a.w);
  const tot=temas.reduce((a,x)=>a+x.w,0);
  // Se o termo não estiver entre os temas com percentual, procurar destaques
  // do guia em todas as especialidades, também sem filtrá-los pela faculdade.
  const topAss=temas.length?[]:incTopMatches(name,Object.keys(GT))
    .sort((a,b)=>b.score-a.score||(+subjectAreas.includes(b.esp))-(+subjectAreas.includes(a.esp)))
    .slice(0,1);
  const note=temas.length?`${temas[0].esp} · ${temas[0].tm}`:topAss.length?
    `${topAss[0].esp} · assunto destacado no guia, sem percentual próprio`:
    'Sem incidência específica identificável no Guia Estatístico para este conteúdo.';
  return {s:temas.length?sc(tot):null,ctx:false,temas,topAss,note};
}
function incPreview(name,subId,incMatch){
  if(!name.trim())return '';
  const r=rel({name,sub:subId,incMatch});
  const t=r.temas[0];
  if(t)return `<b>${e(t.lv)}</b> · ${e(t.esp)} → ${e(t.tm)} (${t.p.toFixed(2).replace('.',',')}% dentro da especialidade) · relevância geral ${r.s}/10${t.source==='grafia aproximada'?`<div class="inc-approx">Grafia reconhecida como: <b>${e(t.matchedAlias)}</b></div>`:''}`;
  return '';
}
function incOptions(c){
  // A associação manual também pode selecionar temas de OUTRAS especialidades.
  // Não limitar esse menu ao nome da disciplina da faculdade.
  const options=[['','Automático (pelo nome do assunto)'],['__none__','Não associar']];
  const current=rel({...c,incMatch:''}).temas[0];
  if(current)options.push([current.esp+'|'+current.tm,'Sugestão: '+current.esp+' · '+current.tm]);
  for(const esp of Object.keys(GT))for(const [tm,p] of GT[esp]||[]){
    if(current&&current.esp===esp&&current.tm===tm)continue;
    options.push([esp+'|'+tm,esp+' · '+tm+' ('+Number(p).toFixed(2).replace('.',',')+'%)']);
  }
  return options;
}

// Integração faculdade ↔ Biblioteca: independente das estatísticas do guia.
// Procura em S.themes, que é o catálogo efetivamente visível na aba Biblioteca.
const LIB_GENERIC=new Set(['cirurgia','clinica','medicina','geral','doenca','doencas','sindrome','agudo','cronico','tratamento','diagnostico','aula','revisao','introducao','fisiologia','anatomia','saude','infeccao','abordagem','patologia']);
const LIB_DETAILS=['desc','fisio','classif','dx','ddx','exams','tx','compl','tips','outros'];
const libHasText=t=>LIB_DETAILS.some(k=>!!(t[k]&&String(t[k]).trim()));
function libMatchScore(query,t,areaList){
  const q=incNorm(query), title=incNorm(t.name), qw=incWords(query),tw=incWords(t.name);
  if(!q||!title||!qw.length||q.length<3)return 0;
  const exact=q===title || (qw.length===tw.length&&qw.every(w=>tw.includes(w)));
  let score=incMatchDetail(query,t.name).score;
  if(exact)score=Math.max(score,280);
  // Aceitar um único assunto significativo também quando o título é mais detalhado:
  // "Hérnias" -> "Hérnias da parede abdominal", "Hérnia inguinal", etc.
  // Mas não aceitar palavras genéricas como "cirurgia" ou "tratamento" isoladas.
  if(qw.length===1 && !LIB_GENERIC.has(qw[0]) && qw[0].length>=4){
    const same=tw.some(w=>w===qw[0]);
    const almost=tw.some(w=>incWordSimilarity(qw[0],w,false,false).ok);
    if(same)score=Math.max(score,166);
    else if(almost)score=Math.max(score,140);
  }
  if(qw.length>=2){
    const used=new Set(),dists=[];
    for(const w of qw){
      let best=-1,dist=99;
      tw.forEach((v,i)=>{if(used.has(i))return;let d=w===v?0:incEditDist(w,v);
        const limit=Math.min(w.length,v.length)>=9?2:1;
        if(d<=limit && d<dist){dist=d;best=i;}
      });
      if(best<0){dists.length=0;break;}
      used.add(best);dists.push(dist);
    }
    if(dists.length===qw.length){
      const n=dists.reduce((a,b)=>a+b,0);
      score=Math.max(score,185-Math.min(4,tw.length-qw.length)*3-n*12);
    }
  }
  // Não gerar resultados a partir de um único termo genérico em títulos longos.
  if(qw.length===1 && LIB_GENERIC.has(qw[0]) && !exact)return 0;
  // Um termo amplo deve priorizar a página-síntese em vez de subtipos individuais.
  // "Hérnias" -> "Hérnias da parede abdominal" antes de "Hérnia femoral".
  if(incNorm(t.name).startsWith(q+' ') && q.length>=6)score+=18;
  // "Abdome agudo" -> página de classificação/abordagem antes dos tipos.
  if(incNorm(t.name).startsWith(q+' classificacao') || incNorm(t.name).startsWith(q+' abordagem'))score+=15;
  if(q==='hernias' && incNorm(t.name)==='hernias da parede abdominal')score+=9;
  if(score<137)return 0;
  // Matéria da faculdade é apenas desempate, nunca bloqueio de outra especialidade.
  if(areaList.includes(t.esp))score+=19;
  if(libHasText(t))score+=3;
  else if(t.mat)score+=2;
  // Correspondências mais completas antes de etiquetas longas com muitos subtemas.
  if(exact)score+=15;
  return score;
}
function libMatches(name,subName='',max=6){
  if(!String(name||'').trim())return [];
  const areaList=incSubject(subName||'');
  const hits=S.themes.map(t=>({t,score:libMatchScore(name,t,areaList)}))
    .filter(x=>x.score>0)
    .sort((a,b)=>b.score-a.score||(+libHasText(b.t))-(+libHasText(a.t))||a.t.name.length-b.t.name.length);
  // Conteúdos iguais em fontes diferentes são apresentados como um item da biblioteca.
  const seen=new Set(),out=[];
  for(const x of hits){const key=incNorm(x.t.name)+'|'+(x.t.esp||'');if(seen.has(key))continue;seen.add(key);out.push(x);if(out.length>=max)break;}
  return out;
}
function libForCon(c,max=6){
  const found=libMatches(c.name,sub(c.sub)?.name||'',max+4);
  const chosen=S.themes.find(t=>t.id===c.libMatch);
  const manual=(c.themes||[]).map(th).filter(Boolean);
  const combined=[...(chosen?[{t:chosen,score:999,manual:true}]:[]),...manual.map(t=>({t,score:990,manual:true})),...found];
  const seen=new Set();return combined.filter(x=>{if(seen.has(x.t.id))return false;seen.add(x.t.id);return true}).slice(0,max);
}
function libStatus(t){
  if(libHasText(t))return 'Texto disponível na Biblioteca';
  if(t.mat)return 'Aula catalogada: '+[...(t.mat||'')].map(c=>({E:'Estratégia',M:'Medcof',W:'Medway'}[c]||'')).filter(Boolean).join(', ');
  return 'Assunto catalogado; texto da aula ainda não importado';
}
function libPreviewHtml(name,sbId){
  if(!name.trim())return '';
  const n=libMatches(name,sub(sbId)?.name||'',1000).length;
  return `<b>Biblioteca:</b> ${n} ${n===1?'correspondência identificada':'correspondências identificadas'}.`;
}
function setLibMatch(cId,tId){const c=con(cId);if(!c)return;c.libMatch=tId;save();go();}
function chooseLib(cId){
  const c=con(cId);if(!c)return;
  const d=document.createElement('dialog');
  d.innerHTML=`<h3>Vincular à Biblioteca</h3><p class="mu">Procure um assunto existente na Biblioteca. A escolha não altera a incidência do Guia Estatístico.</p><input id="lib_search" placeholder="Buscar assunto, doença ou aula…" style="width:100%" value="${e(c.name)}"><div id="lib_results" class="lib-results"></div><div class="row"><button class="b2" id="lib_clear">Remover escolha manual</button><span class="gr"></span><button class="b" id="lib_close">Fechar</button></div>`;
  document.body.append(d);d.showModal();
  const field=d.querySelector('#lib_search'),results=d.querySelector('#lib_results');
  const show=()=>{
    const arr=libMatches(field.value,sub(c.sub)?.name||'',20);
    results.replaceChildren();
    if(!arr.length){const p=document.createElement('p');p.className='mu';p.textContent='Nenhum assunto encontrado nessa pesquisa.';results.append(p);return;}
    arr.forEach(x=>{
      const b=document.createElement('button');b.className='lib-search-option';b.type='button';
      const title=document.createElement('b');title.textContent=x.t.name;
      const detail=document.createElement('small');detail.textContent=(x.t.esp||'Sem especialidade')+' · '+libStatus(x.t);
      b.append(title,detail);
      b.onclick=()=>{setLibMatch(cId,x.t.id);d.remove();};results.append(b);
    });
  };
  field.addEventListener('input',show);show();
  d.querySelector('#lib_clear').onclick=()=>{setLibMatch(cId,'');d.remove()};
  d.querySelector('#lib_close').onclick=()=>d.remove();
}
function libPanel(c){
  const found=libForCon(c,6),n=found.length;
  if(!n)return `<div class="lib-panel"><div class="lib-heading"><b>Biblioteca de conteúdos</b><span class="lib-tag muted">Não identificado</span></div><small class="mu">Nenhum assunto correspondente foi encontrado automaticamente na Biblioteca cadastrada. Isso não significa que o material não exista nas suas pastas.</small><div><button class="b2 lib-action" onclick="chooseLib('${c.id}')">Pesquisar na Biblioteca</button></div></div>`;
  const first=found[0],extras=found.slice(1);
  return `<div class="lib-panel"><div class="lib-heading"><b>Biblioteca de conteúdos</b><span class="lib-tag">${n>1?n+' assuntos relacionados':'Encontrado'}</span></div>
    <div class="lib-item"><div class="gr"><b>${e(first.t.name)}</b><small>${e(first.t.esp||'Sem especialidade')} · ${e(libStatus(first.t))}${first.manual?' · Vínculo escolhido por você':''}</small></div><button class="b2 lib-action" onclick="openTh('${first.t.id}')">Ver na Biblioteca</button></div>
    ${extras.length?`<details class="lib-more"><summary>${extras.length} ${extras.length===1?'outro assunto relacionado':'outros assuntos relacionados'}</summary>${extras.map(x=>`<div class="lib-item"><div class="gr"><span>${e(x.t.name)}</span><small>${e(x.t.esp||'Sem especialidade')} · ${e(libStatus(x.t))}</small></div><button class="b2 lib-action" onclick="openTh('${x.t.id}')">Ver na Biblioteca</button></div>`).join('')}</details>`:''}
    <button class="x lib-pick" onclick="chooseLib('${c.id}')">Escolher outro assunto na Biblioteca</button></div>`;
}

const th10=s=>`<span class="th"${s==null?' title="Dados insuficientes no guia"':''}>${[...Array(10)].map((_,i)=>`<i${s!=null&&i<s?' class="on"':''}></i>`).join('')}</span><b${s==null?' class="mu"':''}>${s==null?'—':s}/10</b>`;
function crow(c){const r=rel(c),top=r.temas.slice(0,5),rf=top.find(x=>x.t),first=top[0],shown=r.s!=null;
const meta=first?`<span class="inc-pill ${first.p>=20?'inc-high':first.p>=10?'inc-medium':'inc-low'}">${e(first.lv)} · ${first.p.toFixed(2).replace('.',',')}% na especialidade</span>`:'';
const sourceSubject=sub(c.sub)?.name||"";
const diffSpec=first&&incSubject(sourceSubject).length&&!incSubject(sourceSubject).includes(first.esp);
const text=top.length?`<div class="inc-explanation"><b>Incidência identificada no Guia Estatístico</b><p>${e(r.note)} · ${first.p.toFixed(2).replace('.',',')}% das questões de <b>${e(first.esp)}</b> são deste tema. O indicador ${r.s}/10 também considera o peso da especialidade na prova.</p>${diffSpec?`<p class="mu">Conteúdo cadastrado em ${e(sourceSubject)}, mas classificado no guia em ${e(first.esp)}.</p>`:""}</div>`+
  top.map(x=>`<div class="row sb"><span class="gr">${e(x.esp)} → ${e(x.tm)}</span><small>${x.p.toFixed(2).replace('.',',')}% na especialidade · ${x.sc}/10 geral</small></div>`).join('')+
  (first.source==='grafia aproximada'?`<small class="mu">Correspondência aproximada com: <b>${e(first.matchedAlias)}</b>. Confira se a associação está correta.</small>`:'')+
  (rf?`<small><a href="#" onclick="openTh('${rf.t.id}');return false">Ver tema estatístico: ${e(rf.t.name)}</a></small>`:''):
  '';
return `<details class="cr"${OPEN[c.id]?' open':''} ontoggle="TG('${c.id}',this.open)"><summary><span class="gr">${e(c.name)}</span>${meta}${r.s==null?'':th10(r.s)}<span class="ar">⌄</span></summary><div class="ex">${text}${libPanel(c)}<div class="inc-adjust"><small>Associação ao guia (opcional — só altere se o automático não identificar corretamente)</small><select aria-label="Associação estatística" onchange="setIncMatch('${c.id}',this.value)">${O(incOptions(c),c.incMatch||'')}</select></div><div class="review-inline">${studied(c)?`<span>Iniciado em <b>${fmt(c.started)}</b> · próxima revisão <b>${fmt(c.next)}</b>${c.next<D()?' · atrasada':''}</span><button class="b2" onclick="logQuestions(null,'${c.id}')">+ Questões feitas</button><button class="b2" onclick="to('cronograma','cron','r')">Revisões</button><div style="width:100%">${scoreText(c)}</div>`:`<button class="b2" onclick="markStudied('${c.id}')">Iniciar estudo hoje</button>`}</div><div class="row mg"><select onchange="setSt('${c.id}',this.value)">${O(ST,c.status)}</select><small>${c.started?'início '+fmt(c.started):''}</small><span class="gr"></span><button class="x" title="Subir" onclick="mv('${c.id}',-1)">▲</button><button class="x" title="Descer" onclick="mv('${c.id}',1)">▼</button><button class="x" title="Editar" onclick="edCon('${c.id}')">✎</button><button class="x" title="Excluir" onclick="del('cons','${c.id}')">✕</button></div></div></details>`}

function openSub(id){BK=null;fsel=id;to('semestres','semestres','disc')}
V.faculdade=()=>{if(fsel&&sub(fsel)){const s=sub(fsel),cs=S.cons.filter(c=>c.sub==s.id),ids=cs.map(c=>c.id);return `<div class="row"><button class="b2" onclick="fsel='';go()">← Voltar</button><h1 class="gr">${e(s.name)}</h1><button class="b2" onclick="edSub('${s.id}')">Editar</button><button class="b2" onclick="del('subs','${s.id}')">Excluir</button></div><div class="card"><small>${s.sem}º semestre</small><p>${e(s.desc)||'<span class="mu">Sem descrição.</span>'}</p></div><div class="card"><div class="row"><h3 class="gr">Conteúdos</h3><button class="b" onclick="edCon(0,'${s.id}')">+ Conteúdo</button></div>${cs.length?cs.map(crow).join(''):'<p class="mu">Adicione os assuntos desta disciplina.</p>'}<details style="margin-top:12px"><summary class="mu">Como a pontuação é calculada</summary><small>O MedPath identifica automaticamente doenças, siglas e temas pelo nome do conteúdo em todo o guia, usando a disciplina somente para desempatar resultados ambíguos; aceita acentos, grafias alternativas e erros pequenos de digitação (incluindo inversão de letras). "Muito prevalente", "Prevalente" e "Menor prevalência" usam a porcentagem do tema DENTRO da própria especialidade (≥20%, 10–20% e abaixo de 10%). O indicador de 0 a 10 estima a relevância geral usando % da especialidade × % do tema no Guia Estatístico, não a incidência literal do assunto. Quando o Guia destaca um assunto sem percentual individual, exibimos "Destaque no guia", sem inventar um valor. A ausência de correspondência aparece como —, não significa baixa incidência. A identificação de materiais na Biblioteca funciona separadamente da incidência e pode encontrar aulas sem percentual. Você pode corrigir a associação manualmente na seta de cada conteúdo. Frequência histórica não garante cobrança futura.</small></details></div><div class="grid"><div class="card"><h3>Materiais</h3>${e(s.mat)||'<span class="mu">—</span>'}</div><div class="card"><h3>Anotações</h3>${e(s.notes)||'<span class="mu">—</span>'}</div><div class="card"><h3>Questões relacionadas</h3>${S.qs.filter(q=>ids.includes(q.con)).length}</div></div><div class="card"><h3>Histórico de aprendizagem</h3>${S.hist.filter(x=>ids.includes(x.con)).slice(-10).reverse().map(x=>`<small>${fmt(x.d)} · ${e(con(x.con)?.name)} — ${e(x.ev)}</small>`).join('<br>')||'<span class="mu">Sem registros.</span>'}</div>`}
return `<div class="row"><h1 class="gr">Disciplinas</h1><input placeholder="Buscar" oninput="flt(this,'.it')"><button class="b" onclick="edSub()">+ Disciplina</button></div>`+(S.subs.length?[...S.subs].sort((a,b)=>a.sem-b.sem).map(s=>{const cs=S.cons.filter(c=>c.sub==s.id);return `<div class="card it row" style="cursor:pointer" onclick="fsel='${s.id}';go()"><b class="gr">${e(s.name)}</b><small>${s.sem}º sem. · ${cs.filter(studied).length}/${cs.length} conteúdos</small></div>`}).join(''):emp('Nenhuma disciplina. Cadastre a primeira para começar.'))};
function rec(){const r=[],cur=+S.cfg.sem||0;S.cons.forEach(c=>{const a=acc(c);if(a.n>=5&&a.p<70)r.push({t:'Reforçar '+c.name,w:`Seu desempenho em ${c.name} está em ${a.p}% em ${a.n} questões.`,p:1})});
const dl=dueList();if(dl.length)r.push({t:`Fazer ${dl.length} revisão(ões) pendente(s)`,w:'Revisões espaçadas vencidas: '+dl.slice(0,3).map(c=>c.name).join(', ')+'.',p:2});
S.cons.filter(c=>sub(c.sub)?.sem==cur&&!finished(c)).map(c=>({c,x:rel(c)})).filter(o=>o.x.s>=7).sort((a,b)=>b.x.s-a.x.s).slice(0,2).forEach(o=>r.push({t:`Priorizar ${o.c.name} (${o.x.s}/10 em residência)`,w:'Relevância histórica alta no guia estatístico (não garante cobrança futura) e o conteúdo ainda não foi estudado.',p:3}));
const nx=S.cons.find(c=>c.status=='Não iniciado'&&sub(c.sub)?.sem==cur);if(nx)r.push({t:'Iniciar '+nx.name,w:'Está no seu semestre atual e ainda não foi iniciado.',p:5});return r.sort((a,b)=>a.p-b.p).slice(0,6)}
function gen(){
  const ws=wkS(),cur=+S.cfg.sem||0;
  const days=[0,1,2,3,4,5,6].map(i=>({d:add(ws,i),h:+S.cfg.hrs[(i+1)%7]||0})).filter(x=>x.h>0&&x.d>=D());
  // Preserve tarefas manuais, concluídas e tarefas fora desta semana.
  S.tasks=S.tasks.filter(t=>t.manual||t.done||t.date<ws||t.date>add(ws,6));
  const A=[],C=[],cs=S.cons.filter(c=>sub(c.sub)?.sem==cur&&!finished(c)).sort((a,b)=>(b.status=='Em andamento')-(a.status=='Em andamento')||(rel(b).s||0)-(rel(a).s||0));
  cs.forEach(c=>{const s=rel(c).s;A.push({p:'Faculdade',txt:`Estudar: ${sub(c.sub).name} — ${c.name}${s?` [${s}/10]`:''}`,con:c.id})});
  S.cons.filter(c=>studied(c)&&(sub(c.sub)?.sem==cur||dom(c)==4)).forEach(c=>{const t=rel(c).temas.find(y=>y.t);if(t)C.push({p:'Residência',txt:`Aprofundar na Biblioteca: ${t.t.name} [${t.sc}/10] (base: ${c.name})`,con:c.id,f:t.sc})});
  if(S.qs.length||S.errs.length)C.push({p:'Residência',txt:'Questões e revisão dos erros'});
  C.sort((a,b)=>(b.f||0)-(a.f||0));
  const load={};
  const reviews=mcAutoRevisions();
  days.forEach(x=>{
    // Cada revisão do dia reserva uma hora; tarefas existentes usam a própria duração.
    const taskHours=S.tasks.filter(t=>t.date===x.d&&mcVisibleTask(t)).reduce((a,t)=>a+Math.max(0,Number(t.h)||1),0);
    load[x.d]=taskHours+reviews.filter(r=>r.date===x.d).length;
  });
  const pools=[A,C];let k=0;
  let cap=days.reduce((s,x)=>s+Math.max(0,Math.floor(x.h-load[x.d])),0);
  while(cap-->0&&pools.some(p=>p.length)){
    let p=pools[k++%pools.length];while(!p.length)p=pools[k++%pools.length];
    const day=days.filter(x=>load[x.d]+1<=x.h).sort((a,b)=>load[a.d]/a.h-load[b.d]/b.h)[0];
    if(!day)break;
    const it=p.shift();load[day.d]++;
    S.tasks.push({id:U(),date:day.d,txt:it.txt,p:it.p,con:it.con,h:1,done:false});
  }
  save();go();
}
let LIST = null;
const mats=()=>LIST.split('#').slice(1).map(b=>b.split('\n')[0].trim());
const nm2=s=>nm(String(s).replace(/\s*\([^)]*\)\s*$/,''));
function mig4(){if(S.v4)return;const keep=new Set(),R={t:3,a:2,o:1},cnt=x=>x.dx||x.tx||x.desc||x.fisio||x.classif||x.exams||x.compl||x.tips||x.outros||x.ddx;
LIST.split('#').slice(1).forEach(b=>{const L=b.split('\n'),mt=L[0].trim();L.slice(1).forEach(l=>{const k=(l[0]||'').toLowerCase();if(!k||!'tao'.includes(k)||l[1]!=' ')return;l.slice(2).split('|').forEach(s=>{const[n0,sr]=s.split('~'),n=n0.trim();if(!n)return;
let t=S.themes.find(x=>x.esp==mt&&nm2(x.name)==nm2(n));
if(!t){t={id:U(),area:mt=='Radiologia'?'Radiologia':ar(mt),esp:mt,name:n,src:''};S.themes.push(t)}
keep.add(t.id);t.mat=[...new Set((t.mat||'').split('').concat((sr||'').split('')))].join('');
if(!t.kind||R[k]>R[t.kind])t.kind=k})})});
S.themes=S.themes.filter(t=>keep.has(t.id)||!t.mat||cnt(t)||S.qs.some(q=>q.theme==t.id));
S.v4=1;save()}
V.lib=()=>{if(OT&&th(OT))return libDet(th(OT));const q=nm(LQ),MO=mats(),L=S.themes.filter(t=>!q||nm([t.name,t.esp,t.area,t.desc,t.fisio,t.classif,t.dx,t.tx,t.tips].join(' ')).includes(q));
const row=t=>`<div class="row tk"><a class="gr" href="#" onclick="OT='${t.id}';go();return false">${e(t.name)}</a>${t.dx||t.tx||t.desc?'<small title="Conteúdo importado">●</small>':''}${pb(t)}<small title="W = Medway, M = Medcof, E = Estratégia">${(t.mat||'').split('').join(' · ')}</small></div>`,
sc2=(h,l,o)=>l.length?`<details style="margin:6px 0 0 14px"${q||o?' open':''}><summary class="mu">${h} <small>${l.length}</small></summary>${l.map(row).join('')}</details>`:'',
rows=AREAS.map(a=>{const ts=L.filter(t=>t.area==a);if(!ts.length)return '';const es=[...new Set(ts.map(t=>t.esp||'Sem matéria'))].sort((x,y)=>(MO.indexOf(x)+1||99)-(MO.indexOf(y)+1||99));
return `<details class="card"${q?' open':''}><summary><b>${a}</b> <small>${ts.length}</small></summary>${es.map(s=>{const l=ts.filter(t=>(t.esp||'Sem matéria')==s),by=f=>l.filter(t=>(t.kind||'a')==f);return `<details style="margin:8px 0 0 14px"${q?' open':''}><summary>${e(s)} <small>${l.length}</small></summary>${sc2('Temas',by('t').sort((x,y)=>(freq(y)?freq(y).p:0)-(freq(x)?freq(x).p:0)),1)}${sc2('Assuntos',by('a'),1)}${sc2('Outros conteúdos identificados nas aulas',by('o'),0)}</details>`}).join('')}</details>`}).join('');
return `<div class="row"><h1 class="gr">Biblioteca</h1><input id="lq" placeholder="Buscar matéria, assunto…" value="${e(LQ)}" oninput="LQ=this.value;go();const i=$('#lq');i.focus();i.setSelectionRange(i.value.length,i.value.length)"><button class="b" onclick="edTheme()">+ Assunto</button></div>`+(rows||emp('Nada encontrado.'))};

// ===== MEDPATH 2026 • Estudo inteligente, agenda e acompanhamento =====
// Os cálculos abaixo são heurísticas de organização, não previsões de resultado de prova.
function mpPriority(c){
  const a=acc(c),relv=rel(c),today=D(),current=+S.cfg.sem||0;
  const relevance=relv.s==null?null:Math.max(0,Math.min(10,Number(relv.s)||0));
  const performance=a.n>=5?Math.round((100-a.p)*.35):a.n?Math.round((100-a.p)*.18)+7:16;
  const incidence=relevance==null?10:Math.round(relevance*2.5);
  const daysLate=studied(c)&&calendarValidDate(c.next)?Math.max(0,Math.round((new Date(today+'T12:00')-new Date(c.next+'T12:00'))/864e5)):0;
  const review=daysLate?Math.min(20,8+daysLate*2):studied(c)&&c.next===today?9:0;
  const semester=sub(c.sub)?.sem==current?15:0;
  const started=c.status==='Em andamento'?6:!studied(c)?4:0;
  const total=Math.min(100,performance+incidence+review+semester+started);
  const factors=[];
  if(a.n>=5)factors.push(`${a.p}% de acertos em ${a.n} questões`);
  else if(a.n)factors.push(`${a.n} questão(ões): amostra inicial`);
  else factors.push('Ainda sem questões suficientes');
  if(relevance!==null)factors.push(`relevância histórica ${relevance}/10`);
  if(daysLate)factors.push(`revisão atrasada ${daysLate} dia(s)`);
  else if(c.next===today)factors.push('revisão para hoje');
  if(semester)factors.push('disciplina do semestre atual');
  return {total,level:total>=65?'Alta':total>=42?'Média':'Baixa',factors,performance,incidence,review,semester,score:relevance};
}
function mpFocus(){
 const all=S.cons.map(c=>({c,x:mpPriority(c)})).filter(z=>z.c.status!=='Finalizado'||studied(z.c)&&z.c.next<=D()||acc(z.c).n>=5&&acc(z.c).p<70)
 .sort((a,b)=>b.x.total-a.x.total||a.c.name.localeCompare(b.c.name)).slice(0,5);
 return `<div class="card"><div class="row"><h3 class="gr" style="margin:0">Seu foco de hoje</h3><small>Prioridade calculada a partir de estudo, questões, revisões e incidência</small></div>`+
 (all.length?all.map(z=>`<div class="mp-focus-item"><div class="row"><strong class="gr">${e(z.c.name)}</strong><span class="mp-priority ${z.x.total>=65?'mp-high':z.x.total>=42?'mp-medium':''}">${z.x.total}/100 · ${z.x.level}</span></div><small>${e(sub(z.c.sub)?.name||'')} · ${e(z.x.factors.join(' · '))}</small><div class="mp-track"><div style="width:${z.x.total}%"></div></div></div>`).join(''):'<p class="mu">Cadastre conteúdos para começar a organizar as prioridades.</p>')+
 `<small class="mu">A pontuação indica prioridade de estudo, não conhecimento clínico nem probabilidade de aprovação.</small></div>`;
}
const mpPrevDashboard=V.dashboard;
V.dashboard=()=>{
 const h=mpPrevDashboard(),from=h.indexOf('<h3 style="margin-top:16px">Recomendado para você</h3>'),to=h.indexOf('<h3>Minha semana</h3>');
 return from>=0&&to>from?h.slice(0,from)+mpFocus()+h.slice(to):h+mpFocus();
};

// Evolução por conteúdo: registros por data (não supõe que uma nota acumulada é a nota de um único teste).
function mpSeries(c){
 const a=(S.qsessions||[]).filter(x=>x.con===c.id).map(x=>({date:x.date||'',n:+x.total||0,ok:+x.correct||0,source:x.source||'Questões externas'}));
 S.ans.filter(x=>x.con===c.id).forEach(x=>a.push({date:x.d||'',n:1,ok:x.ok?1:0,source:'Questão do MedPath'}));
 const by={};a.filter(x=>x.date&&x.n>0).forEach(x=>{const y=by[x.date]||(by[x.date]={date:x.date,n:0,ok:0});y.n+=x.n;y.ok+=x.ok});
 return Object.values(by).sort((x,y)=>x.date.localeCompare(y.date)).map(x=>({...x,p:Math.round(100*x.ok/x.n)}));
}
function mpEvolution(){
 const withData=S.cons.map(c=>({c,points:mpSeries(c)})).filter(z=>z.points.length).sort((a,b)=>b.points.length-a.points.length||b.points.at(-1).date.localeCompare(a.points.at(-1).date));
 const selected=S.cfg.evolutionCon||withData[0]?.c.id||'';
 const opts=withData.map(z=>[z.c.id,`${sub(z.c.sub)?.name||'Disciplina'} · ${z.c.name}`]);
 const found=withData.find(z=>z.c.id===selected)||withData[0];
 const vals=found?.points.slice(-8)||[];const width=600,height=132,pad=18;
 const coords=vals.map((p,i)=>[vals.length===1?width/2:pad+i*(width-2*pad)/(vals.length-1),height-18-p.p*(height-36)/100]);
 const poly=coords.map(p=>p.join(',')).join(' ');
 return `<div class="card"><h3>Evolução por conteúdo</h3>${withData.length?`<select aria-label="Escolha o conteúdo" style="width:100%;margin:4px 0 12px" onchange="S.cfg.evolutionCon=this.value;save();go()">${O(opts,found.c.id)}</select><div class="mp-trend"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfico de acertos em datas consecutivas"><line x1="${pad}" x2="${width-pad}" y1="${height-18}" y2="${height-18}" stroke="currentColor" opacity=".2"/><line x1="${pad}" x2="${width-pad}" y1="${18}" y2="${18}" stroke="currentColor" opacity=".08"/>${coords.length>1?`<polyline points="${poly}" fill="none" stroke="var(--p)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`:''}${coords.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="5" fill="var(--g)"><title>${fmt(vals[i].date)}: ${vals[i].p}% (${vals[i].ok}/${vals[i].n})</title></circle>`).join('')}</svg></div><div class="mp-trend-labels">${vals.map(v=>`<div><small>${fmt(v.date).slice(0,5)}</small><strong>${v.p}%</strong><small>${v.ok}/${v.n}</small></div>`).join('')}</div><p class="mu" style="margin-top:8px"><small>Resultados de cada dia, em ordem cronológica. Quanto mais registros, mais confiável a tendência.</small></p>`:'<p class="mu">Registre questões feitas por fora para acompanhar a evolução de cada conteúdo.</p>'}</div>`;
}
const mpOriginalEstatisticas=V.estatisticas;
V.desempenho=()=>mpOriginalEstatisticas()+mpEvolution();

// Aulas e subtópicos: usar apenas títulos existentes no catálogo ou índices efetivamente consultados.
let MP_VERIFIED_TOPICS = null;
function mpRoot(x){return incNorm(x).replace(/\b(do|da|de|dos|das|e|na|no|em|com|para|um|uma)\b/g,' ').split(/\s+/).filter(w=>w.length>=5).map(w=>w.replace(/oes$/,'ao').replace(/(es|s)$/,'')).filter(w=>w.length>=4)}
function mpSubtopics(t){
 const key=incNorm(t.name),root=mpRoot(t.name),found=[],added=new Set(),specialty=driveSubject(t.esp);
 const addOne=(name,source='',link=null)=>{const k=incNorm(name);if(k===key||added.has(k)||!k)return;added.add(k);found.push({name,source,link})};
 const listed=(MP_VERIFIED_TOPICS||{})[key]||(MP_VERIFIED_TOPICS||{})[key.replace(/s$/,'')]||[];
 // Somente conceitos documentados nos índices consultados, sem gerar texto médico novo.
 listed.forEach(name=>addOne(name,'índice de aula'));
 // Nas páginas com um índice específico, não misturar subtópicos de outras áreas apenas pelo nome parecido.
 if(listed.length)return found.map(x=>({...x,t:S.themes.find(v=>incNorm(v.name)===incNorm(x.name)&&driveSubject(v.esp)===specialty)})).slice(0,7);
 if(root.length){
  S.themes.filter(x=>x.id!==t.id&&driveSubject(x.esp)===specialty).forEach(x=>{
   const words=mpRoot(x.name),matches=root.filter(w=>words.some(y=>y===w||y.startsWith(w)||w.startsWith(y)));
   if(matches.length&&(matches.length>=Math.min(2,root.length)||root.length===1))addOne(x.name,'Biblioteca',x.id);
  });
  for(const [full,files] of Object.entries(DRIVE_AULAS_INDEX||{})){
   const cut=full.indexOf('|');if(full.slice(0,cut)!==specialty)continue;
   const title=full.slice(cut+1),tw=mpRoot(title);
   if(tw.some(w=>root.some(r=>w===r||w.startsWith(r)||r.startsWith(w)))&&title.length>t.name.length) addOne(title,'aula catalogada');
  }
 }
 return found.map(x=>({...x,t:S.themes.find(v=>incNorm(v.name)===incNorm(x.name)&&driveSubject(v.esp)===specialty)})).slice(0,7);
}
function mpSubtopicsPanel(t){const topics=mpSubtopics(t);if(!topics.length)return '';
 return `<div class="card mp-subtopics"><div class="row"><h3 class="gr" style="margin:0">Subtópicos identificados nos materiais</h3><span class="mp-subtle">${topics.length} relacionados</span></div><p class="mu"><small>Lista curta derivada de títulos e índices catalogados das aulas. Não representa leitura completa de todos os PDFs, nem frequência individual comprovada nas provas.</small></p><div class="mp-topic-list">${topics.map(z=>`<div class="row"><span class="gr">${e(z.name)}</span>${z.t?`<button class="b2" onclick="OT='${z.t.id}';go()">Ver na Biblioteca</button>`:''}</div>`).join('')}</div></div>`;
}
const mpOriginalLibDet=libDet;
libDet=function(t){return mpOriginalLibDet(t)+mpSubtopicsPanel(t)};

// Agenda adaptativa: itens automáticos atrasados são realocados para dias com espaço.
function mpDailyLoad(date,exclude=''){
 const tasks=S.tasks.filter(t=>t.id!==exclude&&t.date===date&&!t.done&&mcVisibleTask(t)).reduce((sum,t)=>sum+Math.max(.5,Number(t.h)||1),0);
 const reviews=mcAutoRevisions().filter(r=>r.date===date).length;
 return tasks+reviews;
}
function mpSlots(days=21){const arr=[];for(let i=0;i<days;i++){const d=add(D(),i),date=new Date(d+'T12:00'),hours=Number(S.cfg.hrs[date.getDay()])||0;if(hours>0)arr.push({d,hours})}return arr}
function mpPlace(t,slots){const h=Math.max(.5,Number(t.h)||1);for(const x of slots){if(mpDailyLoad(x.d,t.id)+h<=x.hours){t.movedFrom=t.movedFrom||t.date;t.date=x.d;t.rescheduled=D();t.dif='Reagendada automaticamente de '+fmt(t.movedFrom);return true}}return false}
function adaptiveRollover(){
 if(S.mpLastRebalanced===D())return;
 const stale=S.tasks.filter(t=>!t.manual&&!t.done&&t.p!=='Revisão'&&calendarValidDate(t.date)&&t.date<D());
 stale.sort((a,b)=>a.date.localeCompare(b.date)||(mpPriority(con(b.con)||{name:'',sub:'',status:'Não iniciado'}).total-mpPriority(con(a.con)||{name:'',sub:'',status:'Não iniciado'}).total));
 const slots=mpSlots(21);let moved=0;
 for(const t of stale){if(mpPlace(t,slots))moved++}
 S.mpLastRebalanced=D();if(moved)save();
}
// Ao gerar a semana, priorizar pendências e não eliminar tarefas geradas anteriormente.
gen=function(){
 adaptiveRollover();const ws=wkS(),end=add(ws,6),semester=+S.cfg.sem||0,slots=mpSlots(7).filter(x=>x.d>=ws&&x.d<=end);
 const pending=new Set(S.tasks.filter(t=>!t.done&&!t.manual).map(t=>t.p+'|'+(t.con||t.txt)));
 const candidates=[];
 S.cons.filter(c=>sub(c.sub)?.sem==semester&&!finished(c)).forEach(c=>candidates.push({p:'Faculdade',txt:`Estudar: ${sub(c.sub)?.name||''} — ${c.name}`,con:c.id,h:1,importance:mpPriority(c).total}));
 S.cons.filter(c=>studied(c)&&(sub(c.sub)?.sem==semester||mpPriority(c).total>=65)).forEach(c=>{
  const t=rel(c).temas.find(z=>z.t);if(t)candidates.push({p:'Residência',txt:`Biblioteca: ${t.t.name} (base: ${c.name})`,con:c.id,h:1,importance:mpPriority(c).total-6});
 });
 const withQ=S.cons.filter(c=>acc(c).n>=5&&acc(c).p<70).slice(0,5);
 withQ.forEach(c=>candidates.push({p:'Residência',txt:`Questões e erros: ${c.name}`,con:c.id,h:1,importance:mpPriority(c).total+5}));
 candidates.sort((a,b)=>b.importance-a.importance);
 let added=0;
 for(const item of candidates){const key=item.p+'|'+item.con;
  if(pending.has(key))continue;
  const target=slots.map(x=>({...x,load:mpDailyLoad(x.d)})).filter(x=>x.load+1<=x.hours).sort((a,b)=>a.load/a.hours-b.load/b.hours)[0];
  if(!target)continue;
  S.tasks.push({id:U(),date:target.d,p:item.p,con:item.con,txt:item.txt,h:1,done:false,mpPriority:item.importance});pending.add(key);added++;
 }
 save();go();
};
// Questões externas não exibem uma guia/painel separado de revisões; o controle de revisão fica no Cronograma.
const mpBaseExternalRecords=externalRecords;
externalRecords=function(){
 const h=mpBaseExternalRecords(),a=h.indexOf('<div class="card"><h3>Prioridade de revisão por conteúdo'),b=h.indexOf('<div class="card"><h3>Registros anteriores',a);
 return a>=0&&b>a?h.slice(0,a)+h.slice(b):h;
};
// Revisões ficam apenas em Cronograma. Questões continua com registros, banco, erros e histórico.
V.questoes=()=>sec('questoes',[
 ['registro','Questões feitas'],['q','Banco ('+S.qs.length+')'],['x','Caderno de erros'],['h','Histórico ('+S.ans.length+')']
],{registro:externalRecords,q:V.bancoQuestoes,x:V.erros,h:V.histq});
V.cronograma=()=>sec('crono', [['agenda','Calendário'],['rev','Revisões']],{agenda:CR,rev:V.revisoes});

// Login, cadastro e sincronização externa removidos; o estudo é salvo localmente.
// Em revisões o botão continua acessível dentro do Cronograma, inclusive por link da agenda.
const mpOldGo=go;
go=function(){if(location.hash==='#cronograma')adaptiveRollover();mpOldGo()};
// ===== FIM MEDPATH 2026 =====

addEventListener('hashchange',()=>{go();scrollTo(0,0)});
function mcRefreshToday(){const now=D();if(now!==MC_LAST_TODAY){MC_LAST_TODAY=now;if(location.hash==='#cronograma')go()}}
addEventListener('focus',mcRefreshToday);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)mcRefreshToday()});
setInterval(mcRefreshToday,60000);
window.medpathStart=()=>{mig();mig4();ap();go()};

window.medpathHydrate=(catalog,state)=>{
  for(const key of ['G1','G2','DRIVE_AULAS_INDEX','DRIVE_TOPIC_EXTRA','LIST','INC_ALIASES','INC_SUBJECTS','INC_REPLACE','MP_VERIFIED_TOPICS']){
    if(!Object.prototype.hasOwnProperty.call(catalog,key))throw Error('Catálogo incompleto: '+key);
  }
  if(typeof catalog.G1!=='string'||!catalog.G2||typeof catalog.G2!=='object'||typeof catalog.LIST!=='string')throw Error('Catálogo com formato inválido: G1, G2 ou LIST');
  G1=catalog.G1;G2=catalog.G2;DRIVE_AULAS_INDEX=catalog.DRIVE_AULAS_INDEX;DRIVE_TOPIC_EXTRA=catalog.DRIVE_TOPIC_EXTRA;LIST=catalog.LIST;
  INC_ALIASES=catalog.INC_ALIASES;INC_SUBJECTS=catalog.INC_SUBJECTS;INC_REPLACE=catalog.INC_REPLACE;MP_VERIFIED_TOPICS=catalog.MP_VERIFIED_TOPICS;
  GE=G1.split(';').map(x=>x.split('|'));GT=Object.fromEntries(Object.entries(G2).map(([k,v])=>[k,v.split(';').map(x=>x.split('|'))]));
  WL=null;INC_TOP=null;S=state&&typeof state==='object'?state:blank();
  for(const key of ['subs','cons','themes','qs','ans','errs','tasks','hist','qsessions'])if(!Array.isArray(S[key]))S[key]=[];
  S.cfg={...blank().cfg,...(S.cfg&&typeof S.cfg==='object'&&!Array.isArray(S.cfg)?S.cfg:{})};
  if(!Array.isArray(S.cfg.hrs)||S.cfg.hrs.length!==7)S.cfg.hrs=blank().cfg.hrs;
  S.cons.forEach(c=>{if(!Array.isArray(c.themes))c.themes=[];if(!c.cx||typeof c.cx!=='object')c.cx={};});
  window.medpathStart();
};

window.medpathGetState=()=>S;
