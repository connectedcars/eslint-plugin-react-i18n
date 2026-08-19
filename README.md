# Getting started

## Installation

`npm install @connectedcars/lint-plugin-react-i18n`

## ESLint config

Load `@connectedcars/lint-plugin-react-i18n/eslint` as the plugin in your ESLint
configuration, then enable the rule:

```js
module.exports = {
  plugins: {
    'react-i18n': require('@connectedcars/lint-plugin-react-i18n/eslint'),
  },
  rules: {
    'react-i18n/checks': 'error',
  },
}
```

## Oxlint config

Oxlint loads the compatible JavaScript plugin from the package's `oxlint`
subpath. Add it to `jsPlugins` in `.oxlintrc.json` and enable the rule:

```json
{
  "jsPlugins": [
    {
      "name": "react-i18n",
      "specifier": "@connectedcars/lint-plugin-react-i18n/oxlint"
    }
  ],
  "rules": {
    "react-i18n/checks": "error"
  }
}
```

## Options

It's also possible to change some of the default options such as:

```json
"react-i18n/checks": [
  "error",
  {
    "globalData": [
      "p",
      "div",
      "strong"
    ],
    "replaceStringRegex": {
      "pattern": "{__KEY__}"
    },
    "expressions": {
      "t": ["singular", "data", "context"],
      "tx": ["singular", "data", "context"],
      "tn": ["count", "singular", "plural", "data", "context"],
      "tnx": ["count", "singular", "plural", "data", "context"],
    }
  }
]
```
