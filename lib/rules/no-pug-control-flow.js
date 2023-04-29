const utils = require('eslint-plugin-vue/lib/utils')

const ILLEGAL_TOKEN_TYPES = {
  PugCode: 'inline javascript code',
  PugIf: 'if statements',
  PugElse: 'else statements',
  PugElseIf: 'else if statements',
  PugCase: 'case statements',
  PugWhen: 'when statements',
  PugDefault: 'default when statements',
  PugEach: 'each loops',
  PugWhile: 'while loops',
  PugInclude: 'includes',
  PugPath: 'paths',
  PugExtends: 'extends',
  PugBlock: 'blocks',
  PugInterpolatedCode: 'interpolations',
  PugMixin: 'mixins',
  PugCall: 'mixin calls'
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow pug control flow features.',
      categories: ['vue3-strongly-recommended', 'strongly-recommended'],
      url: 'https://eslint-plugin-vue-pug.rash.codes/rules/no-pug-control-flow.html'
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          ignores: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
            additionalItems: false
          }
        },
        additionalProperties: false
      }      
    ],
    messages: {
      // ...
    }
  },
  create(context) {
    const options = context.options[0] || {};
    
    // Take the simplified user input to match it to the illegal token keys
    const ignores = (options.ignores || []).map(i => {
      const keys = Object.keys(ILLEGAL_TOKEN_TYPES);
      const sample = ("pug" + i).toLowerCase();
      var match = null;
      for(const key of keys) {
        if(key.toLowerCase() === sample) {
          match = key;
          break;
        }
      }
      return match;
    });

    return utils.defineTemplateBodyVisitor(
      context,
      {},
      {
        Program(node) {
          const tokens = node.templateBody && node.templateBody.tokens
          if (!tokens) return
          const illegalTokens = tokens.filter(
            (token) => {
              const illegalMatch = ILLEGAL_TOKEN_TYPES[token.type];
              if( ! ignores.includes(token.type) ) {
                return true;
              } else {
                return false;
              }
            }
          )
          for (const token of illegalTokens) {
            context.report({
              loc: token.loc,
              message: 'Using pug {{ type }} is forbidden.',
              data: {
                type: ILLEGAL_TOKEN_TYPES[token.type]
              }
            })
          }
        }
      }
    )
  }
}
