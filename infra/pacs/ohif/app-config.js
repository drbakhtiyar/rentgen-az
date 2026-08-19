/** OHIF Viewer config for pacs.rentgen.az — data source = Orthanc DICOMweb behind /orthanc/ */
window.config = {
  routerBasename: '/',
  showStudyList: true,
  extensions: [],
  modes: [],
  customizationService: {},
  investigationalUseDialog: { option: 'never' },
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
  httpErrorHandler: (error) => { console.warn('[PACS]', error.status, error.message); },
};
