const assert = require('node:assert/strict');
const path = require('path');
const vscode = require('vscode');

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function waitFor(predicate, timeoutMs = 15000, intervalMs = 200) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        const result = await predicate();
        if (result) {
            return result;
        }

        await sleep(intervalMs);
    }

    throw new Error(`Timed out after ${timeoutMs}ms`);
}

async function run() {
    const extension = vscode.extensions.getExtension('baseline-tooling.groundwork');
    assert.ok(extension, 'Expected the GroundWork extension to be available in the smoke test host.');

    await extension.activate();

    const commands = await vscode.commands.getCommands(true);
    for (const command of [
        'groundwork.checkCompatibility',
        'groundwork.showDashboard',
        'groundwork.refreshData',
        'groundwork.configureProject',
        'groundwork.scanWorkspace',
        'groundwork.showFeatureDetails'
    ]) {
        assert.ok(commands.includes(command), `Expected command ${command} to be registered.`);
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'Expected the smoke test workspace to be open.');

    const documentUri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'src/index.ts'));
    const document = await vscode.workspace.openTextDocument(documentUri);
    await vscode.window.showTextDocument(document);

    const diagnostics = await waitFor(() => {
        const matches = vscode.languages.getDiagnostics(documentUri).filter(diagnostic => diagnostic.source === 'GroundWork');
        return matches.length > 0 ? matches : undefined;
    });

    assert.ok(
        diagnostics.some(diagnostic => /optional chaining|nullish coalescing/i.test(diagnostic.message)),
        'Expected GroundWork diagnostics for the smoke fixture.'
    );

    await vscode.commands.executeCommand('groundwork.scanWorkspace');
}

module.exports = {
    run
};
