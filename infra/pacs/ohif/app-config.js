/** OHIF Viewer config for pacs.rentgen.az — data source = Orthanc DICOMweb behind /orthanc/ */
(function () {
  // Header bar: who is logged in (session cookie → /whoami). Filled into #rx-user below.
  var user = null;
  function paint() {
    var el = document.getElementById('rx-user');
    if (!el || !user) return;
    el.textContent = user.name ? user.name + '  ·  ' + user.roleLabel : user.roleLabel || '';
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
  customizationService: {},
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
          React.createElement('span', { style: { color: '#fff', fontWeight: 600, fontSize: '15px', letterSpacing: '0.2px' } }, 'rentgen.az'),
          React.createElement('span', { style: { color: '#94a3b8', fontWeight: 500, fontSize: '13px', marginLeft: '2px' } }, 'PACS')
        ),
        React.createElement('span', {
          id: 'rx-user',
          style: {
            position: 'fixed', left: '50%', top: 0, height: '50px', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', color: '#e2e8f0', fontSize: '14px', fontWeight: 500,
            whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 50,
          },
        }, '')
      );
    },
  },
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
      },
    },
  ],
  httpErrorHandler: function (error) { console.warn('[PACS]', error.status, error.message); },
};
