(function () {
  const STYLE_ID = 'forumv2-net-chat-style';

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .fv2-chat{max-width:760px;margin:14px auto;border:1px solid rgba(224,49,49,.28);border-radius:16px;overflow:hidden;background:#151515;color:#e8e1dc;font-family:"Segoe UI","Microsoft YaHei",sans-serif;box-shadow:0 18px 44px rgba(0,0,0,.36)}
      .fv2-chat-head{background:#b4232b;padding:12px 14px;display:flex;justify-content:space-between;gap:12px;align-items:center;color:#fff}
      .fv2-title{font-size:16px;font-weight:700}.fv2-sub{font-size:12px;opacity:.82;margin-top:3px}.fv2-badge{font-size:12px;border:1px solid rgba(255,255,255,.32);border-radius:999px;padding:4px 9px;white-space:nowrap}
      .fv2-body{padding:14px;background:linear-gradient(180deg,#181818,#101010);display:grid;gap:12px}
      .fv2-msg{max-width:78%;display:grid;gap:4px}.fv2-msg.mine{justify-self:end;text-align:right}.fv2-meta{font-size:11px;color:#9b918d}
      .fv2-bubble{border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px 12px;background:#2a2a2a;line-height:1.65;white-space:pre-wrap;text-align:left}
      .fv2-msg.mine .fv2-bubble{background:#9f2630;color:#fff;border-color:#c9434b}.fv2-system{justify-self:center;max-width:92%;color:#b8aca6;font-size:12px;text-align:center}
      .fv2-voice{display:flex;align-items:center;gap:8px}.fv2-wave{width:42px;height:14px;background:repeating-linear-gradient(90deg,#fff 0 2px,transparent 2px 6px);opacity:.7;border-radius:4px}
      .fv2-recall{color:#aaa;font-size:12px;text-align:center}.fv2-task{border:1px dashed rgba(255,210,120,.45);background:rgba(105,70,20,.22)}.fv2-image{min-width:130px;min-height:84px;border-radius:10px;background:#1f1f1f;border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;color:#aaa}
      .fv2-input{border-top:1px solid rgba(224,49,49,.25);padding:10px 12px;background:#202020;display:flex;flex-wrap:wrap;gap:8px}.fv2-btn{border:1px solid rgba(224,49,49,.45);background:#2a1719;color:#f1d2d2;border-radius:999px;padding:7px 11px;cursor:pointer}.fv2-btn:hover{background:#3a1d21;color:#fff}
    `;
    document.head.appendChild(style);
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parse(raw) {
    const data = { platform: '微信', contact: '未命名联系人', note: '', status: '', messages: [], hints: [] };
    const lines = String(raw || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    let inMessages = false;

    for (const line of lines) {
      if (line === '[messages]') { inMessages = true; continue; }
      if (line === '[/messages]') { inMessages = false; continue; }

      let match = line.match(/^\[平台\|([\s\S]*)\]$/);
      if (match) { data.platform = match[1]; continue; }
      match = line.match(/^\[联系人\|([\s\S]*)\]$/);
      if (match) { data.contact = match[1]; continue; }
      match = line.match(/^\[关系备注\|([\s\S]*)\]$/);
      if (match) { data.note = match[1]; continue; }
      match = line.match(/^\[在线状态\|([\s\S]*)\]$/);
      if (match) { data.status = match[1]; continue; }
      match = line.match(/^\[input_hint\|([\s\S]*)\]$/);
      if (match) { data.hints.push(match[1]); continue; }

      if (inMessages) {
        match = line.match(/^\[消息\|([^|]*)\|([^|]*)\|([^|]*)\|([\s\S]*?)\|([^|]*)\]$/);
        if (match) {
          data.messages.push({ sender: match[1], time: match[2], type: match[3], content: match[4], extra: match[5] });
        }
      }
    }

    return data;
  }

  function hostDocument() {
    try { return window.parent && window.parent.document ? window.parent.document : document; } catch (error) { return document; }
  }

  function setInput(text) {
    const doc = hostDocument();
    const textarea = doc.querySelector('#send_textarea') || doc.querySelector('textarea[name="message"]') || doc.querySelector('textarea');
    if (!textarea) return false;
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
    if (descriptor && descriptor.set) descriptor.set.call(textarea, text);
    else textarea.value = text;
    textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    textarea.focus();
    return true;
  }

  function renderMessage(message) {
    const sender = message.sender || '对方';
    const mine = sender === '我' || sender === '{{user}}';
    if (message.type === 'recall') {
      return `<div class="fv2-system"> ${esc(sender)} 撤回了一条消息</div>`;
    }
    const meta = `${esc(sender)} · ${esc(message.time || '')}`;
    let body = esc(message.content);
    if (message.type === 'voice') {
      body = `<div class="fv2-voice"><span class="fv2-wave"></span><span>${esc(message.extra || '0:05')}</span><span>${esc(message.content)}</span></div>`;
    } else if (message.type === 'image') {
      body = `<div class="fv2-image">${esc(message.content || '图片')}</div>`;
    }
    const taskClass = message.type === 'task' ? ' fv2-task' : '';
    return `<div class="fv2-msg ${mine ? 'mine' : ''}"><div class="fv2-meta">${meta}</div><div class="fv2-bubble${taskClass}">${body}</div></div>`;
  }

  function initShell(shell) {
    if (shell.dataset.fv2Ready === '1') return;
    shell.dataset.fv2Ready = '1';
    const template = shell.querySelector('template');
    const root = shell.querySelector('.forumv2-net-chat-root') || shell;
    const data = parse(template ? template.innerHTML : shell.textContent);
    const hintButtons = data.hints.length
      ? data.hints.map((hint) => `<button class="fv2-btn" data-fill="${esc(hint)}">${esc(hint)}</button>`).join('')
      : `<button class="fv2-btn" data-fill="回复${esc(data.contact)}：">回复</button>`;

    root.innerHTML = `
      <div class="fv2-chat">
        <div class="fv2-chat-head">
          <div><div class="fv2-title">${esc(data.contact)}</div><div class="fv2-sub">${esc(data.platform)} · ${esc(data.note || '私聊')}</div></div>
          <div class="fv2-badge">${esc(data.status || '在线')}</div>
        </div>
        <div class="fv2-body">${data.messages.map(renderMessage).join('') || '<div class="fv2-system">暂无消息</div>'}</div>
        <div class="fv2-input">${hintButtons}</div>
      </div>`;
  }

  addStyle();
  document.querySelectorAll('.forumv2-net-chat-shell').forEach(initShell);
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.fv2-btn[data-fill]');
    if (button) setInput(button.dataset.fill || '');
  });
})();
