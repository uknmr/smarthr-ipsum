import { AST_NODE_TYPES, parse } from '@typescript-eslint/typescript-estree'

export const extractSentences = (text) => {
  let textEndRange
  let sentence
  let sentences = []

  const parseJSX = (tree) => {
    for (const node of tree) {
      if (!node) {
        continue
      }

      const {
        argument,
        body,
        children,
        declaration,
        declarations,
        init,
        range,
        type,
        value,
      } = node

      switch (type) {
        case AST_NODE_TYPES.ArrowFunctionExpression:
          parseJSX([body])
          continue
        case AST_NODE_TYPES.BlockStatement:
          parseJSX(body)
          continue
        case AST_NODE_TYPES.JSXElement:
        case AST_NODE_TYPES.JSXFragment:
          const { length, 0: first, [length - 1]: last } = range
          if (textEndRange && first > textEndRange) {
            textEndRange = undefined
            sentences.push(sentence.join(''))
          }

          const isFirstText =
            !textEndRange &&
            children.filter(
              ({ type, value }) =>
                type === AST_NODE_TYPES.JSXText && /\S/.test(value),
            ).length

          if (isFirstText) {
            textEndRange = last
            sentence = []
          }

          parseJSX(children)
          continue
        case AST_NODE_TYPES.ExportNamedDeclaration:
          parseJSX([declaration])
          continue
        case AST_NODE_TYPES.JSXText:
          if (/^\s*$/.test(value)) {
            continue
          }

          sentence.push(value.replaceAll(/\s/g, ''))
          continue
        case AST_NODE_TYPES.ReturnStatement:
          parseJSX([argument])
          continue
        case AST_NODE_TYPES.VariableDeclaration:
          parseJSX(declarations)
          continue
        case AST_NODE_TYPES.VariableDeclarator:
          parseJSX([init])
          continue
      }
    }
  }

  try {
    const ast = parse(text, { jsx: true, range: true })
    parseJSX(ast.body)
  } catch (e) {
    console.trace(e)
  }

  return sentences
}
