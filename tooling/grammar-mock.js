const { buildParserFile } = require('@lezer/generator');

const grammar = `
@top Text { expression* }

expression { Line }

@tokens {
  Line{ ![\\n]+ }
}

@detectDelim`;

// eslint-disable-next-line no-eval
const parser = eval(buildParserFile(grammar, { moduleStyle: 'cjs' }).parser);

module.exports = { parser };
