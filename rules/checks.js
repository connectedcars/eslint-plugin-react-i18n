const { parse } = require('@connectedcars/react-i18n/dist/parser')

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

module.exports = {
  create(context) {
    const options = {
      ...defaultOptions,
      ...context.options[0],
    }

    const strictPattern = '[\\w-]+'

    return {
      CallExpression(node) {
        const funcName = node.callee.name

        const args = options.expressions[funcName]
        if (!args) {
          return
        }

        const singularIndex = args.indexOf('singular')
        const singular = node.arguments[singularIndex]
        if (!singular) {
          return context.report({
            node,
            message: `Singular translation function (${funcName}) defined but no singular string found`,
          })
        }

        const isPluralFunc = args.includes('plural')
        const pluralIndex = args.indexOf('plural')
        const plural = node.arguments[pluralIndex]
        if (isPluralFunc && !plural) {
          return context.report({
            node,
            message: `plural translation function (${funcName}) defined but no plural string found`,
          })
        }

        const dataIndex = args.indexOf('data')
        const dataArg = node.arguments[dataIndex]
        if (dataArg && dataArg.type !== 'ObjectExpression') {
          return context.report({
            node,
            message: 'Data argument must be an inline object',
          })
        }

        const dataKeys = (dataArg ? dataArg.properties : []).map(
          (prop) => prop.key.name
        )
        const directDataKeys = [...dataKeys]

        // Add global keys to data keys
        dataKeys.push(...options.globalData)

        // Add `n` for plural funcs
        if (isPluralFunc) {
          dataKeys.push('n')
        }

        const regex = options.replaceStringRegex.pattern.replace(
          '__KEY__',
          `(${dataKeys.concat(strictPattern).join('|')})`
        )

        const getDataMatchesFromNode = (node) => {
          if (node.kind === 'text') {
            return []
          }
          const matches = [node.tagName]
          if (node.children) {
            for (const child of node.children) {
              matches.push(getDataMatchesFromNode(child))
            }
          }
          return matches.flat()
        }

        let matches = []

        const getNodeValue = (node) => {
          if (node.type === 'Literal') {
            return node.value
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

        // Find singular matches
        const singularValue = getNodeValue(singular)
        if (singularValue == null) {
          return
        }
        for (const pnode of parse(getNodeValue(singular), regex)) {
          if (pnode.kind === 'text') {
            continue
          }
          matches.push(...getDataMatchesFromNode(pnode, matches))
        }

        // Find plural matches if we have any plural string
        if (plural) {
          const pluralValue = getNodeValue(plural)
          if (pluralValue == null) {
            return
          }
          for (const pnode of parse(pluralValue, regex)) {
            if (pnode.kind === 'text') {
              continue
            }
            matches.push(...getDataMatchesFromNode(pnode, matches))
          }
        }

        // Remove duplicates.
        matches = matches.filter(
          (item, pos, self) => self.indexOf(item) === pos
        )

        // We have a data object, but not no data used
        if (!matches.length && directDataKeys.length) {
          context.report({
            node: dataArg,
            message:
              'No keys found in translation strings, but data arg passed',
          })
          return
        }

        // Find keys from the string that are not in the data object
        for (const match of matches) {
          if (!dataKeys.includes(match)) {
            context.report({
              node,
              message: `'${match}' not found in data`,
            })
          }
        }

        // Find keys in the data object that are not in the string
        for (const key of dataKeys) {
          if (
            !matches.includes(key) &&
            !options.globalData.includes(key) &&
            key !== 'n'
          ) {
            context.report({
              node: dataArg,
              message: `'${key}' is unused`,
            })
          }
        }

        return node
      },
    }
  },
}
