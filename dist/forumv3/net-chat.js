(function(){
const STYLE_ID='forumv3-net-chat-style';

function addStyle(){
  if(document.getElementById(STYLE_ID)) return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
.fv3-chat{max-width:760px;margin:14px auto;border:1px solid rgba(120,36,43,.42);border-radius:16px;overflow:hidden;background:#0d1015;color:#e9edf2;font-family:"Segoe UI","Microsoft YaHei",sans-serif;box-shadow:0 18px 46px rgba(0,0,0,.42)}
.fv3-head{background:#141922;padding:13px 16px;border-bottom:1px solid rgba(255,255,255,.08);text-align:center}
.fv3-title{font-size:17px;font-weight:800}
.fv3-sub{font-size:12px;color:#8f98a6;margin-top:3px}
.fv3-body{padding:16px 14px;background:#0c1117;display:grid;gap:12px}
.fv3-row{display:grid;grid-template-columns:38px minmax(0,1fr);gap:9px;align-items:start;max-width:88%}
.fv3-row.mine{justify-self:end;grid-template-columns:minmax(0,1fr) 38px}
.fv3-avatar{width:38px;height:38px;border-radius:10px;background:#26303d;border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;color:#d6dce6;font-weight:700}
.fv3-row.mine .fv3-avatar{background:#7d242d;color:#ffe9e9}
.fv3-name{font-size:11px;color:#9aa4b2;margin:0 0 4px 2px}
.fv3-row.mine .fv3-name{text-align:right;color:#cfa6aa}
.fv3-bubble{display:inline-block;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:9px 11px;background:#1b232e;color:#eef3f8;line-height:1.65;white-space:pre-wrap;word-break:break-word}
.fv3-row.mine .fv3-bubble{background:#8b2731;color:#fff;border-color:#b13a45}
.fv3-system{justify-self:center;color:#8f98a6;font-size:12px}
.fv3-inputbar{border-top:1px solid rgba(255,255,255,.08);padding:11px 12px;background:#10151c;display:flex;gap:8px}
.fv3-input{flex:1;border:1px solid rgba(255,255,255,.12);background:#0b0f14;color:#aeb7c4;border-radius:999px;padding:9px 12px;text-align:left;cursor:pointer}
.fv3-send{border:1px solid rgba(185,42,48,.62);background:#7f2029;color:#fff;border-radius:999px;padding:9px 13px;cursor:pointer;font-weight:700}
`;
  document.head.appendChild(style);
}

function esc(v){
  return String(v??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function pair(line){
  const m=String(line).match(/^\[([^|\]]+)\|([\s\S]*)\]$/);
  return m?[m[1],m[2]]:null;
}

function parseMessageLine(line){
  if(!line.startsWith('[消息|') || !line.endsWith(']')) return null;
  const parts=line.slice(1,-1).split('|');
  if(parts.length<5) return null;
  return {
    sender: parts[1] || '对方',
    time: parts[2] || '',
    type: parts[3] || 'text',
    content: parts.slice(4,-1).join('|') || parts[4] || ''
  };
}

function parse(raw){
  const data={platform:'微信',contact:'聊天',note:'',messages:[],hint:''};
  let inMessages=false;
  for(const line of String(raw||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean)){
    if(line==='[messages]'){ inMessages=true; continue; }
    if(line==='[/messages]'){ inMessages=false; continue; }
    if(inMessages){
      const msg=parseMessageLine(line);
      if(msg) data.messages.push(msg);
      continue;
    }
    const p=pair(line);
    if(!p) continue;
    const [key,val]=p;
    if(key==='平台') data.platform=val;
    if(key==='联系人' || key==='群聊名') data.contact=val;
    if(key==='关系备注') data.note=val;
    if(key==='input_hint') data.hint=val;
  }
  return data;
}

function hostDoc(){
  try{
    return window.parent&&window.parent.document?window.parent.document:document;
  }catch(e){
    return document;
  }
}

function setInput(text){
  const doc=hostDoc();
  const target=doc.querySelector('#send_textarea')||doc.querySelector('textarea[name="message"]')||doc.querySelector('textarea');
  if(!target) return;
  const desc=Object.getOwnPropertyDescriptor((target.ownerDocument.defaultView||window).HTMLTextAreaElement.prototype,'value');
  if(desc&&desc.set) desc.set.call(target,text); else target.value=text;
  target.dispatchEvent(new Event('input',{bubbles:true,cancelable:true}));
  target.dispatchEvent(new Event('change',{bubbles:true}));
  target.focus();
}

function isMine(sender){
  return sender==='我' || sender==='{{user}}';
}

function avatarText(sender){
  return isMine(sender)?'我':Array.from(sender||'对')[0];
}

function renderMessage(msg){
  if(msg.sender==='系统' || msg.type==='system'){
    return `<div class="fv3-system">${esc(msg.content)}</div>`;
  }
  const mine=isMine(msg.sender);
  const sender=mine?'我':msg.sender;
  const avatar=`<div class="fv3-avatar">${esc(avatarText(sender))}</div>`;
  const bubble=`<div><div class="fv3-name">${esc(sender)}${msg.time?' · '+esc(msg.time):''}</div><div class="fv3-bubble">${esc(msg.content)}</div></div>`;
  return mine ? `<div class="fv3-row mine">${bubble}${avatar}</div>` : `<div class="fv3-row">${avatar}${bubble}</div>`;
}

function init(shell){
  if(shell.dataset.ready) return;
  shell.dataset.ready='1';
  const tpl=shell.querySelector('template');
  const root=shell.querySelector('.forumv3-net-chat-root') || shell;
  const data=parse(tpl?tpl.innerHTML:shell.textContent);
  const hint=data.hint || `回复${data.contact}：`;
  root.innerHTML=`
    <div class="fv3-chat">
      <div class="fv3-head">
        <div class="fv3-title">${esc(data.contact)}</div>
        <div class="fv3-sub">${esc(data.platform)}${data.note?' / '+esc(data.note):''}</div>
      </div>
      <div class="fv3-body">
        ${data.messages.length ? data.messages.map(renderMessage).join('') : '<div class="fv3-system">暂无消息</div>'}
      </div>
      <div class="fv3-inputbar">
        <button class="fv3-input" data-fill="${esc(hint)}">${esc(hint)}</button>
        <button class="fv3-send" data-fill="${esc(hint)}">填入</button>
      </div>
    </div>`;
}

addStyle();
document.querySelectorAll('.forumv3-net-chat-shell').forEach(init);
document.addEventListener('click',function(e){
  const btn=e.target.closest('[data-fill]');
  if(btn) setInput(btn.dataset.fill||'');
});
})();
