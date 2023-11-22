# Getting started

## Installation

`npm install @connectedcars/eslint-plugin-react-i18n`

## ESlint config

Open your eslint config file and add the following under `rules`:

```json
"@connectedcars/react-i18n/checks": "error"
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
