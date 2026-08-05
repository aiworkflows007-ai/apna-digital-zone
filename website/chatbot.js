/* Apna Digital Zone — chat booking assistant widget.
   Self-contained: mounts itself, no dependency on the host page's React tree.
   Host sets window.ADZ_CHAT_MODE to 'website' or 'app' before loading this file. */
(function () {
  "use strict";
  var MODE = window.ADZ_CHAT_MODE === "app" ? "app" : "website";
  var PHONE = "919386415795";

  var SERVICES = [
    { id: "wedding", label: "Wedding Photography & Cinematography" },
    { id: "prewed", label: "Pre-Wedding Shoot" },
    { id: "cinema", label: "Wedding Cinematography (film only)" },
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
    '<circle cx="32" cy="32" r="32" fill="url(#adzAvatarBg)"/>' +
    '<defs><linearGradient id="adzAvatarBg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#1c1c23"/><stop offset="1" stop-color="#141419"/></linearGradient></defs>' +
    '<path d="M10 60c0-13.5 9.8-21 22-21s22 7.5 22 21" fill="#2a2a33"/>' +
    '<circle cx="32" cy="23" r="12" fill="#2a2a33"/>' +
    '<rect x="19" y="27" width="26" height="17" rx="4" fill="#c9a24d"/>' +
    '<rect x="27" y="21" width="10" height="7" rx="2" fill="#c9a24d"/>' +
    '<circle cx="32" cy="35.5" r="6.5" fill="#0b0b0d" stroke="#e6cd92" stroke-width="2"/>' +
    '<circle cx="32" cy="35.5" r="2.4" fill="#e6cd92"/>' +
    '<circle cx="41.5" cy="29.5" r="1.6" fill="#0b0b0d"/>' +
    "</svg>";

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
    ".adz-inputrow{display:flex;gap:8px}" +
    ".adz-inputrow input{flex:1;background:#141419;border:1px solid #26262f;border-radius:11px;padding:12px 13px;font-size:13.5px;color:#f2eee6;font-family:inherit;min-width:0}" +
    ".adz-inputrow input:focus{outline:none;border-color:#c9a24d}" +
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
    this.draft = { service: "", pkg: "", dates: [], venue: "", name: "", phone: "" };
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
          self.runStep("package");
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

    if (step === "date") {
      this.addBot("Perfect. When's the big day? Add every date you need us for — you can pick more than one if there's haldi, wedding, reception on different days.", function () {
        self.showMultiDateInput(function () {
          var list = self.draft.dates.slice().sort().map(function (x) { return longDate(x); }).join("; ");
          self.addUser(list);
          self.runStep("venue");
        });
      });
      return;
    }

    if (step === "venue") {
      this.addBot("Which city or venue will this be at?", function () {
        self.showTextInput("e.g. Arrah, Patna, Buxar", "text", function (val) {
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
    var send = el("button", { class: "adz-send" });
    send.innerHTML = "→";
    function submit() {
      var v = input.value.trim();
      if (!v) { input.focus(); return; }
      if (type === "tel" && v.replace(/\D/g, "").length < 10) { input.focus(); return; }
      send.disabled = true; input.disabled = true;
      onSubmit(v);
    }
    send.onclick = submit;
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
    row.appendChild(input); row.appendChild(send);
    this.setComposer(row);
    setTimeout(function () { input.focus(); }, 50);
  };

  ChatWidget.prototype.showSummary = function () {
    var self = this, d = this.draft;
    var price = pkgPrice(d.pkg);
    var total = price * 1.18, advance = total * 0.25;
    var box = el("div", { class: "adz-summary" });
    box.innerHTML =
      row("Service", serviceLabel(d.service)) +
      row("Package", pkgName(d.pkg)) +
      row("Date(s)", d.dates.slice().sort().map(function (x) { return longDate(x); }).join("; ")) +
      row("Venue", esc(d.venue)) +
      row("Name", esc(d.name)) +
      row("Mobile", esc(d.phone)) +
      '<div class="r total"><span>Advance (25%) due now</span><b>' + inr(advance) + "</b></div>";
    function row(k, v) { return '<div class="r"><span>' + k + "</span><b>" + v + "</b></div>"; }

    var confirmBtn = el("button", { class: "adz-btn gold" });
    confirmBtn.textContent = "Confirm Booking →";
    confirmBtn.onclick = function () { self.confirm(); };
    var overBtn = el("button", { class: "adz-btn ghost" });
    overBtn.textContent = "Start Over";
    overBtn.onclick = function () {
      self.draft = { service: "", pkg: "", date: "", venue: "", name: "", phone: "" };
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
      var price = pkgPrice(d.pkg === "unsure" ? "gold" : d.pkg);
      var total = price * 1.18, paid = total * 0.25;
      var order = {
        id: "ADZ" + String(Date.now()).slice(-6),
        service: d.service, pkg: d.pkg === "unsure" ? "gold" : d.pkg,
        dates: d.dates, venue: d.venue, name: d.name, phone: d.phone,
        notes: "Booked via chat assistant", total: total, paid: paid,
        stage: 1, created: new Date().toISOString(), method: "upi"
      };
      try {
        var orders = JSON.parse(localStorage.getItem("adz_orders_dc") || "[]");
        orders = [order].concat(orders);
        localStorage.setItem("adz_orders_dc", JSON.stringify(orders));
        localStorage.setItem("adz_user_dc", JSON.stringify({ name: d.name, phone: d.phone }));
      } catch (e) {}
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
        "*Package:* " + pkgName(d.pkg) + "\n" +
        "*Notes:* Booked via chat assistant";
      window.open("https://wa.me/" + PHONE + "?text=" + encodeURIComponent(txt), "_blank");
      this.addBot("I've opened WhatsApp with everything filled in — just hit send and our team will confirm within the hour.", function () {
        var again = el("button", { class: "adz-btn ghost" });
        again.textContent = "Start a New Chat";
        again.onclick = function () {
          self.draft = { service: "", pkg: "", date: "", venue: "", name: "", phone: "" };
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
