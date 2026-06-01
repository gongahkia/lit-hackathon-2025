const smokeSuite = require('./extension.test.js');

async function run() {
    await smokeSuite.run();
}

module.exports = {
    run
};
