import assert from 'node:assert/strict'
import { RuleTester as EslintRuleTester } from 'eslint'
import { RuleTester as OxlintRuleTester } from 'oxlint/plugins-dev'
import { describe, it } from 'vitest'
import checksRule from './checks.js'

describe('plugin entry points', () => {
  it('exports the shared plugin for ESLint and Oxlint', () => {
    const eslintPlugin = require('@connectedcars/eslint-plugin-react-i18n')
    const eslintSubpathPlugin = require('@connectedcars/eslint-plugin-react-i18n/eslint')
    const oxlintPlugin = require('@connectedcars/eslint-plugin-react-i18n/oxlint')

    assert.equal(typeof eslintPlugin.rules.checks.create, 'function')
    assert.equal(eslintSubpathPlugin, eslintPlugin)
    assert.equal(oxlintPlugin.meta.name, '@connectedcars/react-i18n')
    assert.equal(typeof oxlintPlugin.rules.checks.create, 'function')
    assert.equal(oxlintPlugin.rules.checks, eslintPlugin.rules.checks)
  })
})

const cases = {
  valid: [
    { code: 't(`Hello`)' },
    { code: "t('Hello')" },
    { code: "t('Hello {name}', { name: 'Mia' })" },
    {
      code: "t('Hello {locale}')",
      options: [{ globalData: ['locale'] }],
    },
    {
      code: "translate('Hello {name}', { name: 'Mia' })",
      options: [{ expressions: { translate: ['singular', 'data'] } }],
    },
    { code: "tn(1, 'Hello', 'Hello {count} times', { count: 1 })" },
    { code: "tn(1, 'Hello {n}', 'Hello {count} times', { count: 1 })" },
    {
      code: "tx('Hello <b>{name}</b>', { name: 'Mia', b: content => `<b>{content}</b>` })",
    },
    { code: "t('Hello <user-name/>', { 'user-name': true })" },
    { code: "i18n.t('Hello {name}')" },
  ],
  invalid: [
    { code: 't()', errors: 1 },
    { code: "tn(1, 'One')", errors: 1 },
    { code: 't(`Hello ${name}`)', errors: 1 },
    { code: 't(name)', errors: 1 },
    { code: "t('Hello {name}')", errors: 1 },
    { code: "t('Hello {name} {lastname}')", errors: 2 },
    { code: "tx('Hello <b>{name}</b>', { name: 'Mia' })", errors: 1 },
    { code: "const x = { foo: 'bar' }; t('Hello {foo}', x)", errors: 1 },
    { code: "t('Hello', { name: 'Mia' })", errors: 1 },
    { code: "t('Hello {name}', { name: 'Mia', unused: true })", errors: 1 },
    { code: "t('Hello <b>', { b: true })", errors: 1 },
    { code: "t('Hello </b>', { b: true })", errors: 2 },
    { code: "tn(1, 'One', 'Many <b>', { b: true })", errors: 1 },
  ],
}

const eslintRuleTester = new EslintRuleTester({
  parserOptions: { ecmaVersion: 2015 },
})

eslintRuleTester.run('checks (ESLint)', checksRule, cases)

OxlintRuleTester.describe = describe
OxlintRuleTester.it = it

const oxlintRuleTester = new OxlintRuleTester({
  languageOptions: { parserOptions: { lang: 'js' } },
})

oxlintRuleTester.run('checks (Oxlint)', checksRule, cases)