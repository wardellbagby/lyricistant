const open = require('open');
const path = require('path');

(async () => {
    const file = path.resolve(process.env['BUILD_WORKSPACE_DIRECTORY'], process.argv[2]);
    console.log('Opening ' + file);
    await open(file);
  }
)();