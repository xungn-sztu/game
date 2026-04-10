(function () {
  const state = {
    tab: 'overview',
    charPage: 0,
    postPage: 0,
    expandedSlot: '',
    currentZone: '',
    debug: '',
  };

  const PAGE_SIZE = 4;
  const SLOT_NAMES = ['\u6863\u68481', '\u6863\u68482', '\u6863\u68483', '\u6863\u68484'];
  const K = {
    world: '\u4e16\u754c',
    time: '\u8be6\u7ec6\u65f6\u95f4',
    year: '\u5e74',
    month: '\u6708',
    day: '\u65e5',
    hour: '\u65f6',
    minute: '\u5206',
    week: '\u661f\u671f',
    place: '\u5730\u70b9',
    player: '\u4e3b\u89d2',
    money: '\u91d1\u94b1',
    energy: '\u4f53\u529b',
    arousal: '\u52c3\u8d77\u72b6\u6001',
    release: '\u5c04\u7cbe\u9608\u503c',
    forum: '\u6697\u7f51\u8bba\u575b',
    account: '\u6211\u7684\u8d26\u6237',
    username: '\u7528\u6237\u540d',
    level: '\u7b49\u7ea7',
    points: '\u79ef\u5206',
    boughtMaterial: '\u5df2\u8d2d\u9ed1\u6599',
    boughtService: '\u5df2\u8d2d\u670d\u52a1',
    zoneMap: '\u5206\u533a\u6570\u636e',
    currentZone: '\u5f53\u524d\u5206\u533a',
    posts: '\u5e16\u5b50\u5217\u8868',
    services: '\u670d\u52a1\u5546\u5e97',
    title: '\u6807\u9898',
    author: '\u53d1\u5e16\u4eba',
    hotness: '\u70ed\u5ea6',
    roleIndex: '\u89d2\u8272\u7d22\u5f15',
    roleDetail: '\u89d2\u8272\u8be6\u60c5',
    compatRole: '\u5973\u89d2\u8272\u6863\u6848',
    roleName: '\u89d2\u8272\u540d',
    built: '\u662f\u5426\u5df2\u5efa\u6863',
    inScene: '\u5f53\u524d\u662f\u5426\u5728\u573a',
    publicTitle: '\u516c\u5f00\u5934\u8854',
    relationNature: '\u5173\u7cfb\u6027\u8d28',
    emotionDepth: '\u60c5\u611f\u6df1\u5ea6',
    lifePenetration: '\u751f\u6d3b\u6e17\u900f\u5ea6',
    intimacy: '\u4eb2\u5bc6\u7a0b\u5ea6',
    lastUpdate: '\u6700\u8fd1\u66f4\u65b0',
    realIdentity: '\u73b0\u5b9e\u8eab\u4efd',
    social: '\u793e\u4ea4\u4e0e\u4ece\u5c5e',
    body: '\u8eab\u4f53\u6570\u636e',
    channel: '\u8ba4\u8bc6\u6e20\u9053',
    price: '\u4ef7\u683c',
    desc: '\u63cf\u8ff0',
  };

  function text(value, fallback) {
    const finalFallback = fallback === undefined ? '\u65e0' : fallback;
    return value === undefined || value === null || value === '' ? finalFallback : value;
  }

  function get(obj, path, fallback) {
    let current = obj;
    for (const key of path) {
      if (current === undefined || current === null || typeof current !== 'object') return fallback;
      current = current[key];
    }
    return current === undefined ? fallback : current;
  }

  function getContext() {
    try {
      if (window.SillyTavern && typeof window.SillyTavern.getContext === 'function') return window.SillyTavern.getContext();
    } catch (error) {}
    try {
      if (window.parent && window.parent.SillyTavern && typeof window.parent.SillyTavern.getContext === 'function') {
        return window.parent.SillyTavern.getContext();
      }
    } catch (error) {}
    return null;
  }

  function getHostDocument() {
    try {
      if (window.parent && window.parent.document) return window.parent.document;
    } catch (error) {}
    return document;
  }

  function setDomInput(textValue) {
    const hostDocument = getHostDocument();
    const textarea = hostDocument.querySelector('#send_textarea')
      || hostDocument.querySelector('textarea[name="message"]')
      || hostDocument.querySelector('.message-input textarea')
      || hostDocument.querySelector('[data-testid="chat-input"] textarea')
      || hostDocument.querySelector('textarea');
    if (!textarea) return false;

    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
    if (descriptor && typeof descriptor.set === 'function') descriptor.set.call(textarea, textValue);
    else textarea.value = textValue;

    textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    textarea.focus();
    return true;
  }

  async function setInput(textValue) {
    const ctx = getContext();
    if (ctx && typeof ctx.executeSlashCommands === 'function') {
      try {
        await ctx.executeSlashCommands(`/setinput ${textValue}`);
        const hostDocument = getHostDocument();
        const textarea = hostDocument.querySelector('#send_textarea');
        if (textarea && String(textarea.value || '').trim()) return true;
      } catch (error) {}
    }
    return setDomInput(textValue);
  }

  async function getStatData() {
    const ctx = getContext();

    try {
      if (typeof window.getCurrentMessageId === 'function' && typeof window.getChatMessages === 'function') {
        const currentId = window.getCurrentMessageId();
        const messages = await window.getChatMessages(currentId);
        const stat = get(messages, [0, 'data', 'stat_data'], null);
        if (stat && typeof stat === 'object') {
          state.debug = '';
          return stat;
        }
      }
    } catch (error) {
      state.debug = `getChatMessages failed: ${error.message || error}`;
    }

    try {
      if (typeof window.getAllVariables === 'function') {
        const all = window.getAllVariables();
        const stat = get(all, ['stat_data'], null);
        if (stat && typeof stat === 'object') {
          state.debug = '';
          return stat;
        }
      }
    } catch (error) {
      state.debug = `getAllVariables failed: ${error.message || error}`;
    }

    try {
      if (ctx && ctx.variables && ctx.variables.local && typeof ctx.variables.local.get === 'function') {
        const stat = ctx.variables.local.get('stat_data');
        if (stat && typeof stat === 'object') {
          state.debug = '';
          return stat;
        }
      }
    } catch (error) {
      state.debug = `context.variables.local.get failed: ${error.message || error}`;
    }

    return {};
  }

  function formatTime(stat) {
    const time = get(stat, [K.world, K.time], null);
    if (!time || time[K.year] === undefined) return '\u672a\u540c\u6b65';
    const pad = (value) => String(value || 0).padStart(2, '0');
    return `${time[K.year]}-${pad(time[K.month])}-${pad(time[K.day])} ${pad(time[K.hour])}:${pad(time[K.minute])} ${text(time[K.week], '')}`.trim();
  }

  function section(title, badge, body) {
    return `<section class="section"><div class="section-head"><span>${title}</span><span class="badge">${badge}</span></div>${body}</section>`;
  }

  function pager(kind, pageIndex, total) {
    return `<div class="pager">`
      + `<button class="action" data-action="${kind}-prev" ${pageIndex <= 0 ? 'disabled' : ''}>\u4e0a\u4e00\u9875</button>`
      + `<span>${pageIndex + 1} / ${total}</span>`
      + `<button class="action" data-action="${kind}-next" ${pageIndex >= total - 1 ? 'disabled' : ''}>\u4e0b\u4e00\u9875</button>`
      + `</div>`;
  }

  function getSummarySlot(stat, slot) {
    const compat = get(stat, [K.compatRole, slot], {}) || {};
    const index = get(stat, [K.roleIndex, slot], {}) || {};
    if (Object.keys(index).length) return Object.assign({}, compat, index);
    return compat;
  }

  function getDetailSlot(stat, slot) {
    const compat = get(stat, [K.compatRole, slot], {}) || {};
    const primary = get(stat, [K.roleDetail, slot], {}) || {};
    if (Object.keys(primary).length) return Object.assign({}, compat, primary);
    return compat;
  }

  function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function isSlotKey(key) {
    return SLOT_NAMES.includes(key);
  }

  function getDisplayName(rawName, fallbackName) {
    return rawName || fallbackName || '';
  }

  function normalizeCharacterRow(nameHint, slot, summary, detail, source) {
    const summaryData = isPlainObject(summary) ? summary : {};
    const detailData = isPlainObject(detail) ? detail : {};
    const displayName = getDisplayName(summaryData[K.roleName] || detailData[K.roleName], nameHint);
    const built = !!(
      summaryData[K.built]
      || detailData[K.built]
      || displayName
      || Object.keys(summaryData).length
      || Object.keys(detailData).length
    );
    if (!built || !displayName) return null;
    return {
      slot: slot || displayName,
      summary: summaryData,
      detail: detailData,
      name: displayName,
      source: source || 'unknown',
    };
  }

  function mergeCharacterRow(map, name, slot, summary, detail, source) {
    const row = normalizeCharacterRow(name, slot, summary, detail, source);
    if (!row) return;

    const key = row.slot || row.name;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, row);
      return;
    }

    map.set(key, {
      slot: existing.slot || row.slot,
      name: existing.name || row.name,
      source: existing.source || row.source,
      summary: Object.assign({}, row.summary, existing.summary),
      detail: Object.assign({}, row.detail, existing.detail),
    });
  }

  function collectDynamicRows(stat, map, containerKey, source) {
    const container = get(stat, [containerKey], {});
    if (!isPlainObject(container)) return;

    Object.entries(container).forEach(([key, value]) => {
      if (!isPlainObject(value) || isSlotKey(key)) return;

      if (containerKey === K.roleIndex) {
        const summary = value;
        const detail = get(stat, [K.roleDetail, key], get(stat, [K.compatRole, key], {}));
        mergeCharacterRow(map, key, key, summary, detail, source);
        return;
      }

      const detail = value;
      const summary = get(stat, [K.roleIndex, key], {});
      mergeCharacterRow(map, key, key, summary, detail, source);
    });
  }

  function getCharacterRows(stat) {
    const rows = new Map();

    for (const slot of SLOT_NAMES) {
      const summary = getSummarySlot(stat, slot);
      const detail = getDetailSlot(stat, slot);
      mergeCharacterRow(rows, '', slot, summary, detail, 'fixed-slot');
    }

    collectDynamicRows(stat, rows, K.roleIndex, 'dynamic-index');
    collectDynamicRows(stat, rows, K.roleDetail, 'dynamic-detail');
    collectDynamicRows(stat, rows, K.compatRole, 'dynamic-compat');

    return Array.from(rows.values());
  }

  function renderOverview(stat) {
    const world = get(stat, [K.world], {});
    const player = get(stat, [K.player], {});
    const account = get(stat, [K.forum, K.account], {});

    return [
      section(
        '\u6982\u89c8',
        '\u5b9e\u65f6',
        `<div class="grid">`
          + `<div><div class="label">\u65f6\u95f4</div><div class="value">${text(formatTime(stat), '\u672a\u540c\u6b65')}</div></div>`
          + `<div><div class="label">\u5730\u70b9</div><div class="value">${text(world[K.place], '\u7535\u8111\u684c\u524d')}</div></div>`
          + `<div><div class="label">\u91d1\u94b1</div><div class="value">${Number(player[K.money] || 0).toLocaleString()}</div></div>`
          + `<div><div class="label">\u79ef\u5206</div><div class="value">${Number(account[K.points] || 0).toLocaleString()}</div></div>`
          + `<div><div class="label">\u4f53\u529b</div><div class="value">${text(player[K.energy], '\u5145\u6c9b')}</div></div>`
          + `<div><div class="label">\u72b6\u6001</div><div class="value">${text(player[K.arousal], '\u672a\u542f\u7528')} / ${text(player[K.release], '\u672a\u542f\u7528')}</div></div>`
        + `</div>`
      ),
      section(
        '\u5feb\u6377\u64cd\u4f5c',
        '\u586b\u5165\u8f93\u5165\u680f',
        `<div class="pill-row">`
          + `<button class="action" data-fill="\u5237\u65b0\u8bba\u575b\u9996\u9875">\u5237\u65b0\u8bba\u575b\u9996\u9875</button>`
          + `<button class="action" data-fill="\u67e5\u770b\u6211\u7684\u8bba\u575b\u8d26\u6237">\u67e5\u770b\u6211\u7684\u8bba\u575b\u8d26\u6237</button>`
          + `<button class="action" data-fill="\u6d4f\u89c8\u9ed1\u6599\u5e02\u573a">\u6d4f\u89c8\u9ed1\u6599\u5e02\u573a</button>`
          + `<button class="action" data-fill="\u67e5\u770b\u5df2\u8d2d\u9ed1\u6599">\u67e5\u770b\u5df2\u8d2d\u9ed1\u6599</button>`
          + `<button class="action" data-fill="\u67e5\u770b\u53ef\u8d2d\u4e70\u670d\u52a1">\u67e5\u770b\u53ef\u8d2d\u4e70\u670d\u52a1</button>`
        + `</div>`
      ),
    ].join('');
  }

  function renderChars(stat) {
    const rows = getCharacterRows(stat);
    const total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (state.charPage > total - 1) state.charPage = total - 1;
    const current = rows.slice(state.charPage * PAGE_SIZE, state.charPage * PAGE_SIZE + PAGE_SIZE);

    let body = '';
    if (!current.length) {
      body = '<div class="empty">\u5f53\u524d\u6ca1\u6709\u89d2\u8272\u6863\u6848</div>';
    } else {
      body = current.map((row) => {
        const social = get(row.detail, [K.social], {});
        const physical = get(row.detail, [K.body], {});
        const isOpen = state.expandedSlot === row.slot ? 'open' : '';
        const displayTitle = row.summary[K.publicTitle] || get(row.detail, [K.realIdentity, K.publicTitle], '');

        return `<div class="char">`
          + `<div class="char-head" data-slot="${row.slot}">`
          + `<div><div class="char-name">${row.name}</div><div class="char-sub">${text(displayTitle, '\u70b9\u51fb\u5c55\u5f00\u8be6\u60c5')}</div></div>`
          + `<span class="badge">${row.summary[K.inScene] ? '\u5728\u573a' : '\u79bb\u573a'}</span>`
          + `</div>`
          + `<div class="char-detail ${isOpen}">`
          + `<div class="grid">`
          + `<div><div class="label">\u5173\u7cfb\u6027\u8d28</div><div class="value">${text(row.summary[K.relationNature] || social[K.relationNature])}</div></div>`
          + `<div><div class="label">\u60c5\u611f\u6df1\u5ea6</div><div class="value">${text(row.summary[K.emotionDepth] || social[K.emotionDepth])}</div></div>`
          + `<div><div class="label">\u751f\u6d3b\u6e17\u900f\u5ea6</div><div class="value">${text(row.summary[K.lifePenetration] || social[K.lifePenetration])}</div></div>`
          + `<div><div class="label">\u4eb2\u5bc6\u7a0b\u5ea6</div><div class="value">${text(row.summary[K.intimacy] || physical[K.intimacy])}</div></div>`
          + `<div><div class="label">\u8ba4\u8bc6\u6e20\u9053</div><div class="value">${text(social[K.channel])}</div></div>`
          + `<div><div class="label">\u6700\u8fd1\u66f4\u65b0</div><div class="value">${text(row.summary[K.lastUpdate])}</div></div>`
          + `</div>`
          + `<div class="pill-row" style="margin-top:10px;">`
          + `<button class="action" data-fill="\u67e5\u770b${row.name}\u7684\u8be6\u7ec6\u6863\u6848">\u67e5\u770b\u8be6\u7ec6\u6863\u6848</button>`
          + `<button class="action" data-fill="\u7ed9${row.name}\u53d1\u9001\u79c1\u4fe1\uff1a">\u79c1\u4fe1</button>`
          + `</div>`
          + `</div>`
          + `</div>`;
      }).join('');
    }

    return section('\u89d2\u8272', String(rows.length), body + pager('char', state.charPage, total));
  }

  function renderForum(stat) {
    const zoneMap = get(stat, [K.forum, K.zoneMap], {}) || {};
    const zones = Object.keys(zoneMap);
    if (!state.currentZone || !zones.includes(state.currentZone)) {
      state.currentZone = get(stat, [K.forum, K.currentZone], zones[0] || '');
    }

    const postsObject = get(stat, [K.forum, K.zoneMap, state.currentZone, K.posts], {}) || {};
    const posts = Object.values(postsObject);
    const total = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
    if (state.postPage > total - 1) state.postPage = total - 1;
    const current = posts.slice(state.postPage * PAGE_SIZE, state.postPage * PAGE_SIZE + PAGE_SIZE);

    let zoneButtons = '<span class="empty" style="padding:0;">\u6682\u65e0\u5206\u533a\u6570\u636e</span>';
    if (zones.length) {
      zoneButtons = zones.map((zone) => {
        const activeStyle = zone === state.currentZone
          ? 'border-color:#66b5ff;color:#66b5ff;background:rgba(44,114,185,.18);'
          : '';
        return `<button class="pill" data-zone="${zone}" style="${activeStyle}">${zone}</button>`;
      }).join('');
    }

    let list = '<div class="empty">\u5f53\u524d\u5206\u533a\u6ca1\u6709\u5e16\u5b50</div>';
    if (current.length) {
      list = current.map((post) => {
        const postTitle = text(post[K.title], '\u672a\u547d\u540d\u5e16\u5b50');
        return `<div class="char">`
          + `<div class="label">\u6807\u9898</div><div class="value">${postTitle}</div>`
          + `<div class="label" style="margin-top:6px;">\u53d1\u5e16\u4eba</div><div class="value">${text(post[K.author], '\u533f\u540d')}</div>`
          + `<div class="label" style="margin-top:6px;">\u70ed\u5ea6</div><div class="value">${text(post[K.hotness], 0)}</div>`
          + `<div class="pill-row" style="margin-top:10px;"><button class="action" data-fill="\u67e5\u770b\u5e16\u5b50\uff1a${postTitle}">\u67e5\u770b\u5e16\u5b50</button></div>`
          + `</div>`;
      }).join('');
    }

    return section(
      '\u8bba\u575b',
      text(state.currentZone, '\u6682\u65e0'),
      `<div class="pill-row" style="margin-bottom:10px;">${zoneButtons}<button class="action" data-fill="\u5237\u65b0\u3010${text(state.currentZone, '\u8bba\u575b')}\u3011\u5e16\u5b50">\u5237\u65b0</button></div>${list}${pager('post', state.postPage, total)}`
    );
  }

  function renderAccount(stat) {
    const account = get(stat, [K.forum, K.account], {});
    const services = get(stat, [K.forum, K.services], {}) || {};
    const entries = Object.entries(services);

    const accountBody = `<div class="grid">`
      + `<div><div class="label">\u7528\u6237\u540d</div><div class="value">${text(account[K.username], '\u6e38\u5ba2')}</div></div>`
      + `<div><div class="label">\u7b49\u7ea7</div><div class="value">${text(account[K.level], 'L1 \u6f5c\u6c34\u5458')}</div></div>`
      + `<div><div class="label">\u79ef\u5206</div><div class="value">${Number(account[K.points] || 0).toLocaleString()}</div></div>`
      + `<div><div class="label">\u5df2\u8d2d\u9ed1\u6599</div><div class="value">${Object.keys(account[K.boughtMaterial] || {}).length}</div></div>`
      + `</div>`
      + `<div class="pill-row" style="margin-top:10px;">`
      + `<button class="action" data-fill="\u67e5\u770b\u6211\u7684\u8bba\u575b\u8d26\u6237">\u67e5\u770b\u8d26\u6237\u8be6\u60c5</button>`
      + `<button class="action" data-fill="\u6d4f\u89c8\u9ed1\u6599\u5e02\u573a">\u9ed1\u6599\u5e02\u573a</button>`
      + `</div>`;

    let serviceBody = '<div class="empty">\u6682\u65e0\u670d\u52a1</div>';
    if (entries.length) {
      serviceBody = entries.map(([name, item]) => {
        return `<div class="char">`
          + `<div class="label">\u9879\u76ee</div><div class="value">${name}</div>`
          + `<div class="label" style="margin-top:6px;">\u4ef7\u683c</div><div class="value">${text(item[K.price])}</div>`
          + `<div class="label" style="margin-top:6px;">\u63cf\u8ff0</div><div class="value">${text(item[K.desc])}</div>`
          + `<div class="pill-row" style="margin-top:10px;"><button class="action" data-fill="\u8d2d\u4e70\u670d\u52a1\uff1a${name}">\u8d2d\u4e70\u670d\u52a1</button></div>`
          + `</div>`;
      }).join('');
    }

    return section('\u8d26\u6237', text(account[K.level], '\u6e38\u5ba2'), accountBody)
      + section('\u670d\u52a1', String(entries.length), serviceBody);
  }

  async function render() {
    const stat = await getStatData();
    document.querySelectorAll('.tab').forEach((button) => {
      button.classList.toggle('active', button.dataset.tab === state.tab);
    });

    const meta = `${text(formatTime(stat), '\u672a\u540c\u6b65')}<br>${text(get(stat, [K.world, K.place], '\u7535\u8111\u684c\u524d'))}`;
    document.getElementById('meta').innerHTML = meta;

    let html = '';
    if (state.tab === 'chars') html = renderChars(stat);
    else if (state.tab === 'forum') html = renderForum(stat);
    else if (state.tab === 'account') html = renderAccount(stat);
    else html = renderOverview(stat);

    if (state.debug && !Object.keys(stat || {}).length) {
      html += `<div class="debug">\u72b6\u6001\u680f\u8c03\u8bd5\uff1a${state.debug}</div>`;
    }

    document.getElementById('content').innerHTML = html;
  }

  document.addEventListener('click', async function (event) {
    const tab = event.target.closest('[data-tab]');
    if (tab) {
      state.tab = tab.dataset.tab;
      await render();
      return;
    }

    const fill = event.target.closest('[data-fill]');
    if (fill) {
      await setInput(fill.dataset.fill);
      return;
    }

    const zone = event.target.closest('[data-zone]');
    if (zone) {
      state.currentZone = zone.dataset.zone;
      state.postPage = 0;
      await render();
      return;
    }

    const slot = event.target.closest('[data-slot]');
    if (slot) {
      state.expandedSlot = state.expandedSlot === slot.dataset.slot ? '' : slot.dataset.slot;
      await render();
      return;
    }

    const action = event.target.closest('[data-action]');
    if (!action) return;

    switch (action.dataset.action) {
      case 'char-prev':
        if (state.charPage > 0) state.charPage -= 1;
        break;
      case 'char-next':
        state.charPage += 1;
        break;
      case 'post-prev':
        if (state.postPage > 0) state.postPage -= 1;
        break;
      case 'post-next':
        state.postPage += 1;
        break;
      default:
        break;
    }

    await render();
  });

  setTimeout(render, 0);
  setTimeout(render, 350);
  setTimeout(render, 1200);
  setInterval(render, 2000);
})();
