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
  // ---- AI qaralama (rentgen.az) — düymə + panel -------------------------
  var BTN_ID = 'rx-ai-btn', PANEL_ID = 'rx-ai-panel';
  function el(tag, css, html) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (html != null) e.innerHTML = html; return e; }

  function captureViewports() {
    var out = [];
    var canvases = Array.prototype.slice.call(document.querySelectorAll('.viewport-element canvas, .cornerstone-canvas, [data-viewport-uid] canvas, canvas'));
    var seen = [];
    canvases.forEach(function (c) {
      if (c.width < 220 || c.height < 220) return;
      if (seen.indexOf(c) !== -1) return; seen.push(c);
      try {
        var maxDim = 1100;
        var k = Math.min(1, maxDim / Math.max(c.width, c.height));
        var t = document.createElement('canvas');
        t.width = Math.round(c.width * k); t.height = Math.round(c.height * k);
        var ctx = t.getContext('2d');
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, t.width, t.height);
        ctx.drawImage(c, 0, 0, t.width, t.height);
        // boşluq yoxlaması: nümunə piksellərdə variasiya
        var d = ctx.getImageData(0, 0, t.width, t.height).data;
        var sum = 0, n = 0;
        for (var i = 0; i < d.length; i += 4096) { sum += d[i]; n++; }
        var mean = sum / n, varr = 0;
        for (var j = 0; j < d.length; j += 4096) { varr += Math.pow(d[j] - mean, 2); }
        if (varr / n < 15) return; // tam qara/boş
        out.push(t.toDataURL('image/jpeg', 0.85));
      } catch (e) { /* tainted/webgl — ötür */ }
    });
    return out.slice(0, 4);
  }

  function getStudyUid() {
    try { return new URLSearchParams(location.search).get('StudyInstanceUIDs') || ''; } catch (e) { return ''; }
  }

  function sliceInfo() {
    var m = (document.body.innerText || '').match(/I:\s*\d+\s*\((\d+)\/(\d+)\)/);
    return m ? ('görünən kəsim ' + m[1] + '/' + m[2]) : '';
  }

  function ensurePanel() {
    var p = document.getElementById(PANEL_ID);
    if (p) return p;
    p = el('div', 'position:fixed;top:60px;right:12px;width:380px;max-width:92vw;max-height:calc(100vh - 80px);z-index:9999;background:#0b1220;border:1px solid rgba(148,163,184,.35);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.55);display:flex;flex-direction:column;font-family:inherit;');
    p.id = PANEL_ID;
    var head = el('div', 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(148,163,184,.25);color:#e2e8f0;font-weight:600;font-size:14px;', '✨ AI qaralama');
    var actions = el('div', 'display:flex;gap:8px;align-items:center;');
    var copy = el('button', 'background:none;border:1px solid rgba(148,163,184,.35);border-radius:8px;color:#94a3b8;font-size:12px;padding:3px 10px;cursor:pointer;', 'Kopyala');
    copy.onclick = function () {
      var b = document.getElementById(PANEL_ID + '-body');
      navigator.clipboard.writeText(b ? b.innerText : '').then(function () { copy.textContent = 'Kopyalandı ✓'; setTimeout(function () { copy.textContent = 'Kopyala'; }, 1500); });
    };
    var close = el('button', 'background:none;border:0;color:#94a3b8;font-size:18px;cursor:pointer;line-height:1;', '×');
    close.onclick = function () { p.remove(); };
    actions.appendChild(copy); actions.appendChild(close); head.appendChild(actions);
    var body = el('div', 'padding:12px 14px;color:#cbd5e1;font-size:13.5px;line-height:1.55;overflow:auto;white-space:pre-wrap;');
    body.id = PANEL_ID + '-body';
    p.appendChild(head); p.appendChild(body);
    document.body.appendChild(p);
    return p;
  }

  function run() {
    var btn = document.getElementById(BTN_ID);
    var panel = ensurePanel();
    var body = document.getElementById(PANEL_ID + '-body');
    var imgs = captureViewports();
    if (!imgs.length) { body.textContent = 'Görüntü tapılmadı — əvvəl bir tədqiqat açın (kəsim görünən olsun).'; return; }
    body.textContent = 'Görüntülər analiz olunur… (adətən 20-60 saniyə)';
    btn.disabled = true; btn.style.opacity = '0.6';
    fetch('/ai', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ studyUid: getStudyUid(), images: imgs, sliceInfo: sliceInfo() }),
    }).then(function (r) { return r.json(); }).then(function (d) {
      body.textContent = d.ok ? d.draft : ('Xəta: ' + (d.error || 'cavab alınmadı'));
    }).catch(function () { body.textContent = 'Şəbəkə xətası — yenidən cəhd edin.'; })
      .finally(function () { btn.disabled = false; btn.style.opacity = '1'; });
  }

  function mount() {
    if (document.getElementById(BTN_ID)) return;
    if (!location.pathname.startsWith('/viewer')) return;
    var b = el('button', 'position:fixed;bottom:18px;right:18px;z-index:9998;background:#4f46e5;color:#fff;border:0;border-radius:999px;padding:11px 18px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 8px 24px rgba(79,70,229,.45);font-family:inherit;', '✨ AI qaralama');
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
