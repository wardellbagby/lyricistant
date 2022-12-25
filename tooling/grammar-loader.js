const { buildParserFile } = require('@lezer/generator');

exports.default = (text) => {
  const built = buildParserFile(text);
  return `${built.parser}
          export default parser
          ${built.terms}`;
};
