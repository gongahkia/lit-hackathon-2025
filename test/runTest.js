const path = require('path');
const { runTests } = require('@vscode/test-electron');

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '..');
        const extensionTestsPath = path.resolve(__dirname, 'suite/index.js');
        const workspacePath = path.resolve(__dirname, 'fixtures/smoke-workspace');

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                workspacePath,
                '--disable-workspace-trust',
                '--skip-welcome',
                '--skip-release-notes'
            ]
        });
    } catch (error) {
        console.error('Failed to run GroundWork smoke tests');
        console.error(error);
        process.exit(1);
    }
}

main();
