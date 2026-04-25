(function () {
  const STYLE_ID = 'forumv3-net-chat-style';

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .fv2-chat{max-width:760px;margin:14px auto;border:1px solid rgba(185,42,48,.38);border-radius:18px;overflow:hidden;background:#0b0f14;color:#e9edf2;font-family:"Segoe UI","Microsoft YaHei",sans-serif;box-shadow:0 18px 46px rgba(0,0,0,.42)}
      .fv2-chat-head{background:linear-gradient(180deg,#141922,#0f1319);padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:center;align-items:center;position:relative}
      .fv2-title{font-size:17px;font-weight:800;color:#f5f7fb;text-align:center}.fv2-sub{position:absolute;right:16px;top:15px;font-size:12px;color:#8f98a6}
      .fv2-body{padding:16px 14px 10px;background:radial-gradient(circle at top left,rgba(115,27,34,.28),transparent 34%),#0c1117;display:grid;gap:12px}
      .fv2-row{display:grid;grid-template-columns:34px minmax(0,1fr);gap:9px;align-items:start;max-width:86%}
      .fv2-row.mine{justify-self:end;grid-template-columns:minmax(0,1fr) 34px}
      .fv2-avatar{width:34px;height:34px;border-radius:8px;background:#26303d;border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;color:#d6dce6;font-weight:700;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.28)}
      .fv2-row.mine .fv2-avatar{background:#71242b;color:#ffe9e9}
      .fv2-name{font-size:11px;color:#9aa4b2;margin:0 0 4px 2px}.fv2-row.mine .fv2-name{text-align:right;margin:0 2px 4px 0;color:#c7a0a4}
      .fv2-bubble{display:inline-block;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:9px 11px;background:#1b232e;color:#eef3f8;line-height:1.65;white-space:pre-wrap;text-align:left;max-width:100%;word-break:break-word}
      .fv2-row.mine .fv2-bubble{background:#8b2731;color:#fff;border-color:#b13a45}
      .fv2-system{justify-self:center;max-width:92%;color:#8f98a6;font-size:12px;text-align:center;padding:2px 0}
      .fv2-image{min-width:132px;min-height:84px;border-radius:10px;background:#131a22;border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;color:#9aa4b2}
      .fv2-inputbar{border-top:1px solid rgba(255,255,255,.08);padding:11px 12px;background:#10151c;display:flex;gap:8px;align-items:center}
      .fv2-input{flex:1;border:1px solid rgba(255,255,255,.12);background:#0b0f14;color:#aeb7c4;border-radius:999px;padding:9px 12px;font-size:13px;cursor:pointer;text-align:left;min-height:18px}
      .fv2-send{border:1px solid rgba(185,42,48,.62);background:#7f2029;color:#fff;border-radius:999px;padding:9px 13px;cursor:pointer;font-weight:700}
      .fv2-send:hover,.fv2-input:hover{filter:brightness(1.12)}
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

  function parseBracket(line) {
    const match = String(line).match(/^\[([^|\]]+)\|([\s\S]*)\]$/);
    return match ? [match[1], match[2]] : null;
  }

  function parseMessageLine(line) {
    if (!line.startsWith('[消息|') || !line.endsWith(']')) return null;
    const inner = line.slice(1, -1);
    const parts = inner.split('|');
    if (parts.length < 5 || parts[0] !== '消息') return null;
    return {
      sender: parts[1] || '对方',
      time: parts[2] || '',
      type: parts[3] || 'text',
      content: parts.slice(4, -1).join('|') || parts[4] || '',
      extra: parts[parts.length - 1] || ''
    };
  }

  function parse(raw) {
    const data = { platform: '微信', contact: '微信聊天', note: '', status: '', messages: [], hints: [] };
    const lines = String(raw || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    let inMessages = false;
    for (const line of lines) {
      if (line === '[messages]') { inMessages = true; continue; }
      if (line === '[/messages]') { inMessages = false; continue; }
      const pair = parseBracket(line);
      if (pair && !inMessages) {
        const [key, value] = pair;
        if (key === '平台') data.platform = value || data.platform;
        else if (key === '联系人') data.contact = value || data.contact;
        else if (key === '群聊名') data.contact = value || data.contact;
        else if (key === '关系备注') data.note = value || '';
        else if (key === '在线状态') data.status = value || '';
        else if (key === 'input_hint') data.hints.push(value);
        continue;
      }
      if (inMessages) {
        const msg = parseMessageLine(line);
        if (msg) data.messages.push(msg);
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
    const view = textarea.ownerDocument.defaultView || window;
    const descriptor = Object.getOwnPropertyDescriptor(view.HTMLTextAreaElement.prototype, 'value');
    if (descriptor && descriptor.set) descriptor.set.call(textarea, text);
    else textarea.value = text;
    textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    textarea.focus();
    return true;
  }

  function avatarText(sender) {
    const name = String(sender || '对方').trim();
    if (name === '我' || name === '{{user}}') return '我';
    return Array.from(name)[0] || '对';
  }

  function normalizeSender(sender) {
    if (sender === '{{user}}') return '我';
    return sender || '对方';
  }

  function renderMessage(message) {
    const sender = normalizeSender(message.sender);
    const mine = sender === '我';
    if (message.type === 'system' || sender === '系统') {
      return `<div class="fv2-system">${esc(message.content)}</div>`;
    }
    let body = esc(message.content);
    if (message.type === 'image') {
      body = `<div class="fv2-image">${esc(message.content || '图片')}</div>`;
    } else if (message.type === 'voice') {
      body = esc(message.content || '[语音]');
    } else if (message.type === 'task') {
      body = esc(message.content);
    } else if (message.type === 'recall') {
      body = esc(message.content || '消息已删除');
    }
    const avatar = `<div class="fv2-avatar">${esc(avatarText(sender))}</div>`;
    const bubble = `<div><div class="fv2-name">${esc(sender)}${message.time ? ' · ' + esc(message.time) : ''}</div><div class="fv2-bubble">${body}</div></div>`;
    return mine
      ? `<div class="fv2-row mine">${bubble}${avatar}</div>`
      : `<div class="fv2-row">${avatar}${bubble}</div>`;
  }

  function initShell(shell) {
    if (shell.dataset.fv2Ready === '1') return;
    shell.dataset.fv2Ready = '1';
    const template = shell.querySelector('template');
    const root = shell.querySelector('.forumv3-net-chat-root') || shell;
    const data = parse(template ? template.innerHTML : shell.textContent);
    const hint = data.hints[0] || `回复${data.contact}：`;
    root.innerHTML = `
      <div class="fv2-chat">
        <div class="fv2-chat-head">
          <div class="fv2-title">${esc(data.contact)}</div>
          <div class="fv2-sub">${esc(data.platform)}</div>
        </div>
        <div class="fv2-body">${data.messages.map(renderMessage).join('') || '<div class="fv2-system">暂无消息</div>'}</div>
        <div class="fv2-inputbar">
          <button class="fv2-input" data-fill="${esc(hint)}">${esc(hint || '输入消息...')}</button>
          <button class="fv2-send" data-fill="${esc(hint)}">填入</button>
        </div>
      </div>`;
  }

  addStyle();
  document.querySelectorAll('.forumv3-net-chat-shell').forEach(initShell);
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-fill]');
    if (button) setInput(button.dataset.fill || '');
  });
})();
