(function () {
  const state = {
    tab: 'overview',
    charPage: 0,
    postPage: 0,
    selectedCharKey: '',
    selectedCharTab: 'summary',
    currentZone: '',
    debug: '',
  };

  const PAGE_SIZE = 4;
  const SLOT_NAMES = ['档案1', '档案2', '档案3', '档案4'];
  const UNKNOWN = '未知';
  const K = {
    world: '世界',
    time: '详细时间',
    year: '年',
    month: '月',
    day: '日',
    hour: '时',
    minute: '分',
    week: '星期',
    place: '地点',
    player: '主角',
    money: '金钱',
    energy: '体力',
    arousal: '勃起状态',
    release: '射精阈值',
    forum: '暗网论坛',
    account: '我的账户',
    username: '用户名',
    level: '等级',
    points: '积分',
    boughtMaterial: '已购黑料',
    boughtService: '已购服务',
    zoneMap: '分区数据',
    currentZone: '当前分区',
    posts: '帖子列表',
    services: '服务商店',
    title: '标题',
    author: '发帖人',
    hotness: '热度',
    roleIndex: '角色索引',
    roleDetail: '角色详情',
    compatRole: '女角色档案',
    roleName: '角色名',
    built: '是否已建档',
    inScene: '当前是否在场',
    publicTitle: '公开头衔',
    relationNature: '关系性质',
    emotionDepth: '情感深度',
    lifePenetration: '生活渗透度',
    intimacy: '亲密程度',
    lastUpdate: '最近更新',
    realIdentity: '现实身份',
    social: '社交与从属',
    outfit: '服装',
    body: '身体数据',
    mind: '心理与状态',
    sex: '性向数据',
    channel: '认识渠道',
    price: '价格',
    desc: '描述',
    visible: '视线内对象',
    currentObservation: '当前观察',
    face: '面貌',
    hair: '发型发色',
    accessory: '配饰',
    top: '上衣',
    bottom: '下装',
    age: '年龄',
    height: '身高',
    weight: '体重',
    bodyType: '身材类型',
    visibleTraits: '外观可见特征',
    bustWaistHip: '三围',
    cup: '罩杯',
    privates: '私处',
    pubicHair: '阴毛',
    labia: '阴唇',
    color: '颜色',
    holeState: '双穴状态',
    development: '身体开发等级',
    bodyFlaw: '身体缺陷',
    requiredFlaw: '必选项',
    commonFlaw: '常见项',
    randomFlaw: '随机项',
    personality: '角色性格',
    mood: '心情值',
    changeReason: '变化原因',
    coordinate: '认知坐标',
    favor: '好感度',
    openness: '开放度',
    sexualExperience: '性经验',
    sexualAttitude: '性态度',
    sexualOpenLevel: '性开放程度',
    libido: '性欲程度',
    fetishes: '性癖好',
    fetish: '性癖',
    adaptation: '形态适应度',
    forced: '强制放养',
    humiliation: '当面羞辱',
    deprivation: '彻底剥夺',
    degradation: '极限堕落',
    dependency: '病态依赖度',
    sourceMeta: '信息来源',
    sourceName: '信息来源',
    cognitionState: '认知状态',
    confirmed: '是否已确认',
    currentFeeling: '当前观感',
    recentBodyChange: '最近体态变化',
    styleTag: '风格标签',
    credibility: '可信度',
    contentSummary: '内容摘要',
  };

  function text(value, fallback) {
    const finalFallback = fallback === undefined ? '无' : fallback;
    return value === undefined || value === null || value === '' ? finalFallback : value;
  }

  function attr(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function get(obj, path, fallback) {
    let current = obj;
    for (const key of path) {
      if (current === undefined || current === null || typeof current !== 'object') return fallback;
      current = current[key];
    }
    return current === undefined ? fallback : current;
  }

  function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function normalizeStatData(value) {
    if (isPlainObject(value)) return value;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      return isPlainObject(parsed) ? parsed : null;
    } catch (error) {
      state.debug = `stat_data JSON parse failed: ${error.message || error}`;
      return null;
    }
  }

  function getMessageStatData(message) {
    const direct = normalizeStatData(get(message, ['data', 'stat_data'], null));
    if (direct) return direct;

    const variables = Array.isArray(message && message.variables) ? message.variables : [];
    for (let i = variables.length - 1; i >= 0; i -= 1) {
      const stat = normalizeStatData(get(variables[i], ['stat_data'], null));
      if (stat) return stat;
    }

    return null;
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
    if (setDomInput(textValue)) return true;

    const ctx = getContext();
    if (ctx && typeof ctx.executeSlashCommands === 'function') {
      try {
        await ctx.executeSlashCommands(`/setinput ${textValue}`);
        const hostDocument = getHostDocument();
        const textarea = hostDocument.querySelector('#send_textarea');
        if (textarea && String(textarea.value || '').trim()) return true;
      } catch (error) {}
    }
    return false;
  }

  async function getStatData() {
    const ctx = getContext();

    try {
      if (typeof window.getCurrentMessageId === 'function' && typeof window.getChatMessages === 'function') {
        const currentId = window.getCurrentMessageId();
        const messages = await window.getChatMessages(currentId);
        const stat = getMessageStatData(messages && messages[0]);
        if (stat) {
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
        const stat = normalizeStatData(get(all, ['stat_data'], null));
        if (stat) {
          state.debug = '';
          return stat;
        }
      }
    } catch (error) {
      state.debug = `getAllVariables failed: ${error.message || error}`;
    }

    try {
      if (ctx && ctx.variables && ctx.variables.local && typeof ctx.variables.local.get === 'function') {
        const stat = normalizeStatData(ctx.variables.local.get('stat_data'));
        if (stat) {
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
    if (!time || time[K.year] === undefined) return '未同步';
    const pad = (value) => String(value || 0).padStart(2, '0');
    return `${time[K.year]}-${pad(time[K.month])}-${pad(time[K.day])} ${pad(time[K.hour])}:${pad(time[K.minute])} ${text(time[K.week], '')}`.trim();
  }

  function section(title, badge, body) {
    return `<section class="section"><div class="section-head"><span>${title}</span><span class="badge">${badge}</span></div>${body}</section>`;
  }

  function pager(kind, pageIndex, total) {
    return `<div class="pager">`
      + `<button class="action" data-action="${kind}-prev" ${pageIndex <= 0 ? 'disabled' : ''}>上一页</button>`
      + `<span>${pageIndex + 1} / ${total}</span>`
      + `<button class="action" data-action="${kind}-next" ${pageIndex >= total - 1 ? 'disabled' : ''}>下一页</button>`
      + `</div>`;
  }

  function isSlotKey(key) {
    return SLOT_NAMES.includes(key);
  }

  function getDisplayName(rawName, fallbackName) {
    return rawName || fallbackName || '';
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
      } else {
        const detail = value;
        const summary = get(stat, [K.roleIndex, key], {});
        mergeCharacterRow(map, key, key, summary, detail, source);
      }
    });
  }

  function getCharacterRows(stat) {
    const rows = new Map();

    for (const slot of SLOT_NAMES) {
      mergeCharacterRow(rows, '', slot, getSummarySlot(stat, slot), getDetailSlot(stat, slot), 'fixed-slot');
    }

    collectDynamicRows(stat, rows, K.roleIndex, 'dynamic-index');
    collectDynamicRows(stat, rows, K.roleDetail, 'dynamic-detail');
    collectDynamicRows(stat, rows, K.compatRole, 'dynamic-compat');

    return Array.from(rows.values());
  }

  function field(label, value, tone) {
    const className = tone ? ` ${tone}` : '';
    return `<div><div class="label">${label}</div><div class="value${className}">${text(value, UNKNOWN)}</div></div>`;
  }

  function detailField(label, value, tone, note) {
    const className = tone ? ` ${tone}` : '';
    const noteHtml = note ? `<div class="field-note">${note}</div>` : '';
    return `<div><div class="label">${label}</div><div class="value${className}">${text(value, UNKNOWN)}</div>${noteHtml}</div>`;
  }

  function getSourceMeta(detail, key) {
    const meta = get(detail, [K.sourceMeta, key], null);
    if (!meta || typeof meta !== 'object') return null;
    const source = text(meta[K.sourceName], '');
    const cognition = text(meta[K.cognitionState], '');
    const confirmed = meta[K.confirmed] === true ? '已确认' : (meta[K.confirmed] === false ? '未证实' : '');
    const parts = [source, cognition, confirmed].filter(Boolean);
    return parts.length ? parts.join(' · ') : null;
  }

  function joinList(value) {
    if (Array.isArray(value)) return value.length ? value.join('、') : UNKNOWN;
    if (isPlainObject(value)) {
      const entries = Object.entries(value).filter(([, v]) => v !== undefined && v !== null && v !== '');
      return entries.length ? entries.map(([k, v]) => `${k}：${v}`).join('；') : UNKNOWN;
    }
    return text(value, UNKNOWN);
  }

  function renderOverview(stat) {
    const world = get(stat, [K.world], {});
    const player = get(stat, [K.player], {});
    const account = get(stat, [K.forum, K.account], {});

    return [
      section(
        '概览',
        '实时',
        `<div class="grid">`
          + field('时间', formatTime(stat), false)
          + field('地点', world[K.place] || '电脑桌前', false)
          + field('金钱', Number(player[K.money] || 0).toLocaleString(), false)
          + field('积分', Number(account[K.points] || 0).toLocaleString(), false)
          + field('体力', player[K.energy] || '充沛', false)
          + field('状态', `${text(player[K.arousal], '未启用')} / ${text(player[K.release], '未启用')}`, false)
        + `</div>`
      ),
      section(
        '快捷操作',
        '填入输入栏',
        `<div class="pill-row">`
          + `<button class="action" data-fill="打开论坛主页">打开论坛主页</button>`
          + `<button class="action" data-fill="查看论坛私信">查看论坛私信</button>`
          + `<button class="action" data-fill="查看我的论坛账户">查看我的论坛账户</button>`
          + `<button class="action" data-fill="浏览黑料市场">浏览黑料市场</button>`
          + `<button class="action" data-fill="查看已购黑料">查看已购黑料</button>`
          + `<button class="action" data-fill="查看可购买服务">查看可购买服务</button>`
        + `</div>`
      ),
    ].join('');
  }

  function renderVisible(stat) {
    const visible = get(stat, [K.visible], {}) || {};
    const visibleRows = Object.entries(visible).filter(([, value]) => isPlainObject(value));
    const allChars = getCharacterRows(stat);
    const presentChars = allChars.filter((row) => {
      const value = row.summary[K.inScene] ?? row.detail[K.inScene];
      return value === true || String(value).toLowerCase() === 'true' || value === '在场';
    });

    let html = '';

    if (!visibleRows.length && !presentChars.length) {
      return section('在场角色', '0', '<div class="empty">当前没有在场或视线内可观察角色</div>');
    }

    if (presentChars.length) {
      const pBody = presentChars.map(row => {
        const displayTitle = row.summary[K.publicTitle] || get(row.detail, [K.realIdentity, K.publicTitle], '');
        const social = get(row.detail, [K.social], {});
        const bodyData = get(row.detail, [K.body], {});
        const outfit = get(row.detail, [K.outfit], {}) || {};
        return `<div class="char">
          <div class="char-head">
            <div><div class="char-name">${row.name}</div><div class="char-sub">${text(displayTitle, '档案角色')}</div></div>
            <span class="badge">在场</span>
          </div>
          <div class="grid" style="margin-top:10px;">
            ${field('关系性质', row.summary[K.relationNature] || social[K.relationNature], false)}
            ${field('情感深度', row.summary[K.emotionDepth] || social[K.emotionDepth] || get(row.detail, [K.mind, K.emotionDepth]), false)}
            ${field('亲密程度', row.summary[K.intimacy] || bodyData[K.intimacy], false)}
            ${field('最近更新', row.summary[K.lastUpdate] || row.detail[K.lastUpdate], false)}
            ${field('当前观察', bodyData[K.currentFeeling] || row.summary[K.lastUpdate] || '当前在场，暂无观察短句', false)}
            ${field('上衣', outfit[K.top] || outfit['上衣'], false)}
            ${field('下装', outfit[K.bottom] || outfit['下装'], false)}
            ${field('配饰', outfit[K.accessory] || outfit['配饰'], false)}
          </div>
        </div>`;
      }).join('');
      html += section('已知在场角色', String(presentChars.length), pBody);
    }

    if (visibleRows.length) {
      const vBody = visibleRows.map(([name, value]) => {
        return `<div class="char">
          <div class="char-name">${text(name, '未命名角色')}</div>
          <div class="char-sub">${text(value[K.currentObservation], '当前看到的外观层')}</div>
          <div class="grid" style="margin-top:10px;">
            ${field('面貌', value[K.face], false)}
            ${field('发型发色', value[K.hair], false)}
            ${field('配饰', value[K.accessory], false)}
            ${field('上衣', value[K.top], false)}
            ${field('下装', value[K.bottom], false)}
          </div>
        </div>`;
      }).join('');
      html += section('视线内对象', String(visibleRows.length), vBody);
    }

    return html;
  }

  function renderCharList(stat) {
    const rows = getCharacterRows(stat);
    const total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (state.charPage > total - 1) state.charPage = total - 1;
    const current = rows.slice(state.charPage * PAGE_SIZE, state.charPage * PAGE_SIZE + PAGE_SIZE);

    let body = '';
    if (!current.length) {
      body = '<div class="empty">当前没有角色档案</div>';
    } else {
      body = current.map((row) => {
        const social = get(row.detail, [K.social], {});
        const bodyData = get(row.detail, [K.body], {});
        const displayTitle = row.summary[K.publicTitle] || get(row.detail, [K.realIdentity, K.publicTitle], '');

        return `<div class="char">`
          + `<div class="char-head">`
          + `<div><div class="char-name">${row.name}</div><div class="char-sub">${text(displayTitle, '可查看详细档案')}</div></div>`
          + `<span class="badge">${(String(row.summary[K.inScene] ?? row.detail[K.inScene]).toLowerCase() === "true") ? '在场' : '离场'}</span>`
          + `</div>`
          + `<div class="grid" style="margin-top:10px;">`
          + field('关系性质', row.summary[K.relationNature] || social[K.relationNature], false)
          + field('情感深度', row.summary[K.emotionDepth] || social[K.emotionDepth] || get(row.detail, [K.mind, K.emotionDepth]), false)
          + field('生活渗透度', row.summary[K.lifePenetration] || social[K.lifePenetration], false)
          + field('亲密程度', row.summary[K.intimacy] || bodyData[K.intimacy], false)
          + field('认识渠道', social[K.channel], false)
          + field('最近更新', row.summary[K.lastUpdate] || row.detail[K.lastUpdate], false)
          + `</div>`
          + `<div class="pill-row" style="margin-top:10px;">`
          + `<button class="action" data-action="open-char-detail" data-slot="${row.slot}">查看详细档案</button>`
          + `<button class="action" data-fill="${attr(`给${row.name}发送私信：`)}">私信</button>`
          + `</div>`
          + `</div>`;
      }).join('');
    }

    return section('角色', String(rows.length), body + pager('char', state.charPage, total));
  }

  function bodyDisplayRows(detail) {
    const bodyData = get(detail, [K.body], {}) || {};
    const known = [
      ['年龄', bodyData[K.age], null],
      ['身高', bodyData[K.height] ? `${bodyData[K.height]} cm` : undefined, null],
      ['体重', bodyData[K.weight] ? `${bodyData[K.weight]} kg` : undefined, getSourceMeta(detail, '体重')],
      ['身材类型', bodyData[K.bodyType], getSourceMeta(detail, '身材类型')],
      ['外观可见特征', bodyData[K.visibleTraits], getSourceMeta(detail, '外观可见特征')],
    ];

    const inferred = [
      ['三围', bodyData[K.bustWaistHip] || '可推测', getSourceMeta(detail, '三围') || '来源：主观推测'],
      ['罩杯', bodyData[K.cup] || '可推测', getSourceMeta(detail, '罩杯') || '来源：主观推测'],
    ];

    const unknown = [
      ['私处', UNKNOWN, null],
      ['身体缺陷', UNKNOWN, null],
      ['身体开发等级', UNKNOWN, null],
      ['亲密程度', UNKNOWN, null],
    ];

    const knownHtml = known.map(([label, value, note]) => detailField(label, value, 'known-value', note)).join('');
    const inferredHtml = inferred.map(([label, value, note]) => detailField(label, value, 'inferred-value', note)).join('');
    const unknownHtml = unknown.map(([label, value, note]) => detailField(label, value, 'unknown-value', note)).join('');

    return {
      knownHtml,
      inferredHtml,
      unknownHtml,
    };
  }

  function statusDisplayRows(detail) {
    const mind = get(detail, [K.mind], {}) || {};
    const sex = get(detail, [K.sex], {}) || {};
    const social = get(detail, [K.social], {}) || {};

    const known = [
      ['情感深度', mind[K.emotionDepth] || social[K.emotionDepth], getSourceMeta(detail, '情感深度')],
      ['最近更新', detail[K.lastUpdate], null],
    ];

    const inferred = [
      ['性态度', sex[K.sexualAttitude] || '可推测', getSourceMeta(detail, '性态度') || '来源：主观推测'],
      ['性开放程度', sex[K.sexualOpenLevel] || '可推测', getSourceMeta(detail, '性开放程度') || '来源：主观推测'],
      ['性欲', sex[K.libido] || '可推测', getSourceMeta(detail, '性欲程度') || '来源：主观推测'],
      ['好感度', mind[K.favor] === undefined ? '可推测' : '可推测', getSourceMeta(detail, '好感度') || '来源：长期互动推测'],
    ];

    const unknown = [
      ['性经验', UNKNOWN, null],
      ['性癖好', UNKNOWN, null],
      ['性癖', UNKNOWN, null],
      ['开放度', UNKNOWN, null],
      ['形态适应度', UNKNOWN, null],
      ['病态依赖度', UNKNOWN, null],
    ];

    return {
      knownHtml: known.map(([label, value, note]) => detailField(label, value, 'known-value', note)).join(''),
      inferredHtml: inferred.map(([label, value, note]) => detailField(label, value, 'inferred-value', note)).join(''),
      unknownHtml: unknown.map(([label, value, note]) => detailField(label, value, 'unknown-value', note)).join(''),
    };
  }

  function renderCharDetail(stat) {
    const rows = getCharacterRows(stat);
    const row = rows.find((item) => item.slot === state.selectedCharKey || item.name === state.selectedCharKey);
    if (!row) {
      state.selectedCharKey = '';
      return renderCharList(stat);
    }

    const detail = row.detail || {};
    const social = get(detail, [K.social], {});
    const realIdentity = get(detail, [K.realIdentity], {});
    const bodyData = get(detail, [K.body], {});
    const summaryTab = `<div class="grid">`
      + detailField('角色名', row.name, false, null)
      + detailField('公开头衔', row.summary[K.publicTitle] || realIdentity[K.publicTitle], false, getSourceMeta(detail, '公开头衔'))
      + detailField('关系性质', row.summary[K.relationNature] || social[K.relationNature], false, getSourceMeta(detail, '关系性质'))
      + detailField('情感深度', row.summary[K.emotionDepth] || social[K.emotionDepth] || get(detail, [K.mind, K.emotionDepth]), false, getSourceMeta(detail, '情感深度'))
      + detailField('生活渗透度', row.summary[K.lifePenetration] || social[K.lifePenetration], false, getSourceMeta(detail, '生活渗透度'))
      + detailField('亲密程度', row.summary[K.intimacy] || bodyData[K.intimacy], false, getSourceMeta(detail, '亲密程度'))
      + detailField('认识渠道', social[K.channel], false, getSourceMeta(detail, '认识渠道'))
      + detailField('最近更新', row.summary[K.lastUpdate] || detail[K.lastUpdate], false, null)
        + `</div>`;

    const bodyRows = bodyDisplayRows(detail);
    const statusRows = statusDisplayRows(detail);

    let detailBody = summaryTab;
    let badge = '摘要';
    if (state.selectedCharTab === 'body') {
      badge = '已知 / 可推测 / 未知';
      detailBody = `<div class="notice">身体页分成三级：已知表示当前合理可知；可推测表示可以从外观粗略判断；未知表示底层变量存在，但当前不该直接得知。</div>`
        + `<div class="notice">当前观感：${text(bodyData[K.currentFeeling], '暂无明显变化')}｜最近体态变化：${text(bodyData[K.recentBodyChange], '暂无')}</div>`
        + `<div class="grid">${bodyRows.knownHtml}${bodyRows.inferredHtml}${bodyRows.unknownHtml}</div>`;
    } else if (state.selectedCharTab === 'status') {
      badge = '已知 / 可推测 / 未知';
      detailBody = `<div class="notice">性向与状态页分成三级：已知为当前互动中能确认的内容；可推测为能从相处气质中猜到的倾向；未知则继续遮罩。</div>`
        + `<div class="notice">变化原因：${text(get(detail, [K.mind, K.changeReason], ''), '暂无明确触发')}</div>`
        + `<div class="grid">${statusRows.knownHtml}${statusRows.inferredHtml}${statusRows.unknownHtml}</div>`;
    }

    return section(
      `角色详情 · ${row.name}`,
      badge,
      `<div class="pill-row" style="margin-bottom:10px;">`
        + `<button class="action" data-action="back-char-list">返回角色列表</button>`
        + `<button class="action detail-tab${state.selectedCharTab === 'summary' ? ' active-detail-tab' : ''}" data-action="char-tab-summary">摘要</button>`
        + `<button class="action detail-tab${state.selectedCharTab === 'body' ? ' active-detail-tab' : ''}" data-action="char-tab-body">身体数据</button>`
        + `<button class="action detail-tab${state.selectedCharTab === 'status' ? ' active-detail-tab' : ''}" data-action="char-tab-status">性向/状态</button>`
      + `</div>`
      + detailBody
    );
  }

  function renderChars(stat) {
    if (state.selectedCharKey) return renderCharDetail(stat);
    return renderCharList(stat);
  }

  function renderForum(stat) {
    const zoneMap = get(stat, [K.forum, K.zoneMap], {}) || {};
    const zones = Object.keys(zoneMap);
    const currentZone = get(stat, [K.forum, K.currentZone], zones[0] || '未进入');
    const account = get(stat, [K.forum, K.account], {});
    const unreadPm = Number(get(stat, ['论坛状态', '未读私信'], 0) || 0);
    const hotSummary = get(stat, ['论坛状态', '热帖摘要'], '');
    const pageState = get(stat, ['论坛状态', '当前页面'], '未打开');
    const zoneSummary = zones.length
      ? zones.slice(0, 4).map((zone) => {
        const posts = get(stat, [K.forum, K.zoneMap, zone, K.posts], {}) || {};
        const style = mapForumStyle(zone);
        return `<div class="mini-card"><div class="char-name">${zone}</div><div class="char-sub">${style.title} · ${Object.keys(posts).length} 条线索</div></div>`;
      }).join('')
      : '<div class="empty">暂无论坛分区摘要</div>';

    const body = `<div class="notice">论坛已从状态栏降级为通知与快捷入口。完整浏览、帖子详情和私信聊天会在独立页面中显示；论坛内容只代表传闻层，不会自动覆盖现实真值。</div>`
      + `<div class="grid">`
      + field('当前入口', pageState, false)
      + field('当前分区', currentZone, false)
      + field('未读私信', unreadPm, false)
      + field('账户等级', text(account[K.level], '游客'), false)
      + `</div>`
      + `<div class="notice">热帖摘要：${text(hotSummary, '暂无需要处理的论坛线索')}</div>`
      + `<div class="pill-row" style="margin-bottom:10px;">`
      + `<button class="action" data-fill="打开论坛主页">打开论坛主页</button>`
      + `<button class="action" data-fill="查看论坛私信">查看论坛私信</button>`
      + `<button class="action" data-fill="浏览黑料市场">浏览黑料市场</button>`
      + `</div>`
      + section('分区摘要', String(zones.length), zoneSummary);

    return section('论坛通知', unreadPm ? `${unreadPm} 未读` : '快捷入口', body);
  }

  function mapForumStyle(zone) {
    const mapping = {
      '约炮区': { title: '物色区', desc: '这里偏向筛选、试探与找入口。帖子不等于事实，更像打听渠道与交换条件。' },
      '文爱区': { title: '物色区', desc: '这里偏向试探、暧昧与筛选对象。语言更软，但仍属于传闻层与试探层。' },
      '淫妻区': { title: '炫耀区', desc: '这里偏向炫耀、展示与半真半假的战绩叙述，展示欲强，不必全信。' },
      '主仆区': { title: '交易/服务区', desc: '这里偏向规则、交换、任务与关系招募，语气更工具化。' },
      '视频图文区': { title: '爆料区', desc: '这里偏向片段、截图、偷拍视频与匿名爆料，是最典型的传闻层。' },
      '我的': { title: '账户/归档', desc: '这里是你的账户痕迹与浏览归档，不直接推进现实互动。' },
      '炫耀区': { title: '炫耀区', desc: '这里偏向炫耀、展示与半真半假的战绩叙述，展示欲强，不必全信。' },
      '爆料区': { title: '爆料区', desc: '这里偏向片段、截图、偷拍视频与匿名爆料，是最典型的传闻层。' },
      '物色区': { title: '物色区', desc: '这里偏向筛选、试探与找入口。帖子不等于事实，更像打听渠道与交换条件。' },
      '交易/服务区': { title: '交易/服务区', desc: '这里偏向规则、交换、任务与关系招募，语气更工具化。' },
    };
    return mapping[zone] || { title: '传闻层', desc: '论坛是外泄层、炫耀层与物色层，不应直接替代现实互动。' };
  }

  function renderAccount(stat) {
    const account = get(stat, [K.forum, K.account], {});
    const services = get(stat, [K.forum, K.services], {}) || {};
    const entries = Object.entries(services);

    const accountBody = `<div class="grid">`
      + field('用户名', account[K.username] || '游客', false)
      + field('等级', account[K.level] || 'L1 潜水员', false)
      + field('积分', Number(account[K.points] || 0).toLocaleString(), false)
      + field('已购黑料', Object.keys(account[K.boughtMaterial] || {}).length, false)
      + `</div>`
      + `<div class="pill-row" style="margin-top:10px;">`
      + `<button class="action" data-fill="查看我的论坛账户">查看账户详情</button>`
      + `<button class="action" data-fill="浏览黑料市场">黑料市场</button>`
      + `</div>`;

    let serviceBody = '<div class="empty">暂无服务</div>';
    if (entries.length) {
      serviceBody = entries.map(([name, item]) => {
        return `<div class="char">`
          + field('项目', name, false)
          + field('价格', item[K.price], false)
          + field('描述', item[K.desc], false)
          + `<div class="pill-row" style="margin-top:10px;"><button class="action" data-fill="${attr(`购买服务：${name}`)}">购买服务</button></div>`
          + `</div>`;
      }).join('');
    }

    return section('账户', text(account[K.level], '游客'), accountBody)
      + section('服务', String(entries.length), serviceBody);
  }

  async function render() {
    const stat = await getStatData();
    document.querySelectorAll('.tab').forEach((button) => {
      button.classList.toggle('active', button.dataset.tab === state.tab);
    });

    const meta = `${text(formatTime(stat), '未同步')}<br>${text(get(stat, [K.world, K.place], '电脑桌前'))}`;
    document.getElementById('meta').innerHTML = meta;

    let html = '';
    if (state.tab === 'present') html = renderVisible(stat);
    else if (state.tab === 'chars') html = renderChars(stat);
    else if (state.tab === 'forum') html = renderForum(stat);
    else if (state.tab === 'account') html = renderAccount(stat);
    else html = renderOverview(stat);

    if (state.debug && !Object.keys(stat || {}).length) {
      html += `<div class="debug">状态栏调试：${state.debug}</div>`;
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
      case 'open-char-detail':
        state.selectedCharKey = action.dataset.slot || '';
        state.selectedCharTab = 'summary';
        break;
      case 'back-char-list':
        state.selectedCharKey = '';
        state.selectedCharTab = 'summary';
        break;
      case 'char-tab-summary':
        state.selectedCharTab = 'summary';
        break;
      case 'char-tab-body':
        state.selectedCharTab = 'body';
        break;
      case 'char-tab-status':
        state.selectedCharTab = 'status';
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
