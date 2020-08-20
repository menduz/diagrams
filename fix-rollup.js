module.exports = function () {
  return {
    name: 'tslib-resolve-id',
    resolveId(source, importer) {
      if (source === 'tslib.js' || source === 'tslib' || source === 'tslib.js?commonjs-proxy') {
        return this.resolve(require.resolve('tslib'), importer);
      }

      return null;
    },
  };
};