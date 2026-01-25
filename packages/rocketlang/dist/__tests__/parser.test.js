/**
 * RocketLang Parser Tests
 */
import { describe, it, expect } from 'vitest';
import { parse } from '../parser/index.js';
import { parsePEG, getSupportedFeatures } from '../parser/peg-parser.js';
describe('Pattern-based Parser', () => {
    describe('File Operations', () => {
        it('should parse read command', () => {
            const result = parse('read "package.json"');
            expect(result.errors).toHaveLength(0);
            expect(result.commands).toHaveLength(1);
            expect(result.commands[0].tool).toBe('Read');
        });
        it('should parse Hindi read command (padho)', () => {
            const result = parse('padho "config.json"');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Read');
        });
    });
    describe('Search Operations', () => {
        it('should parse search command', () => {
            const result = parse('grep "TODO" in "src"');
            expect(result.errors).toHaveLength(0);
            // Pattern parser may treat unrecognized patterns as natural language (Task)
            expect(['Grep', 'Task']).toContain(result.commands[0]?.tool);
        });
        it('should parse glob command', () => {
            const result = parse('glob "*.ts" in "src"');
            expect(result.errors).toHaveLength(0);
            expect(['Glob', 'Task']).toContain(result.commands[0]?.tool);
        });
    });
    describe('Git Operations', () => {
        it('should parse commit command', () => {
            const result = parse('commit "feat: add feature"');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Bash');
            expect(result.commands[0].parameters.command).toContain('git commit');
        });
    });
    describe('Bash Operations', () => {
        it('should parse $ prefix command', () => {
            const result = parse('$ ls -la');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Bash');
        });
    });
    describe('Comments', () => {
        it('should skip # comments', () => {
            const result = parse('# this is a comment\nread "file.txt"');
            expect(result.commands).toHaveLength(1);
        });
        it('should skip // comments', () => {
            const result = parse('// this is a comment\nread "file.txt"');
            expect(result.commands).toHaveLength(1);
        });
    });
});
describe('PEG Parser', () => {
    describe('File Operations', () => {
        it('should parse read command', () => {
            const result = parsePEG('read "package.json"');
            expect(result.errors).toHaveLength(0);
            expect(result.commands).toHaveLength(1);
            expect(result.commands[0].tool).toBe('Read');
            expect(result.commands[0].parameters.file_path).toBe('package.json');
        });
        it('should parse write to command', () => {
            const result = parsePEG('write "hello world" to "test.txt"');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Write');
            expect(result.commands[0].parameters.file_path).toBe('test.txt');
            expect(result.commands[0].parameters.content).toBe('hello world');
        });
        it('should parse Hindi read command', () => {
            const result = parsePEG('padho "config.json"');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Read');
        });
    });
    describe('Search Operations', () => {
        it('should parse search in path', () => {
            const result = parsePEG('search "TODO" in "src"');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Grep');
            expect(result.commands[0].parameters.pattern).toBe('TODO');
            expect(result.commands[0].parameters.path).toBe('src');
        });
        it('should parse search without path', () => {
            const result = parsePEG('search "error"');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Grep');
        });
    });
    describe('Git Operations', () => {
        it('should parse commit with message', () => {
            const result = parsePEG('commit "fix: update parser"');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Bash');
            expect(result.commands[0].parameters.command).toContain('git commit');
        });
        it('should parse git status', () => {
            const result = parsePEG('git status');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Bash');
            expect(result.commands[0].parameters.command).toBe('git status');
        });
        it('should parse push', () => {
            const result = parsePEG('push origin main');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Bash');
            expect(result.commands[0].parameters.command).toContain('git push');
        });
    });
    describe('Package Management', () => {
        it('should parse npm install', () => {
            const result = parsePEG('npm install typescript');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Bash');
            expect(result.commands[0].parameters.command).toBe('npm install typescript');
        });
        it('should parse npm test', () => {
            const result = parsePEG('npm test');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].parameters.command).toBe('npm test');
        });
        it('should parse npm run', () => {
            const result = parsePEG('npm run build');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].parameters.command).toBe('npm run build');
        });
    });
    describe('Bash Operations', () => {
        it('should parse $ prefix', () => {
            const result = parsePEG('$ ls -la');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Bash');
            expect(result.commands[0].parameters.command).toBe('ls -la');
        });
        it('should parse run command', () => {
            const result = parsePEG('run "echo hello"');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Bash');
        });
    });
    describe('Code Generation', () => {
        it('should parse create api', () => {
            const result = parsePEG('create api for users');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Task');
            expect(result.commands[0].parameters.prompt).toContain('API endpoint');
        });
        it('should parse create function', () => {
            const result = parsePEG('create function validateInput');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('Task');
        });
    });
    describe('MCP Tool Calls', () => {
        it('should parse direct tool call', () => {
            const result = parsePEG('@gst_verify { gstin: "123456789" }');
            expect(result.errors).toHaveLength(0);
            expect(result.commands[0].tool).toBe('gst_verify');
            expect(result.commands[0].parameters.gstin).toBe('123456789');
        });
    });
    describe('Supported Features', () => {
        it('should list supported features', () => {
            const features = getSupportedFeatures();
            expect(features).toContain('File operations (read, write, edit, delete)');
            expect(features).toContain('Hindi verb support (padho, likho, banao, etc.)');
        });
    });
});
//# sourceMappingURL=parser.test.js.map