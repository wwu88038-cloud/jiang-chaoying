/* ===== 夜、江面、星、声音 ===== */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 文案 ---------- */
  var KEY = "forJiang.atmos.v3";
  var DEFAULTS = {
    name: "江潮莹",
    cap: "小笨蛋",
    sea: "风从江面过来，带着一点凉。\n我站在这里，忽然很想你。",
    star: "这些星星本来没有关系，\n是我一颗一颗，连成你的样子。",
    sweet: [
      "你今天有没有好好吃饭？",
      "我拍了很多云，其实是想拍给你看。",
      "你笑起来的时候，我觉得今天没白过。",
      "想把你写进我所有的以后里。",
      "和你在一起，连等待都变得好过。",
      "不用做很厉害的人，做我的人就好。",
      "你困了就睡，我还在。",
      "今天的月亮很好看，但没有你好看。",
      "爱你！"
    ],
    timeline: [
      "遇见你 | 日子忽然多了一点期待。",
      "和你在一起 | 从那天起，晚安有了固定的对象。",
      "现在 | 还是很喜欢你，一天比一天。"
    ],
    wish: "许好了，愿望里有你。",
    msgTip: "写完会得到一串回信码，记得发给我",
    since: "2026-10-24",
    end: "晚安檬檬",
    endSub: "明天也会是个好天气",
    sign: "—— 今天的我，也在想你"
  };

  // 导出成品时，配置会被烘进 HTML；有就用它当默认
  if (window.__CFG__ && typeof window.__CFG__ === "object") {
    for (var bk in window.__CFG__) {
      if (Object.prototype.hasOwnProperty.call(window.__CFG__, bk) && window.__CFG__[bk] !== undefined) {
        DEFAULTS[bk] = window.__CFG__[bk];
      }
    }
  }

  var cfg = load();
  function load() {
    var base = JSON.parse(JSON.stringify(DEFAULTS));
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        for (var k in s) {
          if (Object.prototype.hasOwnProperty.call(s, k) && s[k] !== undefined) base[k] = s[k];
        }
      }
    } catch (e) {}
    return base;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {}
  }

  /* ---------- 星空画布 ---------- */
  var canvas = $("fx"), ctx = canvas.getContext("2d");
  var W = 0, H = 0, DPR = 1;
  var stars = [], dust = [], flies = [], sparks = [];
  var now = 0;

  var glowSprite = (function () {
    var s = document.createElement("canvas");
    s.width = s.height = 64;
    var g2 = s.getContext("2d");
    var rg = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, "rgba(255,232,176,0.95)");
    rg.addColorStop(0.28, "rgba(255,205,132,0.42)");
    rg.addColorStop(0.62, "rgba(255,180,110,0.12)");
    rg.addColorStop(1, "rgba(255,170,100,0)");
    g2.fillStyle = rg;
    g2.beginPath(); g2.arc(32, 32, 32, 0, 6.284); g2.fill();
    return s;
  })();

  function resize() {
    DPR = Math.min(1.75, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
    sizeSea();
  }

  function build() {
    var area = W * H;
    var nStar = Math.min(140, Math.round(area / 9000));
    var nDust = Math.min(70, Math.round(area / 17000));
    var nFly = W < 500 ? 10 : 14;

    stars = [];
    for (var i = 0; i < nStar; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 1.35,
        r: Math.random() * 1.25 + 0.35,
        a: Math.random() * 0.55 + 0.18,
        ph: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.9 + 0.35
      });
    }
    dust = [];
    for (var j = 0; j < nDust; j++) {
      dust.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.6 + 0.5,
        vx: (Math.random() - 0.5) * 0.08,
        vy: -(Math.random() * 0.10 + 0.02),
        a: Math.random() * 0.35 + 0.10
      });
    }
    flies = [];
    for (var k = 0; k < nFly; k++) {
      flies.push({
        x: Math.random() * W,
        y: H * (0.40 + Math.random() * 0.54),
        r: Math.random() * 5 + 2.4,
        ph: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.5 + 0.25,
        sway: Math.random() * 24 + 10,
        a: Math.random() * 0.35 + 0.25
      });
    }
  }

  var meteors = [];

  function spawnMeteor() {
    if (reduced) return;
    var fromRight = Math.random() < 0.65;
    var x = fromRight ? W * (0.55 + Math.random() * 0.6) : W * Math.random();
    var y = H * (Math.random() * 0.42);
    var sp = 10 + Math.random() * 8;
    var ang = Math.PI * (0.72 + Math.random() * 0.1);   // 向左下
    meteors.push({
      x: x, y: y,
      vx: Math.cos(ang) * sp * (fromRight ? 1 : -1),
      vy: Math.sin(ang) * sp,
      len: 60 + Math.random() * 90,
      life: 1,
      decay: 0.004 + Math.random() * 0.004
    });
  }

  function addSpark(x, y) {
    if (sparks.length > 900) return;
    for (var i = 0; i < 2; i++) {
      sparks.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35 - 0.06,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        r: Math.random() * 1.7 + 0.5,
        hue: Math.random() < 0.5 ? "255,190,210" : "255,226,180"
      });
    }
  }

  var lastFrame = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    if (t - lastFrame < 27) return;   // 约 37 帧，够顺滑又省电
    lastFrame = t;
    now = t / 1000;
    ctx.clearRect(0, 0, W, H);
    var sc = window.scrollY || 0;

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = 0.55 + 0.45 * Math.sin(now * s.sp + s.ph);
      var y = s.y - sc * 0.08;
      y = ((y % (H * 1.35)) + H * 1.35) % (H * 1.35) - H * 0.15;
      ctx.globalAlpha = s.a * tw;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, 6.284);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    for (var d = 0; d < dust.length; d++) {
      var p = dust[d];
      p.x += p.vx; p.y += p.vy;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(now * 1.4 + d));
      ctx.fillStyle = "rgba(255,232,214,1)";
      ctx.beginPath();
      ctx.arc(p.x - sc * 0.03, p.y, p.r, 0, 6.284);
      ctx.fill();
    }

    for (var f = 0; f < flies.length; f++) {
      var o = flies[f];
      var fx = o.x + Math.sin(now * o.sp + o.ph) * o.sway;
      var fy = o.y + Math.cos(now * o.sp * 0.7 + o.ph) * o.sway * 0.5 - sc * 0.12;
      var glow = 0.35 + 0.65 * Math.max(0, Math.sin(now * 0.9 + o.ph));
      var R = o.r * 5;
      ctx.globalAlpha = glow * o.a;
      ctx.drawImage(glowSprite, fx - R, fy - R, R * 2, R * 2);
    }
    ctx.globalAlpha = 1;

    // 流星
    ctx.globalCompositeOperation = "lighter";
    for (var m = meteors.length - 1; m >= 0; m--) {
      var mt = meteors[m];
      mt.x += mt.vx * 1.9;
      mt.y += mt.vy * 1.9;
      mt.life -= mt.decay;
      if (mt.life <= 0 || mt.y > H + 80 || mt.x < -120 || mt.x > W + 120) {
        meteors.splice(m, 1);
        continue;
      }
      var tx = mt.x - mt.vx * (mt.len / 12);
      var ty = mt.y - mt.vy * (mt.len / 12);
      var lg = ctx.createLinearGradient(tx, ty, mt.x, mt.y);
      lg.addColorStop(0, "rgba(255,220,200,0)");
      lg.addColorStop(0.75, "rgba(255,232,214," + (0.35 * mt.life).toFixed(3) + ")");
      lg.addColorStop(1, "rgba(255,255,255," + (0.9 * mt.life).toFixed(3) + ")");
      ctx.strokeStyle = lg;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(mt.x, mt.y);
      ctx.stroke();
      ctx.globalAlpha = mt.life;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(mt.x, mt.y, 1.5, 0, 6.284);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.globalCompositeOperation = "lighter";
    for (var k = sparks.length - 1; k >= 0; k--) {
      var q = sparks[k];
      q.x += q.vx; q.y += q.vy;
      q.vy += (q.gy === undefined ? -0.0016 : q.gy);
      q.life -= q.decay;
      if (q.life <= 0) { sparks.splice(k, 1); continue; }
      ctx.globalAlpha = Math.max(0, q.life) * 0.85;
      ctx.fillStyle = "rgba(" + q.hue + ",1)";
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r * (0.6 + q.life * 0.9), 0, 6.284);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  /* ---------- 指针光点 ---------- */
  var lastPt = { x: -999, y: -999 };
  function onMove(e) {
    var x, y;
    if (e.touches) {
      if (!e.touches.length) return;
      x = e.touches[0].clientX; y = e.touches[0].clientY;
    } else {
      x = e.clientX; y = e.clientY;
    }
    var dx = x - lastPt.x, dy = y - lastPt.y;
    if (dx * dx + dy * dy < 26) return;
    lastPt.x = x; lastPt.y = y;
    if (!reduced) addSpark(x, y);
  }
  window.addEventListener("pointermove", onMove, { passive: true });

  /* ---------- 江面 ---------- */
  var seaCv = $("sea"), seaCtx = seaCv.getContext("2d");
  var seaW = 0, seaH = 0, seaVisible = false, seaStarted = false, seaT0 = 0;

  function moonX() {
    var mw = Math.min(96, W * 0.20);
    return W - W * 0.09 - mw / 2;
  }

  function sizeSea() {
    if (!seaCv) return;
    var r = seaCv.getBoundingClientRect();
    seaW = Math.max(1, r.width);
    seaH = Math.max(1, r.height);
    seaCv.width = Math.floor(seaW * DPR);
    seaCv.height = Math.floor(seaH * DPR);
    seaCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  var lastSea = 0;
  function drawSea(tms) {
    requestAnimationFrame(drawSea);
    if (!seaVisible || !seaW) return;
    if (document.hidden || tms - lastSea < 33) return;   // 约 30 帧
    lastSea = tms;
    var t = (tms - seaT0) / 1000;
    var w = seaW, h = seaH, c = seaCtx;
    c.clearRect(0, 0, w, h);

    // 水面底色
    var bg = c.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "rgba(18,8,24,0)");
    bg.addColorStop(0.30, "rgba(26,10,30,0.42)");
    bg.addColorStop(0.62, "rgba(14,6,22,0.80)");
    bg.addColorStop(1, "rgba(8,3,14,0.96)");
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);

    // 月光在水面拉出的光带
    var mx = moonX();
    c.globalCompositeOperation = "lighter";
    for (var i = 0; i < 44; i++) {
      var p = i / 44;
      var y = h * (0.02 + p * 0.92);
      var wob = Math.sin(y * 0.06 + t * 1.1) * (3 + p * 14) + Math.sin(y * 0.021 - t * 0.7) * (2 + p * 10);
      var alpha = (1 - p) * (0.10 + 0.12 * Math.abs(Math.sin(y * 0.05 + t * 0.9)));
      var ww = (4 + p * 26) * (0.7 + 0.5 * Math.abs(Math.sin(y * 0.04 + t)));
      c.globalAlpha = alpha;
      c.fillStyle = "rgba(255,226,190,1)";
      c.beginPath();
      c.ellipse(mx + wob, y, ww, 1.2 + p * 2.0, 0, 0, 6.284);
      c.fill();
    }
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;

    // 三层水波
    var layers = [
      { base: 0.30, amp: 5.0, freq: 0.011, speed: 0.55, col: "rgba(34,14,42,0.55)" },
      { base: 0.52, amp: 7.0, freq: 0.008, speed: 0.42, col: "rgba(24,9,32,0.75)" },
      { base: 0.76, amp: 9.0, freq: 0.006, speed: 0.33, col: "rgba(14,5,22,0.90)" }
    ];
    for (var L = 0; L < layers.length; L++) {
      var ly = layers[L];
      c.beginPath();
      c.moveTo(0, h);
      for (var x = 0; x <= w; x += 8) {
        var yy = h * ly.base
          + Math.sin(x * ly.freq + t * ly.speed + L * 1.7) * ly.amp
          + Math.sin(x * ly.freq * 2.3 - t * ly.speed * 0.7 + L) * ly.amp * 0.45;
        c.lineTo(x, yy);
      }
      c.lineTo(w, h);
      c.closePath();
      c.fillStyle = ly.col;
      c.fill();
    }

    // 水面碎光
    c.globalCompositeOperation = "lighter";
    for (var s2 = 0; s2 < 26; s2++) {
      var sx = (s2 * 137.5) % w;
      var sy = h * (0.32 + ((s2 * 0.617) % 0.62));
      var tw2 = 0.5 + 0.5 * Math.sin(t * 1.7 + s2 * 2.3);
      var sr = 0.8 + tw2 * 1.6;
      c.globalAlpha = 0.10 + tw2 * 0.35;
      c.fillStyle = "rgba(255,238,214,1)";
      c.beginPath();
      c.arc(sx + Math.sin(t * 0.6 + s2) * 6, sy, sr, 0, 6.284);
      c.fill();
    }
    c.globalAlpha = 1;

    // 波峰细光
    c.globalCompositeOperation = "lighter";
    for (var g2 = 0; g2 < 3; g2++) {
      var gl = layers[g2];
      c.beginPath();
      for (var x2 = 0; x2 <= w; x2 += 10) {
        var y2 = h * gl.base
          + Math.sin(x2 * gl.freq + t * gl.speed + g2 * 1.7) * gl.amp
          + Math.sin(x2 * gl.freq * 2.3 - t * gl.speed * 0.7 + g2) * gl.amp * 0.45;
        if (x2 === 0) c.moveTo(x2, y2); else c.lineTo(x2, y2);
      }
      c.strokeStyle = "rgba(255,205,180," + (0.05 + g2 * 0.03) + ")";
      c.lineWidth = 1;
      c.stroke();
    }
    c.globalCompositeOperation = "source-over";
  }

  /* ---------- 星座 ---------- */
  function heartPoints(n, cx, cy, scale) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var t = (i / n) * Math.PI * 2;
      var x = 16 * Math.pow(Math.sin(t), 3);
      var y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      pts.push([cx + x * scale, cy - y * scale]);
    }
    return pts;
  }

  function buildConstel() {
    var svg = $("constel");
    if (!svg) return;
    svg.innerHTML = "";
    var NS = "http://www.w3.org/2000/svg";
    var pts = heartPoints(19, 160, 150, 7.2);

    // 背景散星
    for (var b = 0; b < 14; b++) {
      var c0 = document.createElementNS(NS, "circle");
      c0.setAttribute("cx", (Math.random() * 320).toFixed(1));
      c0.setAttribute("cy", (Math.random() * 280).toFixed(1));
      c0.setAttribute("r", (Math.random() * 0.9 + 0.5).toFixed(2));
      c0.setAttribute("fill", "#ffffff");
      c0.setAttribute("opacity", (Math.random() * 0.4 + 0.15).toFixed(2));
      svg.appendChild(c0);
    }

    var path = document.createElementNS(NS, "path");
    var d = "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L") + " Z";
    path.setAttribute("d", d);
    path.setAttribute("class", "lnk");
    svg.appendChild(path);

    var L = 0;
    try { L = path.getTotalLength(); } catch (e) { L = 900; }
    if (!L || !isFinite(L)) L = 900;
    path.style.strokeDasharray = L;
    path.style.strokeDashoffset = L;

    pts.forEach(function (p, i) {
      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", p[0].toFixed(1));
      dot.setAttribute("cy", p[1].toFixed(1));
      dot.setAttribute("r", "2.6");
      dot.setAttribute("class", "pt");
      dot.style.transitionDelay = (0.4 + i * 0.12).toFixed(2) + "s";
      svg.appendChild(dot);

      var halo = document.createElementNS(NS, "circle");
      halo.setAttribute("cx", p[0].toFixed(1));
      halo.setAttribute("cy", p[1].toFixed(1));
      halo.setAttribute("r", "6");
      halo.setAttribute("fill", "rgba(255,205,190,.16)");
      svg.appendChild(halo);
    });

    var seen = false;
    if ("IntersectionObserver" in window) {
      var o = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting || seen) return;
          seen = true;
          svg.classList.add("in");
          requestAnimationFrame(function () { path.style.strokeDashoffset = "0"; });
        });
      }, { threshold: 0.45 });
      o.observe(svg);
    } else {
      svg.classList.add("in");
      path.style.strokeDashoffset = "0";
    }
  }

  /* ---------- 滚动 ---------- */
  var root = document.documentElement;
  var moon = $("moon");
  var prog = document.querySelector("#progress i");
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      var k = Math.min(1, Math.max(0, window.scrollY / max));
      root.style.setProperty("--warm", k.toFixed(3));
      if (prog) prog.style.width = (k * 100).toFixed(2) + "%";
      if (moon) {
        moon.style.transform = "translate3d(0," + (k * 40).toFixed(1) + "px,0) scale(" + (1 - k * 0.16).toFixed(3) + ")";
        moon.style.opacity = String(Math.max(0.15, 1 - k * 0.75));
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- 进场 ---------- */
  var io = null;
  function observeReveal() {
    if (io) io.disconnect();
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add("in"); });
      return;
    }
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ---------- 渲染 ---------- */
  var countObs = null;
  function render() {
    $("nameText").textContent = cfg.name;
    $("nameCaption").textContent = cfg.cap;
    $("seaQuote").textContent = cfg.sea;
    $("starQuote").textContent = cfg.star;
    $("endBig").textContent = cfg.end;
    $("endSub").textContent = cfg.endSub;
    $("signText").textContent = cfg.sign;
    $("colophonName").textContent = cfg.name;
    if ($("msgHint")) $("msgHint").textContent = cfg.msgTip;
    document.title = cfg.name;

    var d = new Date();
    $("stampText").textContent = d.getFullYear() + " . " + ("0" + (d.getMonth() + 1)).slice(-2) + " . " + ("0" + d.getDate()).slice(-2);

    var num = $("daysNum"), lab = $("daysLabel"), since = $("daysSince");
    var days = 0, valid = false, sd = null;
    if (cfg.since) {
      sd = new Date(cfg.since + "T00:00:00");
      if (!isNaN(sd.getTime())) {
        valid = true;
        var t0 = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate());
        var t1 = new Date(); t1 = new Date(t1.getFullYear(), t1.getMonth(), t1.getDate());
        days = Math.floor((t1 - t0) / 86400000) + 1;
        if (days < 1) days = 1;
      }
    }
    if (valid) {
      lab.textContent = "我 们 已 经 走 过";
      num.textContent = "0";
      num.dataset.days = String(days);
      num.dataset.count = "1";
      since.textContent = "从 " + sd.getFullYear() + "." + ("0" + (sd.getMonth() + 1)).slice(-2) + "." + ("0" + sd.getDate()).slice(-2) + " 开始";
    } else {
      lab.textContent = "往 后 的 每 一 天";
      num.textContent = "∞";
      num.dataset.count = "0";
      since.textContent = "都 算 数";
    }

    renderSweet();
    renderTimeline();
    resetWish();

    observeReveal();
    bindCount();
    bindSea();
  }

  /* ---------- 情话卡 ---------- */
  var sweetIdx = -1;
  function renderSweet() {
    var el = $("sweetLine");
    if (!el) return;
    sweetIdx = -1;
    el.classList.remove("out");
    el.textContent = "今晚想对你说一句话";
  }
  function nextSweet() {
    var list = cfg.sweet.filter(function (x) { return String(x).trim(); });
    if (!list.length) return;
    sweetIdx = (sweetIdx + 1) % list.length;
    var el = $("sweetLine");
    el.classList.add("out");
    setTimeout(function () {
      el.textContent = list[sweetIdx];
      el.classList.remove("out");
    }, 280);
  }

  /* ---------- 时间轴 ---------- */
  function renderTimeline() {
    var ol = $("timeline");
    if (!ol) return;
    ol.innerHTML = "";
    cfg.timeline.forEach(function (raw) {
      var s = String(raw).trim();
      if (!s) return;
      var i = s.indexOf("|");
      var title = i > -1 ? s.slice(0, i).trim() : "";
      var desc = i > -1 ? s.slice(i + 1).trim() : s;
      var li = document.createElement("li");
      li.className = "reveal";
      var dot = document.createElement("span");
      dot.className = "dot";
      li.appendChild(dot);
      if (title) {
        var t = document.createElement("p");
        t.className = "tl-t";
        t.textContent = title;
        li.appendChild(t);
      }
      var d = document.createElement("p");
      d.className = "tl-d";
      d.textContent = desc;
      li.appendChild(d);
      ol.appendChild(li);
    });
  }

  /* ---------- 许愿 ---------- */
  function resetWish() {
    var w = $("wishDone");
    if (w) { w.textContent = ""; w.classList.remove("in"); }
    var b = $("wishBtn");
    if (b) b.disabled = false;
  }
  function makeWish() {
    var b = $("wishBtn"), w = $("wishDone");
    if (b) b.disabled = true;
    for (var i = 0; i < 9; i++) {
      (function (i) { setTimeout(spawnMeteor, i * 160); })(i);
    }
    // 从画面下方升起的光点
    for (var s = 0; s < 90; s++) {
      sparks.push({
        x: W * 0.5 + (Math.random() - 0.5) * W * 0.7,
        y: H * (0.72 + Math.random() * 0.2),
        vx: (Math.random() - 0.5) * 2.4,
        vy: -(2.4 + Math.random() * 3.6),
        life: 1,
        decay: 0.004 + Math.random() * 0.005,
        r: Math.random() * 2 + 0.8,
        hue: Math.random() < 0.5 ? "255,214,150" : "255,180,205"
      });
    }
    if (navigator.vibrate) try { navigator.vibrate([20, 50, 20, 50, 60]); } catch (e) {}
    if (w) {
      setTimeout(function () {
        w.textContent = cfg.wish;
        w.classList.add("in");
      }, 900);
    }
  }

  function bindCount() {
    var el = $("daysNum");
    if (!el) return;
    if (countObs) { countObs.disconnect(); countObs = null; }
    if (!("IntersectionObserver" in window)) {
      el.textContent = el.dataset.count === "1" ? (el.dataset.days || "0") : "\u221e";
      return;
    }
    var fired = false;
    countObs = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting || fired) return;
        fired = true;
        if (el.dataset.count !== "1") return;
        var target = parseInt(el.dataset.days || "0", 10);
        var t0 = performance.now(), dur = 1700;
        (function step(tt) {
          var k = Math.min(1, (tt - t0) / dur);
          el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.5 });
    countObs.observe(el);
  }

  var seaObs = null;
  function bindSea() {
    if (!seaCv) return;
    if (seaObs) { seaObs.disconnect(); seaObs = null; }
    if (!("IntersectionObserver" in window)) {
      seaVisible = true; sizeSea();
      if (!seaStarted) { seaStarted = true; seaT0 = performance.now(); requestAnimationFrame(drawSea); }
      return;
    }
    seaObs = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) {
          seaVisible = true;
          sizeSea();
          if (!seaStarted) {
            seaStarted = true;
            seaT0 = performance.now();
            requestAnimationFrame(drawSea);
          }
        } else if (!en.isIntersecting) {
          seaVisible = false;
        }
      });
    }, { threshold: 0.05 });
    seaObs.observe(seaCv);
  }

  /* ---------- 声音：和声铺底 + 风铃 ---------- */
  var actx = null, musicOn = false, master = null, chordTimer = null, bellTimer = null;
  var CHORDS = [
    [110.00, 164.81, 261.63],  // Am
    [87.31, 130.81, 220.00],   // F
    [130.81, 164.81, 196.00],  // C
    [98.00, 146.83, 246.94]    // G
  ];
  var chordIdx = 0;

  function ensureCtx() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }

  function playChord(freqs, when, dur) {
    var ac = actx;
    var lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(420, when);
    lp.frequency.linearRampToValueAtTime(760, when + dur * 0.5);
    lp.Q.value = 0.5;
    lp.connect(master);

    freqs.forEach(function (f, i) {
      var o = ac.createOscillator();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 6;
      var g = ac.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(i === 0 ? 0.5 : 0.16, when + 2.6);
      g.gain.linearRampToValueAtTime(0, when + dur);
      o.connect(g); g.connect(lp);
      o.start(when);
      o.stop(when + dur + 0.2);
    });
  }

  function chordStep() {
    if (!musicOn) return;
    var dur = 9.5;
    playChord(CHORDS[chordIdx % CHORDS.length], actx.currentTime + 0.05, dur + 1.2);
    chordIdx++;
    chordTimer = setTimeout(chordStep, dur * 1000);
  }

  var BELL = [523.25, 587.33, 698.46, 783.99, 880.0, 1046.5];
  function bell() {
    if (!musicOn) return;
    var ac = actx;
    var f = BELL[Math.floor(Math.random() * BELL.length)];
    var t = ac.currentTime + 0.02;
    var g = ac.createGain();
    var o = ac.createOscillator(), o2 = ac.createOscillator();
    o.type = "triangle"; o2.type = "sine";
    o.frequency.value = f; o2.frequency.value = f * 2.01;
    var g2 = ac.createGain(); g2.gain.value = 0.13;
    o.connect(g); o2.connect(g2); g2.connect(g);
    g.connect(master);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);
    o.start(t); o2.start(t);
    o.stop(t + 4.4); o2.stop(t + 4.4);
    bellTimer = setTimeout(bell, 5000 + Math.random() * 6000);
  }

  function musicStart() {
    if (musicOn) return;
    var ac = ensureCtx();
    if (!ac) return;
    musicOn = true;
    $("musicBtn").classList.add("on");
    if (!master) {
      master = ac.createGain();
      master.gain.value = 0;
      master.connect(ac.destination);
    }
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setValueAtTime(master.gain.value, ac.currentTime);
    master.gain.linearRampToValueAtTime(0.34, ac.currentTime + 5);
    chordStep();
    bellTimer = setTimeout(bell, 1500);
  }
  function musicStop() {
    musicOn = false;
    $("musicBtn").classList.remove("on");
    clearTimeout(chordTimer); clearTimeout(bellTimer);
    if (master && actx) {
      master.gain.cancelScheduledValues(actx.currentTime);
      master.gain.setValueAtTime(master.gain.value, actx.currentTime);
      master.gain.linearRampToValueAtTime(0, actx.currentTime + 1.2);
    }
  }
  $("musicBtn").addEventListener("click", function (e) {
    e.stopPropagation();
    if (musicOn) musicStop(); else musicStart();
  });


  /* ---------- 编码 ---------- */
  function b64enc(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64dec(code) {
    try {
      var b = String(code).trim().replace(/-/g, "+").replace(/_/g, "/");
      while (b.length % 4) b += "=";
      var bin = atob(b);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch (e) { return null; }
  }

  /* ---------- 留言 ---------- */
  var MSG_KEY = "forJiang.msgs.v1";
  function getMsgs() {
    try { var a = JSON.parse(localStorage.getItem(MSG_KEY) || "[]"); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function setMsgs(a) {
    try { localStorage.setItem(MSG_KEY, JSON.stringify(a.slice(-60))); } catch (e) {}
  }
  function addMsg(m) { var a = getMsgs(); a.push(m); setMsgs(a); return a; }

  function fmtTime(ts) {
    var d = new Date(ts);
    function p(n) { return ("0" + n).slice(-2); }
    return d.getFullYear() + "." + p(d.getMonth() + 1) + "." + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function renderAdmin() {
    var box = $("adminList");
    if (!box) return;
    box.innerHTML = "";
    var list = getMsgs().slice().reverse();
    if (!list.length) {
      var e = document.createElement("p");
      e.className = "emptyMsgs";
      e.textContent = "还没有留言。她写完把回信码发你，粘到下面就能收到。";
      box.appendChild(e);
      return;
    }
    list.forEach(function (m) {
      var item = document.createElement("div");
      item.className = "msgItem";
      var meta = document.createElement("div");
      meta.className = "meta";
      var left = document.createElement("span");
      var nm = document.createElement("b");
      nm.textContent = m.n || cfg.name;
      left.appendChild(nm);
      if (m.from) left.appendChild(document.createTextNode(" · " + m.from));
      var right = document.createElement("span");
      var time = document.createElement("span");
      time.textContent = fmtTime(m.d || Date.now());
      var rm = document.createElement("button");
      rm.className = "rm";
      rm.textContent = "删除";
      rm.addEventListener("click", function () {
        var all = getMsgs().filter(function (x) { return !(x.d === m.d && x.t === m.t); });
        setMsgs(all);
        renderAdmin();
      });
      right.appendChild(time);
      right.appendChild(rm);
      meta.appendChild(left);
      meta.appendChild(right);
      var p = document.createElement("p");
      p.textContent = m.t || "";
      item.appendChild(meta);
      item.appendChild(p);
      box.appendChild(item);
    });
  }

  /* 密码：0604 */
  var PIN = "0604";
  function pinOk() { try { return sessionStorage.getItem("forJiang.pin") === "1"; } catch (e) { return false; } }
  function pinPass() { try { sessionStorage.setItem("forJiang.pin", "1"); } catch (e) {} }

  function showPin() {
    var p = $("pin");
    $("pinInput").value = "";
    $("pinErr").textContent = "";
    p.classList.add("open");
    setTimeout(function () { $("pinInput").focus(); }, 260);
  }
  function hidePin() { $("pin").classList.remove("open"); }

  function openAdmin() {
    renderAdmin();
    $("admin").classList.add("open");
    document.body.classList.add("dimmed");
    hideCorners(true);
  }

  function openAdminGuarded() {
    if (pinOk()) { openAdmin(); return; }
    showPin();
  }

  function tryPin() {
    var v = ($("pinInput").value || "").trim();
    if (v === PIN) {
      pinPass();
      hidePin();
      openAdmin();
    } else {
      $("pinErr").textContent = "密码不对";
      $("pinInput").value = "";
      $("pinInput").focus();
      if (navigator.vibrate) try { navigator.vibrate([12, 40, 12]); } catch (e) {}
    }
  }
  $("pinOk").addEventListener("click", tryPin);
  $("pinCancel").addEventListener("click", hidePin);
  $("pinInput").addEventListener("keydown", function (e) { if (e.key === "Enter") tryPin(); });

  function sendMessage() {
    var ta = $("msgInput");
    var text = (ta.value || "").trim();
    if (!text) { ta.focus(); return; }
    var m = { n: cfg.name, t: text, d: Date.now() };
    addMsg(m);
    var code = b64enc(JSON.stringify(m));
    $("msgCode").value = code;
    $("msgBox").style.display = "none";
    $("msgBack").classList.add("on");
    if (navigator.vibrate) try { navigator.vibrate([16, 40, 24]); } catch (e) {}
  }

  function copyCode() {
    var code = $("msgCode");
    var val = code.value;
    function fallback() {
      code.focus(); code.select();
      try { document.execCommand("copy"); } catch (e) {}
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(val).then(function () {
        $("copyCode").textContent = "已复制 ✓";
      }).catch(fallback);
    } else {
      fallback();
      $("copyCode").textContent = "已选中，长按复制";
    }
    setTimeout(function () { $("copyCode").textContent = "复 制 回 信 码"; }, 2600);
  }

  function importCode() {
    var raw = ($("codeIn").value || "").trim();
    if (!raw) return;
    var txt = b64dec(raw) || raw;
    var obj = null;
    try { obj = JSON.parse(txt); } catch (e) { obj = null; }
    if (!obj || !obj.t) {
      alert("这串码看不懂，确认整段都复制了吗？");
      return;
    }
    addMsg({ n: obj.n || cfg.name, t: obj.t, d: obj.d || Date.now(), from: "回信码" });
    $("codeIn").value = "";
    renderAdmin();
    alert("收到了。");
  }

  /* ---------- 烟花（长按任意处） ---------- */
  function fireworks(x, y) {
    var hues = ["255,170,200", "255,222,150", "185,200,255", "255,150,120", "255,240,230"];
    for (var i = 0; i < 54; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 1.2 + Math.random() * 4.6;
      sparks.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        decay: 0.011 + Math.random() * 0.012,
        r: Math.random() * 1.9 + 0.7,
        hue: hues[i % hues.length],
        gy: 0.055
      });
    }
    if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {}
  }

  var lpTimer = null, lpStart = null;
  document.addEventListener("pointerdown", function (e) {
    var t = e.target;
    if (t && t.closest && t.closest("button,input,textarea,a,label,#admin,#edit")) return;
    lpStart = { x: e.clientX, y: e.clientY };
    lpTimer = setTimeout(function () {
      lpTimer = null;
      if (lpStart) fireworks(lpStart.x, lpStart.y);
    }, 620);
  }, { passive: true });
  document.addEventListener("pointermove", function (e) {
    if (!lpTimer || !lpStart) return;
    var dx = e.clientX - lpStart.x, dy = e.clientY - lpStart.y;
    if (dx * dx + dy * dy > 220) { clearTimeout(lpTimer); lpTimer = null; }
  }, { passive: true });
  function endLP() { clearTimeout(lpTimer); lpTimer = null; }
  document.addEventListener("pointerup", endLP, { passive: true });
  document.addEventListener("pointercancel", endLP, { passive: true });

  /* ---------- 面板打开时收起角落按钮 ---------- */
  function hideCorners(on) {
    ["gearBtn", "musicBtn"].forEach(function (id) {
      var el = $(id);
      if (el) el.style.display = on ? "none" : "";
    });
  }

  /* ---------- 后台入口 ---------- */
  function closeAdmin() {
    $("admin").classList.remove("open");
    document.body.classList.remove("dimmed");
    hideCorners(false);
  }
  $("adminClose").addEventListener("click", closeAdmin);
  $("admin").addEventListener("click", function (e) { if (e.target === this) closeAdmin(); });
  $("importCode").addEventListener("click", importCode);
  $("clearMsgs").addEventListener("click", function () {
    if (!confirm("清空这台手机上的所有留言？")) return;
    setMsgs([]);
    renderAdmin();
  });

  /* ---------- 导出成品 ---------- */
  function exportPage() {
    var base = location.origin + location.pathname;
    Promise.all([
      fetch(base, { cache: "no-store" }).then(function (r) { return r.text(); }),
      fetch("atmos.css", { cache: "no-store" }).then(function (r) { return r.text(); }),
      fetch("atmos.js", { cache: "no-store" }).then(function (r) { return r.text(); })
    ]).then(function (res) {
      var html = res[0], css = res[1], js = res[2];
      html = html.replace(/<link[^>]*atmos\.css[^>]*>/, function () { return "<style>\n" + css + "\n</style>"; });
      html = html.replace(/<link[^>]*manifest[^>]*>/, "");
      var cfgJson = JSON.stringify(cfg).replace(/</g, "\\u003c");
      var payload = "<script>window.__CFG__=" + cfgJson + ";<\/script>\n<script>\n" + js + "\n<\/script>";
      html = html.replace(/<script[^>]*atmos\.js[^>]*><\/script>/, function () { return payload; });
      var blob = new Blob([html], { type: "text/html;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "letter.html";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(url);
        a.remove();
      }, 2500);
      $("exportTip").textContent = "已经导出，去「下载」里找 " + a.download;
      $("exportTip").classList.add("on");
    }).catch(function () {
      $("exportTip").textContent = "导出失败：要用 http:// 地址打开本页才能导出。";
      $("exportTip").classList.add("on");
    });
  }
  $("exportBtn").addEventListener("click", exportPage);

  $("msgSend").addEventListener("click", sendMessage);
  $("copyCode").addEventListener("click", copyCode);

  /* ---------- 编辑 ---------- */
  function openEdit() {
    $("fName").value = cfg.name;
    $("fCap").value = cfg.cap;
    $("fSea").value = cfg.sea;
    $("fStar").value = cfg.star;
    $("fSweet").value = cfg.sweet.join("\n");
    $("fTl").value = cfg.timeline.join("\n");
    $("fSince").value = cfg.since || "";
    $("fEnd").value = cfg.end;
    $("fEndSub").value = cfg.endSub;
    $("fSign").value = cfg.sign;
    $("fMsgTip").value = cfg.msgTip;
    $("edit").classList.add("open");
    document.body.classList.add("dimmed");
    hideCorners(true);
  }
  var gearLong = false, gearTimer = null;
  $("gearBtn").addEventListener("pointerdown", function () {
    gearLong = false;
    gearTimer = setTimeout(function () { gearLong = true; openAdminGuarded(); }, 900);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
    $("gearBtn").addEventListener(ev, function () { clearTimeout(gearTimer); });
  });
  $("gearBtn").addEventListener("click", function (e) {
    e.stopPropagation();
    if (gearLong) { gearLong = false; return; }
    openEdit();
  });

  $("saveBtn").addEventListener("click", function () {
    cfg.name = $("fName").value.trim() || DEFAULTS.name;
    cfg.cap = $("fCap").value.trim() || DEFAULTS.cap;
    cfg.sea = $("fSea").value.trim() || DEFAULTS.sea;
    cfg.star = $("fStar").value.trim() || DEFAULTS.star;
    cfg.sweet = $("fSweet").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    if (!cfg.sweet.length) cfg.sweet = DEFAULTS.sweet.slice();
    cfg.timeline = $("fTl").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    if (!cfg.timeline.length) cfg.timeline = DEFAULTS.timeline.slice();
    cfg.since = $("fSince").value || "";
    cfg.end = $("fEnd").value.trim() || DEFAULTS.end;
    cfg.endSub = $("fEndSub").value.trim() || DEFAULTS.endSub;
    cfg.sign = $("fSign").value.trim() || DEFAULTS.sign;
    cfg.msgTip = $("fMsgTip").value.trim() || DEFAULTS.msgTip;
    save();
    closeEdit();
    buildConstel();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  $("resetBtn").addEventListener("click", function () {
    if (!confirm("恢复默认文字？你改的内容会清空。")) return;
    cfg = JSON.parse(JSON.stringify(DEFAULTS));
    save();
    openEdit();
  });

  function closeEdit() {
    $("edit").classList.remove("open");
    document.body.classList.remove("dimmed");
    hideCorners(false);
  }
  $("edit").addEventListener("click", function (e) { if (e.target === this) closeEdit(); });

  $("sweetBtn").addEventListener("click", function () {
    nextSweet();
    if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) {}
  });
  $("wishBtn").addEventListener("click", makeWish);

  $("topBtn").addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- 启动 ---------- */
  resize();
  window.addEventListener("resize", function () { resize(); }, { passive: true });
  window.addEventListener("orientationchange", function () { setTimeout(resize, 260); });
  buildConstel();
  render();
  onScroll();
  requestAnimationFrame(frame);

  (function ambient() {
    if (!reduced) spawnMeteor();
    setTimeout(ambient, 9000 + Math.random() * 9000);
  })();

  if (!location.hash) {
    var topAt = Date.now();
    var lockTop = function () {
      if (Date.now() - topAt > 1600) { document.removeEventListener("scroll", lockTop); return; }
      try {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
        document.documentElement.style.scrollBehavior = "";
      } catch (e) {}
    };
    document.addEventListener("scroll", lockTop, { passive: true });
    lockTop();
    [0, 60, 160, 320, 600, 900, 1300, 1600].forEach(function (ms) { setTimeout(lockTop, ms); });
  }
  if (/[?&]wish/.test(location.search)) setTimeout(makeWish, 1200);
  if (/[?&]admin/.test(location.search)) openAdminGuarded();

  if ("serviceWorker" in navigator && /^http/.test(location.protocol)) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
