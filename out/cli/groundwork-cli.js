"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const workspaceScanner_1 = require("../integrations/workspaceScanner");
function parseArguments(argv) {
    const argumentsMap = {
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
function main() {
    const options = parseArguments(process.argv.slice(2));
    const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
    const report = (0, workspaceScanner_1.scanWorkspaceFromFileSystem)({ cwd });
    const output = options.format === 'markdown'
        ? (0, workspaceScanner_1.formatMarkdownSummary)(report)
        : JSON.stringify(report, null, 2);
    if (options.output) {
        fs.writeFileSync(path.resolve(options.output), output);
    }
    else {
        process.stdout.write(`${output}\n`);
    }
    if (report.summary.errorCount > 0) {
        process.exitCode = 1;
    }
}
main();
//# sourceMappingURL=groundwork-cli.js.map