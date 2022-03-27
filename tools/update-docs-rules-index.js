/**
 * @author Toru Nagashima
 * See LICENSE file in root directory for full license.
 */
'use strict'

const fs = require('fs')
const path = require('path')
const rules = require('./lib/rules')
const categories = require('./lib/categories')

const UPSTREAM_BASE = 'https://eslint.vuejs.org/rules/'

// -----------------------------------------------------------------------------
const uncategorizedRules = rules.filter(
  (rule) =>
    !rule.meta.docs.categories &&
    !rule.meta.docs.extensionRule &&
    !rule.meta.deprecated
)
const uncategorizedExtensionRule = rules.filter(
  (rule) =>
    !rule.meta.docs.categories &&
    rule.meta.docs.extensionRule &&
    !rule.meta.deprecated
)
const deprecatedRules = rules.filter((rule) => rule.meta.deprecated)

function toRuleRow(rule) {
  const isOwnRule = rule.ruleId.startsWith('vue-pug/')
  let pugMark
  if (isOwnRule) pugMark = rule.meta.docs.dropIn ? '🤝' : '🐶'
  else if (rule.ignored) pugMark = '💤'
  else if (rule.todo) pugMark = '🚧'
  else pugMark = '🎁'
  const mark = [
    rule.meta.fixable ? ':wrench:' : '',
    rule.meta.hasSuggestions ? ':bulb:' : '',
    rule.meta.deprecated ? ':warning:' : ''
  ].join('')
  const link = `[${rule.ruleId}](${isOwnRule ? './' : UPSTREAM_BASE}${
    rule.name
  }.${isOwnRule ? 'md' : 'html'})`
  const description = rule.meta.docs.description || '(no description)'

  return `| ${pugMark} | ${link} | ${description} | ${mark} |`
}

function toDeprecatedRuleRow(rule) {
  const link = `[${rule.ruleId}](./${rule.name}.md)`
  const replacedRules = rule.meta.replacedBy || []
  const replacedBy = replacedRules
    .map((name) => `[vue/${name}](./${name}.md)`)
    .join(', ')

  return `| ${link} | ${replacedBy || '(no replacement)'} |`
}

// -----------------------------------------------------------------------------
let rulesTableContent = categories
  .map(
    (category) => `
## ${category.title.vuepress}

Enforce all the rules in this category, as well as all higher priority rules, with:

\`\`\`json
{
  "extends": "plugin:vue/${category.categoryId}"
}
\`\`\`

|    | Rule ID | Description |    |
|:---|:--------|:------------|:---|
${category.rules.map(toRuleRow).join('\n')}
`
  )
  .join('')

// -----------------------------------------------------------------------------
if (uncategorizedRules.length || uncategorizedExtensionRule.length) {
  rulesTableContent += `
## Uncategorized

No preset enables the rules in this category.
Please enable each rule if you want.

For example:

\`\`\`json
{
  "rules": {
    "${
      (uncategorizedRules[0] || uncategorizedExtensionRule[0]).ruleId
    }": "error"
  }
}
\`\`\`
`
}
if (uncategorizedRules.length) {
  rulesTableContent += `
  |    | Rule ID | Description |    |
  |:---|:--------|:------------|:---|
${uncategorizedRules.map(toRuleRow).join('\n')}
`
}
if (uncategorizedExtensionRule.length) {
  rulesTableContent += `
### Extension Rules

The following rules extend the rules provided by ESLint itself and apply them to the expressions in the \`<template>\`.

|    | Rule ID | Description |    |
|:---|:--------|:------------|:---|
${uncategorizedExtensionRule.map(toRuleRow).join('\n')}
`
}

// -----------------------------------------------------------------------------
if (deprecatedRules.length >= 1) {
  rulesTableContent += `
## Deprecated

- :warning: We're going to remove deprecated rules in the next major release. Please migrate to successor/new rules.
- :innocent: We don't fix bugs which are in deprecated rules since we don't have enough resources.

| Rule ID | Replaced by |
|:--------|:------------|
${deprecatedRules.map(toDeprecatedRuleRow).join('\n')}
`
}

// -----------------------------------------------------------------------------
const readmeFilePath = path.resolve(__dirname, '../docs/rules/README.md')
fs.writeFileSync(
  readmeFilePath,
  `---
sidebarDepth: 0
---

# Available rules

<!-- This file is automatically generated in tools/update-docs-rules-index.js, do not change! -->

::: tip Legend
  🎁 upstream rule works out of the box
  🤝 \`vue-pug/*\` drop-in rule available
  💤 does not affect templates
  🚧 TODO
  🐶 new rule specific to pug

  :wrench: Indicates that the rule is fixable, and using \`--fix\` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the reported problems.

  :bulb: Indicates that some problems reported by the rule are manually fixable by editor [suggestions](https://eslint.org/docs/developer-guide/working-with-rules#providing-suggestions).
:::

${rulesTableContent}`
)
