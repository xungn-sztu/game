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
    body: '身体数据',
    mind: '心理与状态',
    sex: '性向数据',
    channel: '认识渠道',
    price: '价格',
    desc: '描述',
    visible: '视线内对象',
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
  };

  function text(value, fallback) {
    const finalFallback = fallback === undefined ? '无' : fallback;
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

  function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
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

  function field(label, value, muted) {
    return `<div><div class="label">${label}</div><div class="value${muted ? ' muted-value' : ''}">${text(value, UNKNOWN)}</div></div>`;
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
          + `<button class="action" data-fill="刷新论坛首页">刷新论坛首页</button>`
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
    const rows = Object.entries(visible).filter(([, value]) => isPlainObject(value));
    if (!rows.length) {
      return section('在场角色', '观察层', '<div class="empty">当前视线内没有可观察角色</div>');
    }

    const body = rows.map(([name, value]) => {
      return `<div class="char">`
        + `<div class="char-name">${text(name, '未命名角色')}</div>`
        + `<div class="char-sub">当前看到的外观层，不等于完整档案</div>`
        + `<div class="grid" style="margin-top:10px;">`
        + field('面貌', value[K.face], false)
        + field('发型发色', value[K.hair], false)
        + field('配饰', value[K.accessory], false)
        + field('上衣', value[K.top], false)
        + field('下装', value[K.bottom], false)
        + `</div>`
        + `</div>`;
    }).join('');

    return section('在场角色', String(rows.length), body);
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
          + `<span class="badge">${row.summary[K.inScene] || row.detail[K.inScene] ? '在场' : '离场'}</span>`
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
          + `<button class="action" data-fill="给${row.name}发送私信：">私信</button>`
          + `</div>`
          + `</div>`;
      }).join('');
    }

    return section('角色', String(rows.length), body + pager('char', state.charPage, total));
  }

  function bodyDisplayRows(detail) {
    const bodyData = get(detail, [K.body], {}) || {};
    const direct = [
      ['年龄', bodyData[K.age]],
      ['身高', bodyData[K.height] ? `${bodyData[K.height]} cm` : undefined],
      ['体重', bodyData[K.weight] ? `${bodyData[K.weight]} kg` : undefined],
      ['身材类型', bodyData[K.bodyType]],
      ['外观可见特征', bodyData[K.visibleTraits]],
    ];

    const masked = [
      ['三围', UNKNOWN],
      ['罩杯', UNKNOWN],
      ['私处', UNKNOWN],
      ['身体缺陷', UNKNOWN],
      ['身体开发等级', UNKNOWN],
      ['亲密程度', UNKNOWN],
    ];

    const directHtml = direct.map(([label, value]) => field(label, value, false)).join('');
    const maskedHtml = masked.map(([label, value]) => field(label, value, true)).join('');

    return {
      directHtml,
      maskedHtml,
    };
  }

  function statusDisplayRows(detail) {
    const mind = get(detail, [K.mind], {}) || {};

    const direct = [
      ['情感深度', mind[K.emotionDepth] || get(detail, [K.social, K.emotionDepth]), false],
      ['最近更新', detail[K.lastUpdate], false],
    ];

    const masked = [
      ['性态度', UNKNOWN],
      ['性开放程度', UNKNOWN],
      ['性经验', UNKNOWN],
      ['性欲', UNKNOWN],
      ['性癖好', UNKNOWN],
      ['性癖', UNKNOWN],
      ['开放度', UNKNOWN],
      ['好感度', UNKNOWN],
      ['形态适应度', UNKNOWN],
      ['病态依赖度', UNKNOWN],
    ];

    return {
      directHtml: direct.map(([label, value]) => field(label, value, false)).join(''),
      maskedHtml: masked.map(([label, value]) => field(label, value, true)).join(''),
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
      + field('角色名', row.name, false)
      + field('公开头衔', row.summary[K.publicTitle] || realIdentity[K.publicTitle], false)
      + field('关系性质', row.summary[K.relationNature] || social[K.relationNature], false)
      + field('情感深度', row.summary[K.emotionDepth] || social[K.emotionDepth] || get(detail, [K.mind, K.emotionDepth]), false)
      + field('生活渗透度', row.summary[K.lifePenetration] || social[K.lifePenetration], false)
      + field('亲密程度', row.summary[K.intimacy] || bodyData[K.intimacy], false)
      + field('认识渠道', social[K.channel], false)
      + field('最近更新', row.summary[K.lastUpdate] || detail[K.lastUpdate], false)
      + `</div>`;

    const bodyRows = bodyDisplayRows(detail);
    const statusRows = statusDisplayRows(detail);

    let detailBody = summaryTab;
    let badge = '摘要';
    if (state.selectedCharTab === 'body') {
      badge = '当前可得认知';
      detailBody = `<div class="notice">身体页展示的是当前合理可知的信息；其余底层变量仍然保留，但此阶段统一显示为“未知”。</div>`
        + `<div class="grid">${bodyRows.directHtml}${bodyRows.maskedHtml}</div>`;
    } else if (state.selectedCharTab === 'status') {
      badge = '认知遮罩';
      detailBody = `<div class="notice">性向与心理状态默认不直接公开。只有当前可推断字段可见，其余保持“未知”。</div>`
        + `<div class="grid">${statusRows.directHtml}${statusRows.maskedHtml}</div>`;
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
    if (!state.currentZone || !zones.includes(state.currentZone)) {
      state.currentZone = get(stat, [K.forum, K.currentZone], zones[0] || '');
    }

    const postsObject = get(stat, [K.forum, K.zoneMap, state.currentZone, K.posts], {}) || {};
    const posts = Object.values(postsObject);
    const total = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
    if (state.postPage > total - 1) state.postPage = total - 1;
    const current = posts.slice(state.postPage * PAGE_SIZE, state.postPage * PAGE_SIZE + PAGE_SIZE);

    let zoneButtons = '<span class="empty" style="padding:0;">暂无分区数据</span>';
    if (zones.length) {
      zoneButtons = zones.map((zone) => {
        const activeStyle = zone === state.currentZone
          ? 'border-color:#66b5ff;color:#66b5ff;background:rgba(44,114,185,.18);'
          : '';
        return `<button class="pill" data-zone="${zone}" style="${activeStyle}">${zone}</button>`;
      }).join('');
    }

    let list = '<div class="empty">当前分区没有帖子</div>';
    if (current.length) {
      list = current.map((post) => {
        const postTitle = text(post[K.title], '未命名帖子');
        return `<div class="char">`
          + field('标题', postTitle, false)
          + field('发帖人', text(post[K.author], '匿名'), false)
          + field('热度', text(post[K.hotness], 0), false)
          + `<div class="pill-row" style="margin-top:10px;"><button class="action" data-fill="查看帖子：${postTitle}">查看帖子</button></div>`
          + `</div>`;
      }).join('');
    }

    return section(
      '论坛',
      text(state.currentZone, '暂无'),
      `<div class="pill-row" style="margin-bottom:10px;">${zoneButtons}<button class="action" data-fill="刷新【${text(state.currentZone, '论坛')}】帖子">刷新</button></div>${list}${pager('post', state.postPage, total)}`
    );
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
          + `<div class="pill-row" style="margin-top:10px;"><button class="action" data-fill="购买服务：${name}">购买服务</button></div>`
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
