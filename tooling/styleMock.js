const path = require('path');

module.exports = {
  process: (sourceText, sourcePath) => ({
    code: `module.exports = ${JSON.stringify(path.basename(sourcePath))};`,
  }),
};
