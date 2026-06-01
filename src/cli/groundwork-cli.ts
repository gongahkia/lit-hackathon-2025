import * as fs from 'fs';
import * as path from 'path';
import { formatMarkdownSummary, scanWorkspaceFromFileSystem } from '../integrations/workspaceScanner';

interface CliArguments {
    cwd?: string;
    output?: string;
    format?: 'json' | 'markdown';
}

function parseArguments(argv: string[]): CliArguments {
    const argumentsMap: CliArguments = {
        format: 'json'
    };

    for (let index = 0; index < argv.length; index += 1) {
        const value = argv[index];
        const next = argv[index + 1];

        if (value === '--cwd' && next) {
            argumentsMap.cwd = next;
            index += 1;
            continue;
        }

        if (value === '--output' && next) {
            argumentsMap.output = next;
            index += 1;
            continue;
        }

        if (value === '--format' && next && (next === 'json' || next === 'markdown')) {
            argumentsMap.format = next;
            index += 1;
        }
    }

    return argumentsMap;
}

function main(): void {
    const options = parseArguments(process.argv.slice(2));
    const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
    const report = scanWorkspaceFromFileSystem({ cwd });
    const output = options.format === 'markdown'
        ? formatMarkdownSummary(report)
        : JSON.stringify(report, null, 2);

    if (options.output) {
        fs.writeFileSync(path.resolve(options.output), output);
    } else {
        process.stdout.write(`${output}\n`);
    }

    if (report.summary.errorCount > 0) {
        process.exitCode = 1;
    }
}

main();
