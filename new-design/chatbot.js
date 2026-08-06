/* Apna Digital Zone — chat booking assistant widget.
   Self-contained: mounts itself, no dependency on the host page's React tree.
   Host sets window.ADZ_CHAT_MODE to 'website' or 'app' before loading this file. */
(function () {
  "use strict";
  var MODE = window.ADZ_CHAT_MODE === "app" ? "app" : "website";
  var PHONE = "919386415795";

  var SERVICES = [
    { id: "wedding", label: "Wedding Photography & Videography" },
    { id: "prewed", label: "Pre-Wedding Shoot" },
    { id: "cinema", label: "Wedding Videography (film only)" },
    { id: "candid", label: "Candid Photography" },
    { id: "drone", label: "Drone Aerial Coverage" },
    { id: "bday", label: "Birthday Shoot" },
    { id: "anniv", label: "Anniversary Shoot" },
    { id: "newborn", label: "Newborn Baby Shoot" },
    { id: "seminar", label: "Seminar & Corporate" },
    { id: "freelance", label: "Freelance Photographer" },
    { id: "editing", label: "Video Editing" },
    { id: "album", label: "Karizma Album & Photobook" }
  ];
  var PACKAGES = [
    { id: "silver", name: "Silver", price: 34999 },
    { id: "gold", name: "Gold", price: 74999 },
    { id: "diamond", name: "Diamond", price: 99999 },
    { id: "platinum", name: "Platinum", price: 174999 },
    { id: "unsure", name: "Not sure yet", price: 74999 }
  ];
  /* Keep in step with ADDONS in app/index.html. */
  var ADDONS = [
    { id: "drone", name: "4K Drone Aerial Coverage", price: 9999 },
    { id: "teaser", name: "60s Teaser Reel (7-Day Delivery)", price: 4999 },
    { id: "album_sheet", name: "Karizma Album Pack (+20 Sheets)", price: 3999 },
    { id: "prewed", name: "Pre-Wedding Story Shoot", price: 14999 },
    { id: "live_tv", name: "Live TV & YouTube Broadcasting", price: 7999 }
  ];
  var GST_RATE = 0.18, ADVANCE_RATE = 0.25;
  /* Mirrors RATES in app/index.html. Services here are priced per day or per
     staff member instead of by wedding package. */
  var RATES = {
    candid: { unit: "day", opts: [
      { id: "wedding", n: "Wedding", price: 8000 },
      { id: "birthday", n: "Birthday", price: 7000 },
      { id: "anniv", n: "Anniversary", price: 7000 },
      { id: "baby", n: "Baby Shoot", price: 15000 },
      { id: "vip", n: "VIP Event", price: 12000 }
    ]},
    newborn: { unit: "day", opts: [
      { id: "trad", n: "Traditional", price: 10000 },
      { id: "candid", n: "Candid", price: 15000 }
    ]},
    seminar: { unit: "day", opts: [
      { id: "trad", n: "Traditional", price: 10000 },
      { id: "candid", n: "Candid", price: 15000 }
    ]},
    freelance: { unit: "staff", opts: [
      { id: "wedding", n: "Wedding", price: 2000 },
      { id: "govt", n: "Government Project", price: 4000 },
      { id: "drone", n: "Drone Operator", price: 5000 }
    ]}
  };
  var UNIT_LABEL = { day: "day", staff: "staff member" };
  function rateCfg(id) { return RATES[id] || null; }
  function rateOpt(sid, rid) {
    var c = rateCfg(sid);
    return c ? (c.opts.filter(function (o) { return o.id === rid; })[0] || null) : null;
  }

  function serviceLabel(id) {
    var s = SERVICES.filter(function (x) { return x.id === id; })[0];
    return s ? s.label : id;
  }
  function pkgName(id) {
    var p = PACKAGES.filter(function (x) { return x.id === id; })[0];
    return p ? p.name : id;
  }
  function pkgPrice(id) {
    var p = PACKAGES.filter(function (x) { return x.id === id; })[0];
    return p ? p.price : PACKAGES[1].price;
  }
  /* Mirrors estimate() in app/index.html. Both must agree -- a customer can
     start a booking in chat and finish it in the app, and the two quoting the
     same package differently is worse than quoting nothing at all. */
  function estimate(draft) {
    var cfg = rateCfg(draft.service);
    var opt = cfg ? rateOpt(draft.service, draft.rate) : null;
    var base = 0, qty = 0, onRequest = false;

    if (cfg) {
      qty = cfg.unit === "staff"
        ? Math.max(1, parseInt(draft.staff, 10) || 1)
        : Math.max(1, (draft.dates || []).length);
      if (opt && opt.price == null) onRequest = true;
      base = (opt && opt.price != null) ? opt.price * qty : 0;
    } else {
      var id = draft.pkg === "unsure" ? "gold" : draft.pkg;
      base = draft.pkg ? pkgPrice(id) : 0;
    }

    var picked = (draft.addons || []).map(function (aid) {
      return ADDONS.filter(function (a) { return a.id === aid; })[0];
    }).filter(Boolean);
    var addonsTotal = picked.reduce(function (s, a) { return s + a.price; }, 0);
    var subtotal = base + addonsTotal;
    var gst = subtotal * GST_RATE;
    var total = subtotal + gst;
    var advance = total * ADVANCE_RATE;
    return { base: base, rate: opt, qty: qty, unit: cfg ? cfg.unit : null, onRequest: onRequest,
             picked: picked, addonsTotal: addonsTotal, subtotal: subtotal,
             gst: gst, total: total, advance: advance, balance: total - advance };
  }
  function inr(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function tomorrowISO() {
    var d = new Date(); d.setDate(d.getDate() + 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function longDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  var AVATAR_SVG =
    '<svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="32" cy="32" r="32" fill="url(#swetaBg)"/>' +
    '<defs><linearGradient id="swetaBg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#2c2214"/><stop offset="1" stop-color="#120e09"/>' +
    '</linearGradient></defs>' +
    '<path d="M18 24c0-10 6-16 14-16s14 6 14 16v14c0 4-2 8-5 10H23c-3-2-5-6-5-10V24z" fill="#1a140e"/>' +
    '<path d="M12 58c0-12 9-18 20-18s20 6 20 18" fill="#c9a24d"/>' +
    '<circle cx="32" cy="26" r="11" fill="#fceade"/>' +
    '<path d="M21 22c3-5 8-7 11-7 5 0 9 2 11 7-3-2-7-3-11-3-4 0-8 1-11 3z" fill="#2c1f14"/>' +
    '<circle cx="28" cy="25" r="1.5" fill="#2c1f14"/>' +
    '<circle cx="36" cy="25" r="1.5" fill="#2c1f14"/>' +
    '<path d="M29 29q3 2.5 6 0" stroke="#b35a38" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
    '<path d="M21 24a11 11 0 0 1 22 0" stroke="#c9a24d" stroke-width="2" fill="none"/>' +
    '<rect x="19" y="22" width="3" height="6" rx="1.5" fill="#c9a24d"/>' +
    '<rect x="42" y="22" width="3" height="6" rx="1.5" fill="#c9a24d"/>' +
    '<path d="M43 27v4c0 2-2 3-4 3h-2" stroke="#c9a24d" stroke-width="1.5" fill="none"/>' +
    '<circle cx="37" cy="34" r="1.5" fill="#c9a24d"/>' +
    '<!-- Waving Hand HI Posture -->' +
    '<g transform="translate(42,32) rotate(-15)">' +
    '<path d="M2 12c1-4 3-7 5-7s3 2 3 5v-4c0-2 1.5-3 3-3s3 1 3 3v4c0-2 1.5-3 3-3s3 1 3 3v8c0 5-4 8-9 8-4 0-8-3-8-9z" fill="#fceade" stroke="#c9a24d" stroke-width="0.8"/>' +
    '<text x="-6" y="-3" font-size="10" fill="#ffdd80" font-weight="bold">👋 HI</text>' +
    '</g>' +
    '</svg>';

  var CSS = "" +
    "#adz-chat-fab{cursor:pointer;border:1px solid rgba(201,162,77,.55);background:linear-gradient(160deg,#1c1c23,#141419 70%);box-shadow:0 10px 28px rgba(0,0,0,.5),0 0 0 rgba(201,162,77,.4);display:grid;place-items:center;overflow:hidden;transition:transform .18s ease;padding:0}" +
    "#adz-chat-fab:hover{transform:scale(1.06)}" +
    "#adz-chat-fab:active{transform:scale(.94)}" +
    "#adz-chat-fab .adz-dot{position:absolute;width:12px;height:12px;border-radius:50%;background:#4ade80;border:2px solid #0b0b0d;box-shadow:0 0 6px rgba(74,222,128,.7)}" +
    "@keyframes adzPop{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}" +
    "@keyframes adzFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}" +
    "@keyframes adzBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}" +
    "@keyframes adzTip{0%,100%{opacity:0;transform:translateY(4px)}10%,90%{opacity:1;transform:none}}" +
    "#adz-chat-panel{display:flex;flex-direction:column;background:#0e0e12;border:1px solid rgba(201,162,77,.28);box-shadow:0 30px 70px rgba(0,0,0,.6);overflow:hidden;font-family:'Inter',system-ui,-apple-system,sans-serif;color:#f2eee6;animation:adzPop .22s cubic-bezier(.16,1,.3,1) both}" +
    "#adz-chat-head{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:14px 14px;background:rgba(255,255,255,.02);border-bottom:1px solid #232329}" +
    "#adz-chat-head .adz-av{width:34px;height:34px;border-radius:50%;flex:0 0 34px;position:relative;overflow:hidden;border:1px solid rgba(201,162,77,.4)}" +
    "#adz-chat-head b{font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:600;display:block;line-height:1.2}" +
    "#adz-chat-head span{font-size:10.5px;color:#8c877e;display:flex;align-items:center;gap:5px}" +
    "#adz-chat-head span i{width:6px;height:6px;border-radius:50%;background:#4ade80;display:inline-block}" +
    "#adz-chat-close{margin-left:auto;background:none;border:none;color:#8c877e;font-size:18px;cursor:pointer;padding:4px 6px;line-height:1}" +
    "#adz-chat-close:hover{color:#f2eee6}" +
    "#adz-chat-body{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:10px}" +
    ".adz-row{display:flex;gap:8px;align-items:flex-end;max-width:92%}" +
    ".adz-row.bot{align-self:flex-start}" +
    ".adz-row.user{align-self:flex-end;flex-direction:row-reverse}" +
    ".adz-row .adz-av{width:24px;height:24px;border-radius:50%;flex:0 0 24px;overflow:hidden;border:1px solid rgba(201,162,77,.35)}" +
    ".adz-bubble{padding:10px 13px;border-radius:14px;font-size:13.5px;line-height:1.5;animation:adzFadeIn .25s ease both}" +
    ".adz-row.bot .adz-bubble{background:#1c1c23;border:1px solid #26262f;border-bottom-left-radius:4px}" +
    ".adz-row.user .adz-bubble{background:#c9a24d;color:#14100a;border-bottom-right-radius:4px;font-weight:500}" +
    ".adz-typing{display:flex;gap:4px;padding:12px 14px}" +
    ".adz-typing i{width:6px;height:6px;border-radius:50%;background:#8c877e;display:inline-block;animation:adzBounce 1.1s ease-in-out infinite}" +
    ".adz-typing i:nth-child(2){animation-delay:.15s}.adz-typing i:nth-child(3){animation-delay:.3s}" +
    "#adz-chat-composer{flex:0 0 auto;padding:12px 14px 14px;border-top:1px solid #232329;background:rgba(255,255,255,.015)}" +
    ".adz-chips{display:flex;flex-wrap:wrap;gap:8px}" +
    ".adz-chip{border:1px solid rgba(201,162,77,.4);background:transparent;color:#e2dcd0;font-size:12.5px;padding:9px 14px;border-radius:20px;cursor:pointer;transition:.15s;font-family:inherit;text-align:left}" +
    ".adz-chip:hover{background:rgba(201,162,77,.14);border-color:#c9a24d}" +
    ".adz-inputrow{display:flex;gap:8px;align-items:center}" +
    ".adz-inputrow input{flex:1;background:#141419;border:1px solid #26262f;border-radius:11px;padding:12px 13px;font-size:13.5px;color:#f2eee6;font-family:inherit;min-width:0}" +
    ".adz-inputrow input:focus{outline:none;border-color:#c9a24d}" +
    ".adz-mic{flex:0 0 auto;width:42px;height:42px;border-radius:11px;border:1px solid rgba(201,162,77,0.4);background:#1c1c23;color:#e2dcd0;font-size:16px;cursor:pointer;display:grid;place-items:center;transition:.2s}" +
    ".adz-mic:hover{background:rgba(201,162,77,0.2);border-color:#c9a24d}" +
    ".adz-send{flex:0 0 auto;width:42px;height:42px;border-radius:11px;border:none;background:#c9a24d;color:#14100a;font-size:16px;cursor:pointer;display:grid;place-items:center}" +
    ".adz-send:disabled{opacity:.4;cursor:default}" +
    ".adz-summary{background:#141419;border:1px solid #26262f;border-radius:12px;padding:12px 14px;font-size:12.5px;display:grid;gap:7px;margin-bottom:4px}" +
    ".adz-summary .r{display:flex;justify-content:space-between;gap:10px}" +
    ".adz-summary .r span{color:#8c877e}" +
    ".adz-summary .r b{font-weight:500;text-align:right}" +
    ".adz-summary .total{border-top:1px solid #26262f;padding-top:8px;margin-top:2px}" +
    ".adz-summary .total b{color:#c9a24d;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px}" +
    ".adz-btn{width:100%;padding:12px;border-radius:11px;border:none;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;font-family:inherit;margin-top:8px}" +
    ".adz-btn.gold{background:#c9a24d;color:#14100a}" +
    ".adz-btn.ghost{background:transparent;color:#cfc9bd;border:1px solid rgba(245,241,232,.24)}" +
    ".adz-tooltip{position:absolute;background:#1c1c23;border:1px solid rgba(201,162,77,.4);color:#f2eee6;padding:8px 13px;border-radius:12px;font-size:12px;white-space:nowrap;animation:adzTip 6s ease both;pointer-events:none}" +
    "@media (max-width:480px){#adz-chat-panel.mode-website{position:fixed!important;left:10px!important;right:10px!important;top:auto!important;bottom:max(86px, calc(env(safe-area-inset-bottom) + 82px))!important;width:auto!important;height:min(68vh,560px)!important}}";

  function injectCss() {
    var s = document.createElement("style");
    s.setAttribute("data-adz-chat", "");
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  function ChatWidget(mode) {
    this.mode = mode;
    this.open = false;
    this.step = "intro";
    this.draft = { service: "", pkg: "", rate: null, staff: 1, dates: [], addons: [], region: "Bihar", district: "", city: "", pin: "", venue: "", name: "", phone: "" };
    this.firstOpen = true;
  }

  ChatWidget.prototype.mount = function (container, opts) {
    this.container = container;
    this.opts = opts || {};
    var self = this;

    this.fab = el("button", { id: "adz-chat-fab", "aria-label": "Chat to book with Sweta", html: AVATAR_SVG });
    var dot = el("span", { class: "adz-dot" });
    this.fab.appendChild(dot);
    this.applyFabPos(dot);

    this.panel = el("div", { id: "adz-chat-panel", class: "mode-" + this.mode });
    this.panel.style.display = "none";
    this.applyPanelPos();

    var head = el("div", { id: "adz-chat-head" }, [
      el("div", { class: "adz-av", html: AVATAR_SVG }),
      el("div", {}, [
        el("b", { html: "Sweta" }),
        el("span", { html: "<i></i> Studio Assistant · Online" })
      ]),
      (function () {
        var b = el("button", { id: "adz-chat-close", "aria-label": "Close" });
        b.textContent = "✕";
        b.onclick = function () { self.toggle(false); };
        return b;
      })()
    ]);
    head.children[1].style.flex = "1";
    head.children[1].style.minWidth = "0";

    this.body = el("div", { id: "adz-chat-body" });
    this.composer = el("div", { id: "adz-chat-composer" });

    this.panel.appendChild(head);
    this.panel.appendChild(this.body);
    this.panel.appendChild(this.composer);

    container.appendChild(this.fab);
    container.appendChild(this.panel);

    this.fab.onclick = function () { self.toggle(); };

    setTimeout(function () { self.showTooltip(); }, 2200);
  };

  ChatWidget.prototype.applyFabPos = function () {
    var s = this.fab.style;
    s.position = this.mode === "app" ? "absolute" : "fixed";
    s.width = s.height = "56px";
    s.borderRadius = "50%";
    s.zIndex = 900;
    if (this.mode === "app") { s.right = "16px"; s.bottom = "92px"; }
    else { s.left = "22px"; s.bottom = "max(22px, calc(env(safe-area-inset-bottom) + 18px))"; }
    this.fab.querySelector(".adz-dot").style.top = "0";
    this.fab.querySelector(".adz-dot").style.right = "0";
  };

  ChatWidget.prototype.applyPanelPos = function () {
    var s = this.panel.style;
    s.borderRadius = "18px";
    s.zIndex = 901;
    if (this.mode === "app") {
      s.position = "absolute";
      s.left = "10px"; s.right = "10px";
      s.top = "68px"; s.bottom = "78px";
    } else {
      s.position = "fixed";
      s.left = "22px"; s.bottom = "max(90px, calc(env(safe-area-inset-bottom) + 86px))";
      s.width = "min(360px, 92vw)";
      s.height = "min(64vh, 520px)";
    }
  };

  ChatWidget.prototype.showTooltip = function () {
    if (this.open || sessionStorage.getItem("adz_chat_tip_seen")) return;
    var self = this;
    var tip = el("div", { class: "adz-tooltip" });
    tip.textContent = "💬 Chat with Sweta — Instant Booking";
    tip.style.position = this.mode === "app" ? "absolute" : "fixed";
    if (this.mode === "app") { tip.style.right = "78px"; tip.style.bottom = "108px"; }
    else { tip.style.left = "88px"; tip.style.bottom = "max(36px, calc(env(safe-area-inset-bottom) + 32px))"; }
    this.container.appendChild(tip);
    sessionStorage.setItem("adz_chat_tip_seen", "1");
    setTimeout(function () { tip.remove(); }, 6200);
    this.fab.addEventListener("click", function () { tip.remove(); }, { once: true });
  };

  ChatWidget.prototype.toggle = function (force) {
    this.open = typeof force === "boolean" ? force : !this.open;
    this.panel.style.display = this.open ? "flex" : "none";
    if (this.open && this.firstOpen) {
      this.firstOpen = false;
      this.runStep("intro");
    }
    if (this.open) this.scrollBottom();
  };

  ChatWidget.prototype.scrollBottom = function () {
    var b = this.body;
    setTimeout(function () { b.scrollTop = b.scrollHeight; }, 30);
  };

  ChatWidget.prototype.addBot = function (html, cb) {
    var self = this;
    var typing = el("div", { class: "adz-row bot" }, [
      el("div", { class: "adz-av", html: AVATAR_SVG }),
      el("div", { class: "adz-bubble adz-typing" }, [el("i"), el("i"), el("i")])
    ]);
    this.body.appendChild(typing);
    this.scrollBottom();
    setTimeout(function () {
      typing.remove();
      var row = el("div", { class: "adz-row bot" }, [
        el("div", { class: "adz-av", html: AVATAR_SVG }),
        el("div", { class: "adz-bubble", html: html })
      ]);
      self.body.appendChild(row);
      self.scrollBottom();
      if (cb) cb();
    }, 480 + Math.random() * 350);
  };

  ChatWidget.prototype.addUser = function (text) {
    var row = el("div", { class: "adz-row user" }, [
      el("div", { class: "adz-bubble" })
    ]);
    row.querySelector(".adz-bubble").textContent = text;
    this.body.appendChild(row);
    this.scrollBottom();
  };

  ChatWidget.prototype.setComposer = function (node) {
    this.composer.innerHTML = "";
    if (node) this.composer.appendChild(node);
  };

  ChatWidget.prototype.runStep = function (step) {
    this.step = step;
    var self = this;

    if (step === "intro") {
      this.addBot("Namaste 🙏 I'm <b>Sweta</b> from Apna Digital Zone. I can check live date availability, answer package questions, and lock your booking right here! What event are you celebrating?", function () {
        self.showChoices(SERVICES.map(function (s) { return { label: s.label, value: s.id }; }), function (val) {
          self.draft.service = val;
          self.addUser(serviceLabel(val));
          // Day- and staff-rate services have no wedding package to pick.
          self.runStep(rateCfg(val) ? "rate" : "package");
        });
      });
      return;
    }

    if (step === "package") {
      this.addBot("Great choice — <b>" + esc(serviceLabel(this.draft.service)) + "</b>. Which package works for you?", function () {
        self.showChoices(PACKAGES.map(function (p) {
          return { label: p.id === "unsure" ? p.name : p.name + " — " + inr(p.price), value: p.id };
        }), function (val) {
          self.draft.pkg = val;
          self.addUser(pkgName(val));
          self.runStep("date");
        });
      });
      return;
    }

    if (step === "rate") {
      var cfg = rateCfg(this.draft.service);
      this.addBot(cfg.label || "Which rate applies?", function () {
        self.showChoices(cfg.opts.map(function (o) {
          return { label: o.price != null
            ? o.n + " — " + inr(o.price) + "/" + UNIT_LABEL[cfg.unit]
            : o.n + " — quoted on request", value: o.id };
        }), function (val) {
          self.draft.rate = val;
          self.addUser(rateOpt(self.draft.service, val).n);
          self.runStep(cfg.unit === "staff" ? "staff" : "date");
        });
      });
      return;
    }

    if (step === "staff") {
      this.addBot("How many crew members do you need?", function () {
        self.showTextInput("e.g. 3", "number", function (val) {
          self.draft.staff = Math.max(1, Math.min(20, parseInt(val, 10) || 1));
          self.addUser(self.draft.staff + (self.draft.staff > 1 ? " crew members" : " crew member"));
          self.runStep("date");
        });
      });
      return;
    }

    if (step === "addons") {
      var e0 = estimate(this.draft);
      var lead;
      if (e0.onRequest) {
        lead = "VIP Event coverage is quoted per event, so our team will confirm the rate directly. Meanwhile, want to add anything?";
      } else if (e0.rate) {
        lead = "<b>" + esc(e0.rate.n) + "</b> at " + inr(e0.rate.price) + "/" + UNIT_LABEL[e0.unit] +
               " × " + e0.qty + " comes to <b>" + inr(e0.total) + "</b> including 18% GST. Want to add anything?";
      } else {
        lead = "<b>" + esc(pkgName(this.draft.pkg)) + "</b> comes to <b>" + inr(e0.total) +
               "</b> including 18% GST. Want to add anything?";
      }
      this.addBot(lead + " Tap to include or remove — the total updates as you go.", function () {
        self.showAddons(function () {
          var e = estimate(self.draft);
          self.addUser(e.picked.length
            ? e.picked.map(function (a) { return a.name; }).join(", ")
            : "No add-ons");
          self.runStep("region");
        });
      });
      return;
    }

    if (step === "region") {
      this.addBot("Is the event in Bihar or outside Bihar?", function () {
        self.showChoices([
          { label: "In Bihar", value: "Bihar" },
          { label: "Outside Bihar", value: "Outside Bihar" }
        ], function (val) {
          self.draft.region = val;
          self.addUser(val);
          self.runStep("district");
        });
      });
      return;
    }

    if (step === "district") {
      this.addBot("Which district?", function () {
        self.showTextInput(self.draft.region === "Outside Bihar" ? "e.g. Varanasi" : "e.g. Bhojpur", "text", function (val) {
          self.draft.district = val;
          self.addUser(val);
          self.runStep("city");
        });
      });
      return;
    }

    if (step === "city") {
      this.addBot("And the city or town?", function () {
        self.showTextInput("e.g. Arrah", "text", function (val) {
          self.draft.city = val;
          self.addUser(val);
          self.runStep("pin");
        });
      });
      return;
    }

    if (step === "pin") {
      this.addBot("PIN code, so the crew can plan travel and reach on time?", function () {
        self.showTextInput("802302", "tel", function (val) {
          self.draft.pin = val;
          self.addUser(val);
          self.runStep("venue");
        });
      });
      return;
    }

    if (step === "date") {
      this.addBot("Perfect. When's the big day? Add every date you need us for — you can pick more than one if there's haldi, wedding, reception on different days.", function () {
        self.showMultiDateInput(function () {
          var list = self.draft.dates.slice().sort().map(function (x) { return longDate(x); }).join("; ");
          self.addUser(list);
          // Add-ons come after the dates so a per-day quote is already accurate
          // by the time the running total appears.
          self.runStep("addons");
        });
      });
      return;
    }

    if (step === "venue") {
      this.addBot("Venue name or a landmark we should head for?", function () {
        self.showTextInput("e.g. Mahadev Palace, near Bullet Showroom", "text", function (val) {
          self.draft.venue = val;
          self.addUser(val);
          self.runStep("name");
        });
      });
      return;
    }

    if (step === "name") {
      this.addBot("Almost there — what's your name?", function () {
        self.showTextInput("Your full name", "text", function (val) {
          self.draft.name = val;
          self.addUser(val);
          self.runStep("phone");
        });
      });
      return;
    }

    if (step === "phone") {
      this.addBot("And your WhatsApp / mobile number, so our team can confirm within the hour.", function () {
        self.showTextInput("+91 XXXXX XXXXX", "tel", function (val) {
          self.draft.phone = val;
          self.addUser(val);
          self.runStep("summary");
        });
      });
      return;
    }

    if (step === "summary") {
      this.addBot("Here's what I've got — shall I lock this in?", function () {
        self.showSummary();
      });
      return;
    }
  };

  ChatWidget.prototype.showChoices = function (choices, onPick) {
    var wrap = el("div", { class: "adz-chips" });
    choices.forEach(function (c) {
      var b = el("button", { class: "adz-chip" });
      b.textContent = c.label;
      b.onclick = function () {
        wrap.querySelectorAll("button").forEach(function (x) { x.disabled = true; x.style.opacity = ".5"; });
        onPick(c.value);
      };
      wrap.appendChild(b);
    });
    this.setComposer(wrap);
  };

  /* Add-on picker: toggle chips with a running estimate underneath, so the
     cost of a choice is visible at the moment it is made. */
  ChatWidget.prototype.showAddons = function (onDone) {
    var self = this;
    if (!self.draft.addons) self.draft.addons = [];
    var wrap = el("div", {});
    var chips = el("div", { class: "adz-chips" });
    chips.style.marginBottom = "8px";
    var totalBox = el("div", { class: "adz-summary" });
    var doneBtn = el("button", { class: "adz-btn gold" });

    function renderTotal() {
      var e = estimate(self.draft);
      var html = e.rate
        ? '<div class="r"><span>' + esc(e.rate.n) +
          (e.rate.price != null ? " — " + inr(e.rate.price) + "/" + UNIT_LABEL[e.unit] + " × " + e.qty : " — on request") +
          "</span><b>" + (e.rate.price != null ? inr(e.base) : "—") + "</b></div>"
        : '<div class="r"><span>' + esc(pkgName(self.draft.pkg)) + " package</span><b>" + inr(e.base) + "</b></div>";
      e.picked.forEach(function (a) {
        html += '<div class="r"><span>+ ' + esc(a.name) + "</span><b>" + inr(a.price) + "</b></div>";
      });
      if (e.picked.length) html += '<div class="r"><span>Subtotal</span><b>' + inr(e.subtotal) + "</b></div>";
      html += '<div class="r"><span>GST @ 18%</span><b>' + inr(e.gst) + "</b></div>";
      html += '<div class="r total"><span>Estimated total</span><b>' + inr(e.total) + "</b></div>";
      html += '<div class="r"><span>Advance (25%) due now</span><b>' + inr(e.advance) + "</b></div>";
      totalBox.innerHTML = html;
      doneBtn.textContent = e.picked.length
        ? "Continue with " + e.picked.length + " add-on" + (e.picked.length > 1 ? "s" : "") + " →"
        : "Continue without add-ons →";
    }
    function renderChips() {
      chips.innerHTML = "";
      ADDONS.forEach(function (a) {
        var on = self.draft.addons.indexOf(a.id) > -1;
        var b = el("button", { class: "adz-chip" });
        b.textContent = (on ? "✓ " : "+ ") + a.name + " " + inr(a.price);
        if (on) { b.style.borderColor = "#c9a24d"; b.style.color = "#e6cd92"; }
        b.onclick = function () {
          var i = self.draft.addons.indexOf(a.id);
          if (i > -1) self.draft.addons.splice(i, 1); else self.draft.addons.push(a.id);
          renderChips(); renderTotal();
        };
        chips.appendChild(b);
      });
    }

    doneBtn.onclick = function () {
      chips.querySelectorAll("button").forEach(function (x) { x.disabled = true; x.style.opacity = ".5"; });
      doneBtn.disabled = true;
      onDone();
    };

    renderChips(); renderTotal();
    wrap.appendChild(chips);
    wrap.appendChild(totalBox);
    wrap.appendChild(doneBtn);
    this.setComposer(wrap);
    this.scrollBottom();
  };

  ChatWidget.prototype.showMultiDateInput = function (onDone) {
    var self = this;
    var wrap = el("div", {});
    var chipsWrap = el("div", { class: "adz-chips" });
    chipsWrap.style.marginBottom = "8px";
    var row = el("div", { class: "adz-inputrow" });
    var input = el("input", { type: "date", min: tomorrowISO() });
    var addBtn = el("button", { class: "adz-send" });
    addBtn.innerHTML = "+";
    addBtn.setAttribute("aria-label", "Add date");
    var continueBtn = el("button", { class: "adz-btn gold" });
    continueBtn.textContent = "Continue →";

    function setContinueEnabled() {
      var has = self.draft.dates.length > 0;
      continueBtn.disabled = !has;
      continueBtn.style.opacity = has ? "1" : ".5";
    }
    function renderChips() {
      chipsWrap.innerHTML = "";
      self.draft.dates.slice().sort().forEach(function (iso) {
        var chip = el("button", { class: "adz-chip" });
        chip.textContent = longDate(iso) + "  ✕";
        chip.title = "Remove this date";
        chip.onclick = function () {
          self.draft.dates = self.draft.dates.filter(function (d) { return d !== iso; });
          renderChips();
          setContinueEnabled();
        };
        chipsWrap.appendChild(chip);
      });
    }
    addBtn.onclick = function () {
      if (!input.value) { input.focus(); return; }
      if (self.draft.dates.indexOf(input.value) === -1) self.draft.dates.push(input.value);
      input.value = "";
      renderChips();
      setContinueEnabled();
    };
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addBtn.onclick(); } });
    continueBtn.onclick = function () {
      if (self.draft.dates.length === 0) return;
      onDone();
    };

    renderChips();
    setContinueEnabled();
    row.appendChild(input); row.appendChild(addBtn);
    wrap.appendChild(chipsWrap); wrap.appendChild(row); wrap.appendChild(continueBtn);
    this.setComposer(wrap);
    setTimeout(function () { input.focus(); }, 50);
  };

  ChatWidget.prototype.showTextInput = function (placeholder, type, onSubmit) {
    var row = el("div", { class: "adz-inputrow" });
    var input = el("input", { type: type, placeholder: placeholder });
    var mic = el("button", { class: "adz-mic", title: "Voice Chat — Speak your message" });
    mic.innerHTML = "🎙️";
    var send = el("button", { class: "adz-send" });
    send.innerHTML = "→";

    // Web Speech API Integration
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      var recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      var isListening = false;
      mic.onclick = function() {
        if (!isListening) {
          try {
            recognition.start();
            isListening = true;
            mic.style.background = "#ef4444";
            mic.style.color = "#ffffff";
            mic.style.borderColor = "#ef4444";
            input.placeholder = "🔴 Listening... speak now";
          } catch(e) {}
        } else {
          recognition.stop();
          isListening = false;
          mic.style.background = "";
          mic.style.color = "";
          mic.style.borderColor = "";
          input.placeholder = placeholder;
        }
      };

      recognition.onresult = function(event) {
        var transcript = "";
        for (var i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        input.value = transcript;
      };

      recognition.onerror = recognition.onend = function() {
        isListening = false;
        mic.style.background = "";
        mic.style.color = "";
        mic.style.borderColor = "";
        input.placeholder = placeholder;
      };
    } else {
      mic.onclick = function() {
        alert("Voice recognition is available on Chrome, Edge, and Safari browsers.");
      };
    }

    function submit() {
      var v = input.value.trim();
      if (!v) { input.focus(); return; }
      if (type === "tel" && v.replace(/\D/g, "").length < 10) { input.focus(); return; }
      send.disabled = true; input.disabled = true; mic.disabled = true;
      onSubmit(v);
    }
    send.onclick = submit;
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
    row.appendChild(input); row.appendChild(mic); row.appendChild(send);
    this.setComposer(row);
    setTimeout(function () { input.focus(); }, 50);
  };

  ChatWidget.prototype.showSummary = function () {
    var self = this, d = this.draft;
    var e = estimate(d);
    var box = el("div", { class: "adz-summary" });
    box.innerHTML =
      row("Service", serviceLabel(d.service)) +
      (e.rate
        ? row("Rate", esc(e.rate.n) + (e.rate.price != null
            ? " — " + inr(e.rate.price) + "/" + UNIT_LABEL[e.unit] : " — on request")) +
          (e.unit === "staff" ? row("Crew size", String(e.qty)) : "")
        : row("Package", pkgName(d.pkg))) +
      e.picked.map(function (a) { return row("+ " + esc(a.name), inr(a.price)); }).join("") +
      row("Date(s)", d.dates.slice().sort().map(function (x) { return longDate(x); }).join("; ")) +
      row("Location", esc(d.region || "—")) +
      row("District", esc(d.district || "—")) +
      row("City", esc(d.city || "—")) +
      row("PIN", esc(d.pin || "—")) +
      row("Venue", esc(d.venue)) +
      row("Name", esc(d.name)) +
      row("Mobile", esc(d.phone)) +
      (e.onRequest
        ? '<div class="r total"><span>Total</span><b>On request</b></div>'
        : row(e.rate ? "Shoot amount" : "Package amount", inr(e.base)) +
          (e.picked.length ? row("Add-ons", inr(e.addonsTotal)) : "") +
          row("GST @ 18%", inr(e.gst)) +
          '<div class="r total"><span>Total</span><b>' + inr(e.total) + "</b></div>" +
          row("Advance (25%) due now", inr(e.advance)) +
          row("Balance on shoot day", inr(e.balance)));
    function row(k, v) { return '<div class="r"><span>' + k + "</span><b>" + v + "</b></div>"; }

    var confirmBtn = el("button", { class: "adz-btn gold" });
    confirmBtn.textContent = "Confirm Booking →";
    confirmBtn.onclick = function () { self.confirm(); };
    var overBtn = el("button", { class: "adz-btn ghost" });
    overBtn.textContent = "Start Over";
    overBtn.onclick = function () {
      // Must match the constructor's shape -- this previously reset to a
      // `date` string with no `dates` array, so the next date step threw on
      // draft.dates.slice() and the conversation dead-ended.
      self.draft = { service: "", pkg: "", rate: null, staff: 1, dates: [], addons: [], region: "Bihar", district: "", city: "", pin: "", venue: "", name: "", phone: "" };
      self.addUser("Start over");
      self.runStep("intro");
    };

    var wrap = el("div", {}, [box, confirmBtn, overBtn]);
    this.setComposer(wrap);
    this.scrollBottom();
  };

  ChatWidget.prototype.confirm = function () {
    var self = this, d = this.draft;
    this.setComposer(null);
    if (this.mode === "app") {
      var e = estimate(d);
      var order = {
        id: "ADZ" + String(Date.now()).slice(-6),
        service: d.service, pkg: d.pkg === "unsure" ? "gold" : d.pkg,
        rate: d.rate, staff: d.staff, addons: d.addons || [],
        dates: d.dates, date: d.dates && d.dates.slice().sort()[0],
        region: d.region, district: d.district, city: d.city, pin: d.pin,
        venue: d.venue, name: d.name, phone: d.phone,
        notes: "Booked via chat assistant", total: e.total, paid: e.advance,
        stage: 1, created: new Date().toISOString(), method: "upi"
      };
      // The app reads adz_orders / adz_user. This used to write adz_orders_dc,
      // so a chat booking was saved somewhere nothing reads and never appeared
      // in My Bookings -- while the bot claimed it would.
      try {
        var orders = JSON.parse(localStorage.getItem("adz_orders") || "[]");
        orders = [order].concat(orders);
        localStorage.setItem("adz_orders", JSON.stringify(orders));
        localStorage.setItem("adz_user", JSON.stringify({ name: d.name, phone: d.phone }));
      } catch (e2) {}
      var datesText = d.dates.slice().sort().map(function (x) { return longDate(x); }).join("; ");
      this.addBot("🎉 Booked! Your ID is <b>" + order.id + "</b> for " + datesText + ". Reloading so it shows up in <b>My Bookings</b>…");
      setTimeout(function () { location.reload(); }, 1900);
    } else {
      var txt = "*New Enquiry — Apna Digital Zone*\n\n" +
        "*Name:* " + (d.name || "—") + "\n" +
        "*Mobile:* " + (d.phone || "—") + "\n" +
        "*Event:* " + serviceLabel(d.service) + "\n" +
        "*Date(s):* " + (d.dates.length ? d.dates.slice().sort().map(function (x) { return longDate(x); }).join("; ") : "—") + "\n" +
        "*Venue:* " + (d.venue || "—") + "\n" +
        (estimate(d).rate
          ? "*Rate:* " + estimate(d).rate.n + (estimate(d).rate.price != null
              ? " — " + inr(estimate(d).rate.price) + "/" + UNIT_LABEL[estimate(d).unit] + " × " + estimate(d).qty
              : " — quoted on request") + "\n"
          : "*Package:* " + pkgName(d.pkg) + "\n") +
        (estimate(d).picked.length
          ? "*Add-ons:* " + estimate(d).picked.map(function (a) { return a.name; }).join(", ") + "\n"
          : "") +
        "*Location:* " + (d.region || "—") + "\n" +
        "*District:* " + (d.district || "—") + "\n" +
        "*City:* " + (d.city || "—") + "\n" +
        "*PIN:* " + (d.pin || "—") + "\n" +
        (estimate(d).onRequest
          ? "*Estimated total:* Quoted on request\n"
          : "*Estimated total (incl. 18% GST):* " + inr(estimate(d).total) + "\n" +
            "*Advance (25%):* " + inr(estimate(d).advance) + "\n") +
        "*Notes:* Booked via chat assistant";
      window.open("https://wa.me/" + PHONE + "?text=" + encodeURIComponent(txt), "_blank");
      this.addBot("I've opened WhatsApp with everything filled in — just hit send and our team will confirm within the hour.", function () {
        var again = el("button", { class: "adz-btn ghost" });
        again.textContent = "Start a New Chat";
        again.onclick = function () {
          self.draft = { service: "", pkg: "", rate: null, staff: 1, dates: [], addons: [], region: "Bihar", district: "", city: "", pin: "", venue: "", name: "", phone: "" };
          self.body.innerHTML = "";
          self.runStep("intro");
        };
        self.setComposer(again);
      });
    }
  };

  function findPhoneFrame(cb, triesLeft) {
    var divs = document.querySelectorAll("body div");
    for (var i = 0; i < divs.length; i++) {
      var cs = getComputedStyle(divs[i]);
      if (cs.maxWidth === "430px") { cb(divs[i]); return; }
    }
    if (triesLeft <= 0) { cb(null); return; }
    setTimeout(function () { findPhoneFrame(cb, triesLeft - 1); }, 200);
  }

  function init() {
    injectCss();
    var widget = new ChatWidget(MODE);
    window.__adzChat = widget;
    if (MODE === "app") {
      findPhoneFrame(function (frame) {
        widget.mount(frame || document.body, {});
      }, 30);
    } else {
      widget.mount(document.body, {});
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
