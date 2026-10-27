import globals from 'globals';

export default [
  { ignores: ['dist/**', 'dist-single/**', 'node_modules/**', 'test-results/**'] },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-unused-vars': ['error', { args: 'after-used', caughtErrors: 'none' }],
      'no-undef': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-restricted-properties': ['error', { property: 'innerHTML', message: 'Usa el constructor seguro el(); innerHTML solo se permite en svgFromString con SVG fijo.' }],
    },
  },
  { files: ['src/core/dom.js'], rules: { 'no-restricted-properties': 'off' } },
];
