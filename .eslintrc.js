module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true
  },
  extends: [
    'standard'
    
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    "max-len": ["error", { "code": 80}], 
    "no-trailing-spaces" : ["error", { "ignoreComments": true }],
    "no-trailing-spaces": ["error", { "skipBlankLines": true }]
  }
}
