'use strict'

const defaultOptions = {
  globalData: [],
  replaceStringRegex: {
    pattern: '{__KEY__}',
  },
  expressions: {
    t: ['singular', 'data', 'context'],
    tn: ['count', 'singular', 'plural', 'data', 'context'],
    tx: ['singular', 'data', 'context'],
    tnx: ['count', 'singular', 'plural', 'data', 'context'],
  },
}

/**
 * Extract all template keys from a translation string.
 *
 * Supports two interpolation syntaxes used by react-i18n:
 *   Curly-brace:   {key} / {/key} (closing tag ignored — '/' not in [\w-])
 *   Angle-bracket: <key> / </key> (closing tag ignored — starts with '/')
 *
 * Returns a deduplicated array of key names.
 * @param {string} str
 * @returns {string[]}
 */
function extractTemplateKeys(str) {
  const keys = new Set()
  let match

  // {key} — [\w-]+ does not match '/' so {/key} closing tags are excluded
  const curlyRegex = /\{([\w-]+)\}/g
  while ((match = curlyRegex.exec(str)) !== null) {
    keys.add(match[1])
  }

  // <key> or <key/> — self-closing and opening tags;
  // </key> starts with '/' which [\w-]+ won't match
  const angleRegex = /<([\w-]+)\s*\/?>/g
  while ((match = angleRegex.exec(str)) !== null) {
    keys.add(match[1])
  }

  return [...keys]
}

/**
 * Validate that angle-bracket tags in a translation string are balanced.
 *
 * Uses a count map per tag name (opens − closes). After scanning the whole
 * string, any tag with a non-zero count has unmatched open/close tags.
 * Self-closing tags (<tag/>) are skipped — they balance themselves.
 *
 * The regex /<(\/?)(\w[\w-]*)(\s*\/)?>/g captures:
 *   group1 — '/' for closing tags, '' for opening/self-closing
 *   group2 — tag name
 *   group3 — trailing '/' for self-closing tags
 *
 * @param {string} str - Translation string to validate
 * @param {Function} report - Callback receiving an error message string
 */
function validateTagBalance(str, report) {
  const tagRegex = /<(\/?)([\w-]+)(\s*\/)?>/g
  const counts = {}
  let match

  while ((match = tagRegex.exec(str)) !== null) {
    const isClosing = match[1] === '/'
    const tagName = match[2]
    const isSelfClosing = match[3] != null && match[3].includes('/')

    if (isSelfClosing) {
      continue
    }

    counts[tagName] = (counts[tagName] ?? 0) + (isClosing ? -1 : 1)
  }

  for (const [tag, count] of Object.entries(counts)) {
    if (count > 0) {
      report(`Opening tag '<${tag}>' has no matching closing tag '</${tag}>'`)
    } else if (count < 0) {
      report(`Closing tag '</${tag}>' has no matching opening tag '<${tag}>'`)
    }
  }
}

const checksRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Validate react-i18n translation function calls for correct string and data arguments',
    },
    schema: [
      {
        type: 'object',
        properties: {
          globalData: { type: 'array', items: { type: 'string' } },
          replaceStringRegex: {
            type: 'object',
            properties: { pattern: { type: 'string' } },
            additionalProperties: false,
          },
          expressions: { type: 'object' },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = {
      ...defaultOptions,
      ...context.options[0],
      expressions: {
        ...defaultOptions.expressions,
        ...(context.options[0]?.expressions ?? {}),
      },
    }

    /**
     * Get the string value of a Literal or expression-free TemplateLiteral node.
     * Reports and returns null for unsupported node types.
     */
    const getNodeValue = (node) => {
      if (node.type === 'Literal') {
        return String(node.value)
      }
      if (node.type === 'TemplateLiteral') {
        if (node.expressions.length) {
          context.report({
            node,
            message: 'Template literals must not have any expressions',
          })
          return null
        }
        return node.quasis.map((q) => q.value.raw).join('')
      }
      context.report({
        node,
        message: 'Must be a string or template literal without expressions',
      })
      return null
    }

    return {
      CallExpression(node) {
        // Only handle direct calls, not member expressions (obj.t(...))
        if (node.callee.type !== 'Identifier') {
          return
        }
        const funcName = node.callee.name

        const argOrder = options.expressions[funcName]
        if (!argOrder) {
          return
        }

        // ── Validate singular string ─────────────────────────────────────────
        const singularIndex = argOrder.indexOf('singular')
        const singular = node.arguments[singularIndex]
        if (!singular) {
          return context.report({
            node,
            message: `Singular translation function (${funcName}) defined but no singular string found`,
          })
        }

        // ── Validate plural string ───────────────────────────────────────────
        const isPluralFunc = argOrder.includes('plural')
        const pluralIndex = argOrder.indexOf('plural')
        const plural = node.arguments[pluralIndex]
        if (isPluralFunc && !plural) {
          return context.report({
            node,
            message: `plural translation function (${funcName}) defined but no plural string found`,
          })
        }

        // ── Validate data argument ───────────────────────────────────────────
        const dataIndex = argOrder.indexOf('data')
        const dataArg = node.arguments[dataIndex]
        if (dataArg && dataArg.type !== 'ObjectExpression') {
          return context.report({
            node,
            message: 'Data argument must be an inline object',
          })
        }

        // Keys explicitly passed in the data object
        const directDataKeys = (dataArg ? dataArg.properties : []).map((prop) =>
          prop.key.type === 'Identifier' ? prop.key.name : prop.key.value
        )

        // Full set of allowed keys (data keys + global data + 'n' for plural)
        const allowedKeys = [...directDataKeys, ...options.globalData]
        if (isPluralFunc) {
          allowedKeys.push('n')
        }

        // ── Extract {key} / <key> patterns and validate tag balance ────────
        const singularValue = getNodeValue(singular)
        if (singularValue == null) {
          return
        }

        validateTagBalance(singularValue, (msg) =>
          context.report({ node: singular, message: msg })
        )

        const matches = extractTemplateKeys(singularValue)

        if (plural) {
          const pluralValue = getNodeValue(plural)
          if (pluralValue == null) {
            return
          }
          validateTagBalance(pluralValue, (msg) =>
            context.report({ node: plural, message: msg })
          )
          for (const key of extractTemplateKeys(pluralValue)) {
            if (!matches.includes(key)) {
              matches.push(key)
            }
          }
        }

        // ── Check: data arg provided but no keys in template ─────────────────
        if (!matches.length && directDataKeys.length) {
          context.report({
            node: dataArg,
            message:
              'No keys found in translation strings, but data arg passed',
          })
          return
        }

        // ── Check: template key not in allowed keys ──────────────────────────
        for (const match of matches) {
          if (!allowedKeys.includes(match)) {
            context.report({
              node,
              message: `'${match}' not found in data`,
            })
          }
        }

        // ── Check: data key unused in template ───────────────────────────────
        for (const key of directDataKeys) {
          if (!matches.includes(key)) {
            context.report({
              node: dataArg,
              message: `'${key}' is unused`,
            })
          }
        }
      },
    }
  },
}

module.exports = checksRule
