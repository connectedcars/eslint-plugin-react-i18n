const { RuleTester } = require("eslint")
const checksRule = require("./checks")

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2015 }
})

ruleTester.run(
  "checks",
  checksRule,
  {
    valid: [
      { code: "t(`Hello`)" },
      { code: "t('Hello')" },
      { code: "t('Hello {name}', { name: 'Mia' })" },
      { code: "tn(1, 'Hello', 'Hello {count} times', { count: 1 })" },
      { code: "tx('Hello <b>{name}</b>', { name: 'Mia', b: content => `<b>{content}</b>` })" },
    ],
    invalid: [
      { code: "t(`Hello ${name}`)", errors: 1 },
      { code: "t('Hello {name}')", errors: 1 },
      { code: "t('Hello {name} {lastname}')", errors: 2 },
      { code: "tx('Hello <b>{name}</b>', { name: 'Mia' })", errors: 1 },
    ],
  }
)

console.log("Tests passed!")
