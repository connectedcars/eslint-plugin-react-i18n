# Getting started

## Installation

`npm install @connectedcars/eslint-plugin-react-i18n`

## ESLint config

Load `@connectedcars/eslint-plugin-react-i18n/eslint` as the plugin in your ESLint
configuration, then enable the rule:

```js
module.exports = {
  plugins: {
    '@connectedcars/react-i18n': require('@connectedcars/eslint-plugin-react-i18n/eslint'),
  },
  rules: {
    '@connectedcars/react-i18n/checks': 'error',
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
      "name": "@connectedcars/react-i18n",
      "specifier": "@connectedcars/eslint-plugin-react-i18n/oxlint"
    }
  ],
  "rules": {
    "@connectedcars/react-i18n/checks": "error"
  }
}
```

## Options

It's also possible to change some of the default options such as:

```json
"@connectedcars/react-i18n/checks": [
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
