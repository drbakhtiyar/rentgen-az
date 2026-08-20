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
