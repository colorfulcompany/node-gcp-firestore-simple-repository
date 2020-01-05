module.exports = {
  extends: 'standard',
  rules: {
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-returns-description': 'off'
  },
  settings: {
    jsdoc: {
      tagNamePreference: {
        returns: 'return'
      }
    }
  }
}
