/** OHIF Viewer config for pacs.rentgen.az — data source = Orthanc DICOMweb behind /orthanc/ */
(function () {
  // Header bar: who is logged in (session cookie → /whoami). Filled into #rx-user below.
  var user = null;
  function paint() {
    var el = document.getElementById('rx-user');
    if (!el || !user) return;
    var name = user.name || '';
    el.textContent = !name || name === user.roleLabel ? (user.roleLabel || '') : name + ' · ' + user.roleLabel;
    var lo = document.getElementById('rx-logout');
    if (lo) lo.style.display = 'inline-flex';
  }
  fetch('/whoami', { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { user = d; paint(); })
    .catch(function () {});
  var tries = 0;
  var t = setInterval(function () { paint(); if (++tries > 120) clearInterval(t); }, 500);
  window.__rxPaintUser = paint;
})();


(function () {
  // ---- AI köməkçi (rentgen.az) — çat + sahə seçimi ----------------------
  var BTN_ID = 'rx-ai-btn', PANEL_ID = 'rx-ai-panel';
  var convo = []; // {role:'user'|'assistant', parts:[{type:'text',text}|{type:'image',dataUrl}], label}
  function el(tag, css, html) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (html != null) e.innerHTML = html; return e; }

  function svgFor(canvas) {
    var p = canvas.parentElement;
    for (var i = 0; i < 3 && p; i++) { var sv = p.querySelector && p.querySelector('svg'); if (sv) return sv; p = p.parentElement; }
    return null;
  }

  function captureOne(c, opts) {
    return new Promise(function (resolve) {
      try {
        var maxDim = (opts && opts.maxDim) || 1100;
        var k = Math.min(1, maxDim / Math.max(c.width, c.height));
        var t = document.createElement('canvas');
        t.width = Math.round(c.width * k); t.height = Math.round(c.height * k);
        var ctx = t.getContext('2d');
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, t.width, t.height);
        ctx.drawImage(c, 0, 0, t.width, t.height);
        var done = function () {
          var d = ctx.getImageData(0, 0, t.width, t.height).data;
          var sum = 0, n = 0;
          for (var i = 0; i < d.length; i += 4096) { sum += d[i]; n++; }
          var mean = sum / n, varr = 0;
          for (var j = 0; j < d.length; j += 4096) { varr += Math.pow(d[j] - mean, 2); }
          if (varr / n < 15 && !(opts && opts.keepBlank)) return resolve(null);
          resolve({ canvas: t, scale: k, src: c });
        };
        // annotasiya/crosshair SVG qatını üstünə çək
        var sv = svgFor(c);
        if (sv) {
          try {
            var xml = new XMLSerializer().serializeToString(sv);
            var img = new Image();
            img.onload = function () { try { ctx.drawImage(img, 0, 0, t.width, t.height); } catch (e) {} done(); };
            img.onerror = done;
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
            return;
          } catch (e) {}
        }
        done();
      } catch (e) { resolve(null); }
    });
  }

  function viewportCanvases() {
    var all = Array.prototype.slice.call(document.querySelectorAll('canvas'));
    return all.filter(function (c) { return c.width >= 220 && c.height >= 220; });
  }

  function captureAll() {
    var cs = viewportCanvases();
    return Promise.all(cs.map(function (c) { return captureOne(c); })).then(function (r) { return r.filter(Boolean).slice(0, 4); });
  }

  function getStudyUid() {
    try { return new URLSearchParams(location.search).get('StudyInstanceUIDs') || ''; } catch (e) { return ''; }
  }
  function sliceInfo() {
    var m = (document.body.innerText || '').match(/I:\s*\d+\s*\((\d+)\/(\d+)\)/);
    return m ? ('görünən kəsim ' + m[1] + '/' + m[2]) : '';
  }

  // ---------- panel / çat ----------
  function ensurePanel() {
    var p = document.getElementById(PANEL_ID);
    if (p) return p;
    p = el('div', 'position:fixed;top:60px;right:12px;width:400px;max-width:94vw;height:calc(100vh - 84px);z-index:9999;background:#0b1220;border:1px solid rgba(148,163,184,.35);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.55);display:flex;flex-direction:column;font-family:inherit;');
    p.id = PANEL_ID;
    var head = el('div', 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(148,163,184,.25);color:#e2e8f0;font-weight:600;font-size:14px;flex:0 0 auto;', '\u2728 AI k\u00f6m\u0259k\u00e7i');
    var actions = el('div', 'display:flex;gap:8px;align-items:center;');
    var sel = el('button', 'background:none;border:1px solid rgba(129,140,248,.5);border-radius:8px;color:#a5b4fc;font-size:12px;padding:3px 10px;cursor:pointer;', '\u25a3 Sah\u0259 se\u00e7');
    sel.onclick = startRegionSelect;
    var segb = el('button', 'background:none;border:1px solid rgba(52,211,153,.5);border-radius:8px;color:#6ee7b7;font-size:12px;padding:3px 10px;cursor:pointer;', '\ud83e\uddb4 Seqment');
    segb.onclick = requestSegmentation;
    var copy = el('button', 'background:none;border:1px solid rgba(148,163,184,.35);border-radius:8px;color:#94a3b8;font-size:12px;padding:3px 10px;cursor:pointer;', 'Kopyala');
    copy.onclick = function () {
      var last = convo.filter(function (m) { return m.role === 'assistant'; }).pop();
      navigator.clipboard.writeText(last ? last.parts.map(function (x) { return x.text || ''; }).join('\n') : '').then(function () { copy.textContent = 'Kopyaland\u0131 \u2713'; setTimeout(function () { copy.textContent = 'Kopyala'; }, 1500); });
    };
    var close = el('button', 'background:none;border:0;color:#94a3b8;font-size:18px;cursor:pointer;line-height:1;', '\u00d7');
    close.onclick = function () { p.remove(); };
    actions.appendChild(sel); actions.appendChild(segb); actions.appendChild(copy); actions.appendChild(close); head.appendChild(actions);
    var body = el('div', 'flex:1 1 auto;padding:12px 14px;color:#cbd5e1;font-size:13.5px;line-height:1.55;overflow:auto;');
    body.id = PANEL_ID + '-body';
    var foot = el('div', 'flex:0 0 auto;display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(148,163,184,.25);');
    var inp = el('textarea', 'flex:1;background:#111a2e;border:1px solid rgba(148,163,184,.35);border-radius:10px;color:#e2e8f0;font-size:13px;padding:8px 10px;resize:none;height:40px;font-family:inherit;');
    inp.id = PANEL_ID + '-inp';
    inp.placeholder = 'Sual ver\u2026 (m\u0259s: sin\u00fcslar\u0131 qiym\u0259tl\u0259ndir)';
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuestion(); } });
    var go = el('button', 'background:#4f46e5;border:0;border-radius:10px;color:#fff;font-weight:700;font-size:13px;padding:0 16px;cursor:pointer;', 'G\u00f6nd\u0259r');
    go.id = PANEL_ID + '-go';
    go.onclick = sendQuestion;
    foot.appendChild(inp); foot.appendChild(go);
    p.appendChild(head); p.appendChild(body); p.appendChild(foot);
    document.body.appendChild(p);
    return p;
  }

  function addMsg(role, html, thumbs) {
    ensurePanel();
    var body = document.getElementById(PANEL_ID + '-body');
    var wrap = el('div', 'margin-bottom:12px;');
    if (thumbs && thumbs.length) {
      var row = el('div', 'display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;');
      thumbs.forEach(function (u) { var im = el('img', 'height:52px;border-radius:6px;border:1px solid rgba(148,163,184,.35);'); im.src = u; row.appendChild(im); });
      wrap.appendChild(row);
    }
    var bub = el('div',
      role === 'user'
        ? 'background:#1e293b;border-radius:10px;padding:8px 11px;color:#e2e8f0;white-space:pre-wrap;'
        : role === 'sys'
          ? 'color:#94a3b8;font-style:italic;white-space:pre-wrap;'
          : 'background:#111a2e;border:1px solid rgba(148,163,184,.2);border-radius:10px;padding:9px 12px;white-space:pre-wrap;');
    bub.textContent = html;
    wrap.appendChild(bub);
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
    return bub;
  }

  function setBusy(on) {
    var go = document.getElementById(PANEL_ID + '-go');
    var btn = document.getElementById(BTN_ID);
    [go, btn].forEach(function (b) { if (b) { b.disabled = on; b.style.opacity = on ? '0.55' : '1'; } });
  }

  function callApi(statusText) {
    setBusy(true);
    var status = addMsg('sys', statusText || 'Analiz olunur\u2026 (ad\u0259t\u0259n 20-60 saniy\u0259)');
    var messages = convo.map(function (m) { return { role: m.role, content: m.parts }; });
    return fetch('/ai', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ studyUid: getStudyUid(), messages: messages, sliceInfo: sliceInfo() }),
    }).then(function (r) { return r.json(); }).then(function (d) {
      status.parentElement.remove();
      if (d.ok) {
        convo.push({ role: 'assistant', parts: [{ type: 'text', text: d.draft }] });
        addMsg('assistant', d.draft);
      } else {
        addMsg('sys', 'X\u0259ta: ' + (d.error || 'cavab al\u0131nmad\u0131'));
      }
    }).catch(function () { status.parentElement.remove(); addMsg('sys', '\u015e\u0259b\u0259k\u0259 x\u0259tas\u0131 \u2014 yenid\u0259n c\u0259hd edin.'); })
      .finally(function () { setBusy(false); });
  }

  function firstRun() {
    ensurePanel();
    captureAll().then(function (caps) {
      if (!caps.length) { addMsg('sys', 'G\u00f6r\u00fcnt\u00fc tap\u0131lmad\u0131 \u2014 \u0259vv\u0259l k\u0259sim g\u00f6r\u00fcn\u0259n olsun.'); return; }
      var parts = caps.map(function (c) { return { type: 'image', dataUrl: c.canvas.toDataURL('image/jpeg', 0.85) }; });
      parts.push({ type: 'text', text: 'Bu g\u00f6r\u00fcnt\u00fcl\u0259r \u00fczr\u0259 ilkin t\u0259svir qaralama\u0131 haz\u0131rla.' });
      convo = [{ role: 'user', parts: parts }];
      addMsg('user', 'Qaralama haz\u0131rla', parts.filter(function (x) { return x.type === 'image'; }).map(function (x) { return x.dataUrl; }));
      callApi();
    });
  }

  function sendQuestion() {
    var inp = document.getElementById(PANEL_ID + '-inp');
    var q = (inp.value || '').trim();
    if (!q) return;
    inp.value = '';
    captureAll().then(function (caps) {
      var parts = caps.map(function (c) { return { type: 'image', dataUrl: c.canvas.toDataURL('image/jpeg', 0.85) }; });
      parts.push({ type: 'text', text: q + '\n(\u018flav\u0259 olunan \u015f\u0259kill\u0259r \u2014 h\u0259kimin HAZIRKI ekran\u0131d\u0131r; \u0259vv\u0259lki \u015f\u0259kill\u0259rd\u0259n f\u0259rql\u0259n\u0259 bil\u0259r.)' });
      convo.push({ role: 'user', parts: parts });
      addMsg('user', q);
      callApi('Cavab haz\u0131rlan\u0131r\u2026');
    });
  }

  // ---------- seqmentasiya ----------
  var segPolling = false;
  function requestSegmentation() {
    ensurePanel();
    var modality = /\bMR\b/.test(document.body.innerText) ? 'MR' : 'CT';
    var task = 'teeth';
    try {
      var t = prompt('Seqmentasiya n\u00f6v\u00fc:\n  teeth \u2014 dental CBCT (di\u015fl\u0259r FDI il\u0259, \u00e7\u0259n\u0259l\u0259r, kanallar, sinuslar)\n  total \u2014 b\u00fct\u00fcn b\u0259d\u0259n CT (104 struktur)\n  headneck_bones_vessels \u2014 ba\u015f-boyun s\u00fcm\u00fck/damar', 'teeth');
      if (t === null) return;
      task = (t || 'teeth').trim();
    } catch (e) {}
    addMsg('sys', 'Seqmentasiya sifari\u015f edildi (' + task + ') \u2014 CPU serverd\u0259 5-20 d\u0259q \u00e7\u0259k\u0259 bil\u0259r. Haz\u0131r olanda bildiri\u015f g\u0259l\u0259c\u0259k, s\u0259hif\u0259ni yenil\u0259yin.');
    fetch('/segment', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ studyUid: getStudyUid(), task: task }),
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.ok) { addMsg('sys', 'X\u0259ta: ' + (d.error || '')); return; }
      if (!segPolling) { segPolling = true; pollSeg(); }
    }).catch(function () { addMsg('sys', '\u015e\u0259b\u0259k\u0259 x\u0259tas\u0131.'); });
  }
  function pollSeg() {
    setTimeout(function () {
      fetch('/segment-status?studyUid=' + encodeURIComponent(getStudyUid()), { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.status === 'done') {
            segPolling = false;
            addMsg('sys', '\u2705 Seqmentasiya haz\u0131rd\u0131r! S\u0259hif\u0259ni yenil\u0259yin (\u2318R) \u2014 sol panel\u0259 SEG seriyas\u0131 d\u00fc\u015f\u0259c\u0259k; \u00fcz\u0259rin\u0259 iki d\u0259f\u0259 klik \u2192 r\u0259ngli strukturlar + adlar sa\u011f "Segmentation" panelind\u0259.');
          } else if (d.status === 'failed') {
            segPolling = false;
            addMsg('sys', '\u274c Seqmentasiya al\u0131nmad\u0131: ' + (d.error || ''));
          } else { pollSeg(); }
        }).catch(function () { pollSeg(); });
    }, 20000);
  }

  // ---------- sahə seçimi ----------
  function startRegionSelect() {
    var overlay = el('div', 'position:fixed;inset:0;z-index:10000;cursor:crosshair;background:rgba(15,23,42,.15);');
    var hint = el('div', 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:10001;background:#4f46e5;color:#fff;font-size:13px;font-weight:600;padding:6px 14px;border-radius:999px;pointer-events:none;', 'Qiym\u0259tl\u0259ndiril\u0259c\u0259k sah\u0259ni \u00e7\u0259rçiv\u0259y\u0259 al\u0131n (Esc \u2014 imtina)');
    var rect = el('div', 'position:fixed;border:2px solid #f43f5e;background:rgba(244,63,94,.12);display:none;z-index:10001;pointer-events:none;');
    document.body.appendChild(overlay); document.body.appendChild(hint); document.body.appendChild(rect);
    var sx = 0, sy = 0, drag = false;
    function cleanup() { overlay.remove(); hint.remove(); rect.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') cleanup(); }
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('mousedown', function (e) { drag = true; sx = e.clientX; sy = e.clientY; rect.style.display = 'block'; });
    overlay.addEventListener('mousemove', function (e) {
      if (!drag) return;
      var x = Math.min(sx, e.clientX), y = Math.min(sy, e.clientY);
      rect.style.left = x + 'px'; rect.style.top = y + 'px';
      rect.style.width = Math.abs(e.clientX - sx) + 'px'; rect.style.height = Math.abs(e.clientY - sy) + 'px';
    });
    overlay.addEventListener('mouseup', function (e) {
      var x1 = Math.min(sx, e.clientX), y1 = Math.min(sy, e.clientY);
      var x2 = Math.max(sx, e.clientX), y2 = Math.max(sy, e.clientY);
      cleanup();
      if (x2 - x1 < 12 || y2 - y1 < 12) return;
      regionSelected({ x1: x1, y1: y1, x2: x2, y2: y2 });
    });
  }

  function regionSelected(r) {
    // seçim hansı canvas-a düşür?
    var cs = viewportCanvases();
    var target = null, tb = null;
    cs.forEach(function (c) {
      var b = c.getBoundingClientRect();
      var cx = (r.x1 + r.x2) / 2, cy = (r.y1 + r.y2) / 2;
      if (cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom) { target = c; tb = b; }
    });
    if (!target) { ensurePanel(); addMsg('sys', 'Se\u00e7im g\u00f6r\u00fcnt\u00fc pəncərəsinə d\u00fc\u015fm\u0259di.'); return; }
    ensurePanel();
    Promise.all(cs.map(function (c) { return captureOne(c); })).then(function (caps) {
      caps = caps.filter(Boolean);
      var parts = [];
      var thumbs = [];
      // hədəf canvas-da düzbucaqlını çək + crop
      caps.forEach(function (cap) {
        if (cap.src === target) {
          var b = tb;
          var kx = cap.canvas.width / b.width, ky = cap.canvas.height / b.height;
          var rx = (r.x1 - b.left) * kx, ry = (r.y1 - b.top) * ky;
          var rw = (r.x2 - r.x1) * kx, rh = (r.y2 - r.y1) * ky;
          // crop (böyüdülmüş) — düzbucaqlıdan ƏVVƏL, təmiz görüntüdən
          var pad = Math.max(rw, rh) * 0.35;
          var cx1 = Math.max(0, rx - pad), cy1 = Math.max(0, ry - pad);
          var cw = Math.min(cap.canvas.width - cx1, rw + pad * 2), ch = Math.min(cap.canvas.height - cy1, rh + pad * 2);
          var crop = document.createElement('canvas');
          var zoom = Math.min(3, 900 / Math.max(cw, ch));
          crop.width = Math.round(cw * zoom); crop.height = Math.round(ch * zoom);
          var cctx = crop.getContext('2d');
          cctx.imageSmoothingEnabled = true;
          cctx.drawImage(cap.canvas, cx1, cy1, cw, ch, 0, 0, crop.width, crop.height);
          cctx.strokeStyle = '#f43f5e'; cctx.lineWidth = 3;
          cctx.strokeRect((rx - cx1) * zoom, (ry - cy1) * zoom, rw * zoom, rh * zoom);
          // tam görüntüdə də işarələ
          var ctx = cap.canvas.getContext('2d');
          ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3;
          ctx.strokeRect(rx, ry, rw, rh);
          parts.push({ type: 'image', dataUrl: crop.toDataURL('image/jpeg', 0.9) });
          thumbs.push(crop.toDataURL('image/jpeg', 0.6));
        }
      });
      caps.forEach(function (cap) {
        parts.push({ type: 'image', dataUrl: cap.canvas.toDataURL('image/jpeg', 0.85) });
      });
      parts.push({
        type: 'text',
        text: 'H\u0259kim g\u00f6r\u00fcnt\u00fcd\u0259 QIRMIZI d\u00fczbucaqlı ilə bir sah\u0259 se\u00e7di (birinci \u015f\u0259kil — h\u0259min sah\u0259nin b\u00f6y\u00fcd\u00fclm\u00fc\u015f g\u00f6r\u00fcnt\u00fcs\u00fcd\u00fcr). Bu sah\u0259ni diqq\u0259tl\u0259 qiym\u0259tl\u0259ndir. \u018fg\u0259r bir ne\u00e7\u0259 m\u00fcst\u0259vi (MPR) verilirs\u0259, h\u0259min nahiy\u0259ni h\u0259r \u00fc\u00e7 m\u00fcst\u0259vid\u0259 t\u0259hlil et v\u0259 m\u00fcst\u0259vil\u0259r aras\u0131 uy\u011funlu\u011fu \u015f\u0259rh et. Anatomik lokalizasiya + g\u00f6r\u00fcn\u0259n d\u0259yi\u015fiklik + ehtimal olunan izah + n\u0259 istisna edilm\u0259lidir strukturu il\u0259 yaz.'
      });
      convo.push({ role: 'user', parts: parts });
      addMsg('user', '\u25a3 Se\u00e7ilmi\u015f sah\u0259ni qiym\u0259tl\u0259ndir', thumbs);
      callApi('Se\u00e7ilmi\u015f sah\u0259 analiz olunur\u2026');
    });
  }

  function run() {
    var p = document.getElementById(PANEL_ID);
    if (p) { p.remove(); return; }
    if (!convo.length) firstRun(); else { ensurePanel(); replay(); }
  }
  function replay() {
    var body = document.getElementById(PANEL_ID + '-body');
    body.innerHTML = '';
    convo.forEach(function (m) {
      if (m.role === 'user') addMsg('user', (m.parts.filter(function (x) { return x.type === 'text'; })[0] || {}).text || 'G\u00f6r\u00fcnt\u00fcl\u0259r');
      else addMsg('assistant', m.parts[0].text);
    });
  }

  function mount() {
    if (document.getElementById(BTN_ID)) return;
    if (!location.pathname.startsWith('/viewer')) return;
    var b = el('button', 'position:fixed;bottom:18px;right:18px;z-index:9998;background:#4f46e5;color:#fff;border:0;border-radius:999px;padding:11px 18px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 8px 24px rgba(79,70,229,.45);font-family:inherit;', '\u2728 AI k\u00f6m\u0259k\u00e7i');
    b.id = BTN_ID;
    b.onclick = run;
    document.body.appendChild(b);
  }
  setInterval(mount, 1200);
})();

window.config = {
  routerBasename: '/',
  showStudyList: true,
  extensions: [],
  modes: [],
  customizationService: {
    'cornerstone.windowLevelPresets': {
      CT: [
        { id: 'ct-bone', description: 'Sümük', window: '2500', level: '480' },
        { id: 'ct-soft', description: 'Yumşaq toxuma', window: '400', level: '40' },
        { id: 'ct-dental', description: 'Dental (geniş)', window: '4094', level: '1048' },
        { id: 'ct-lung', description: 'Ağciyər', window: '1500', level: '-600' },
      ],
    },
  },
  investigationalUseDialog: { option: 'never' },
  whiteLabeling: {
    createLogoComponentFn: function (React) {
      return React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
        React.createElement(
          'a',
          { href: 'https://rentgen.az/', style: { display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' } },
          React.createElement('img', { src: '/rx/logo.png', alt: 'rentgen.az', style: { height: '28px', width: '28px', borderRadius: '7px' } }),
          React.createElement('span', { style: { color: '#fff', fontWeight: 700, fontSize: '15.5px', letterSpacing: '0.2px' } }, 'rentgen.az'),
          React.createElement('span', { style: { color: '#fff', fontWeight: 700, fontSize: '15.5px', letterSpacing: '0.2px', marginLeft: '1px', opacity: 0.85 } }, 'PACS')
        ),
        React.createElement('span', {
          id: 'rx-user',
          style: {
            marginLeft: '14px', paddingLeft: '14px', borderLeft: '1px solid rgba(148,163,184,0.35)',
            color: '#e2e8f0', fontSize: '13.5px', fontWeight: 500, whiteSpace: 'nowrap',
          },
        }, ''),
        React.createElement('a', {
          id: 'rx-logout',
          href: '/logout',
          title: 'Çıxış',
          style: {
            marginLeft: '10px', display: 'none', alignItems: 'center', gap: '5px',
            color: '#94a3b8', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
            border: '1px solid rgba(148,163,184,0.35)', borderRadius: '999px', padding: '3px 12px',
          },
          onMouseEnter: function (e) { e.currentTarget.style.color = '#fecaca'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.5)'; },
          onMouseLeave: function (e) { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(148,163,184,0.35)'; },
        }, 'Çıxış')
      );
    },
  },
  // Şəbəkə: kadr sorğuları paralel + prefetch aqressiv
  maxNumRequests: { interaction: 100, thumbnail: 75, prefetch: 50 },
  defaultDataSourceName: 'orthanc',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'orthanc',
      configuration: {
        friendlyName: 'rentgen.az PACS',
        name: 'orthanc',
        wadoUriRoot: '/orthanc/dicom-web',
        qidoRoot: '/orthanc/dicom-web',
        wadoRoot: '/orthanc/dicom-web',
        qidoSupportsIncludeField: false,
        supportsReject: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        dicomUploadEnabled: false,
        bulkDataURI: { enabled: true, relativeResolution: 'studies' },
        omitQuotationForMultipartRequest: true,
        // Orthanc kadrları JPEG-LS-ə (itkisiz) transkod edir → ~3x az trafik.
        // Fallback: adi octet-stream (dəstəklənməyən hallarda).
        acceptHeader: [
          'multipart/related; type=image/jls; transfer-syntax=1.2.840.10008.1.2.4.80; q=0.9',
          'multipart/related; type=application/octet-stream; q=0.5',
        ],
      },
    },
  ],
  httpErrorHandler: function (error) { console.warn('[PACS]', error.status, error.message); },
};
