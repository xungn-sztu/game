(() => {
  const U = {
    SLOT_NAMES: ["\u6863\u68481", "\u6863\u68482", "\u6863\u68483", "\u6863\u68484"],
    K: {
      world: "\u4e16\u754c",
      time: "\u65f6\u95f4",
      place: "\u5730\u70b9",
      detailTime: "\u8be6\u7ec6\u65f6\u95f4",
      player: "\u4e3b\u89d2",
      money: "\u91d1\u94b1",
      stamina: "\u4f53\u529b",
      charIndex: "\u89d2\u8272\u7d22\u5f15",
      charDetail: "\u89d2\u8272\u8be6\u60c5",
      femaleArchive: "\u5973\u89d2\u8272\u6863\u6848",
      forum: "\u6697\u7f51\u8bba\u575b",
      account: "\u6211\u7684\u8d26\u6237",
      zone: "\u5f53\u524d\u5206\u533a",
      points: "\u79ef\u5206",
      built: "\u662f\u5426\u5df2\u5efa\u6863",
      onSite: "\u5f53\u524d\u662f\u5426\u5728\u573a",
      name: "\u89d2\u8272\u540d",
      title: "\u516c\u5f00\u5934\u8854",
      relationNature: "\u5173\u7cfb\u6027\u8d28",
      relationDepth: "\u60c5\u611f\u6df1\u5ea6",
      lifePenetration: "\u751f\u6d3b\u6e17\u900f\u5ea6",
      intimacy: "\u4eb2\u5bc6\u7a0b\u5ea6",
      latest: "\u6700\u8fd1\u66f4\u65b0",
      realIdentity: "\u73b0\u5b9e\u8eab\u4efd",
      channel: "\u8ba4\u8bc6\u6e20\u9053",
      route: "\u5173\u7cfb\u8d70\u5411"
    }
  };

  function hostWindow() {
    try {
      if (window.parent && window.parent !== window) return window.parent;
    } catch (error) {}
    return window;
  }

  function hostDocument() {
    const host = hostWindow();
    try {
      return host.document || document;
    } catch (error) {
      return document;
    }
  }

  function safe(value, fallback = "\u2014") {
    return value === undefined || value === null || value === "" ? fallback : value;
  }

  function get(obj, path, fallback) {
    let current = obj;
    for (const key of path) {
      if (current === undefined || current === null || typeof current !== "object") return fallback;
      current = current[key];
    }
    return current === undefined ? fallback : current;
  }

  function esc(value) {
    return String(safe(value, "")).replace(/[&<>\"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  async function getStatData() {
    const host = hostWindow();
    try {
      if (typeof host.getCurrentMessageId === "function" && typeof host.getChatMessages === "function") {
        const currentId = host.getCurrentMessageId();
        const messages = await host.getChatMessages(currentId);
        const stat = messages && messages[0] && messages[0].data && messages[0].data.stat_data;
        if (stat && typeof stat === "object") return stat;
      }
    } catch (error) {}
    try {
      if (typeof host.getAllVariables === "function") {
        const all = host.getAllVariables();
        const stat = get(all, ["stat_data"], {});
        if (stat && typeof stat === "object") return stat;
      }
    } catch (error) {}
    return {};
  }

  function fillInput(text) {
    const host = hostWindow();
    const doc = hostDocument();
    const input =
      doc.querySelector("#send_textarea") ||
      doc.querySelector('textarea[name="message"]') ||
      doc.querySelector(".message-input textarea") ||
      doc.querySelector('[data-testid="chat-input"] textarea') ||
      doc.querySelector("textarea");
    if (!input) return false;
    const proto = host.HTMLTextAreaElement ? host.HTMLTextAreaElement.prototype : HTMLTextAreaElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && typeof desc.set === "function") desc.set.call(input, text);
    else input.value = text;
    try {
      input.dispatchEvent(new host.InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: text
      }));
    } catch (error) {
      input.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    }
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.focus();
    return true;
  }

  function clickSend() {
    const doc = hostDocument();
    const btn =
      doc.querySelector("#send_but") ||
      doc.querySelector('[data-testid="send-button"]') ||
      doc.querySelector("button[type='submit']");
    if (!btn) return false;
    btn.click();
    return true;
  }

  function roleRows(stat) {
    return U.SLOT_NAMES.map((slot) => {
      const summary = get(stat, [U.K.charIndex, slot], {});
      const detail = get(stat, [U.K.charDetail, slot], {});
      const compat = get(stat, [U.K.femaleArchive, slot], {});
      const built = !!(summary[U.K.built] || detail[U.K.built] || compat[U.K.built]);
      const name = summary[U.K.name] || detail[U.K.name] || compat[U.K.name] || "";
      return { slot, summary, detail: Object.keys(detail || {}).length ? detail : compat, built, name };
    }).filter((row) => row.built && row.name);
  }

  function formatTime(stat) {
    const t = get(stat, [U.K.world, U.K.detailTime], {});
    if (!t || t["年"] === undefined) return "\u65f6\u95f4\u672a\u540c\u6b65";
    const pad = (n) => String(n || 0).padStart(2, "0");
    return `${t["年"]}-${pad(t["月"])}-${pad(t["日"])} ${pad(t["时"])}:${pad(t["分"])} ${safe(t["星期"], "")}`.trim();
  }

  window.Forum1Common = {
    U,
    safe,
    get,
    esc,
    getStatData,
    fillInput,
    clickSend,
    roleRows,
    formatTime
  };
})();
