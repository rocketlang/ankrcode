/**
 * Shell Completion Scripts for AnkrCode
 * Supports Bash, Zsh, and Fish shells
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the bash completion script content
 */
export function getBashCompletion(): string {
  const scriptPath = path.join(__dirname, 'bash.sh');
  // In production, read from dist; in dev, read from src
  if (fs.existsSync(scriptPath)) {
    return fs.readFileSync(scriptPath, 'utf-8');
  }
  // Fallback to inline script
  return getBashCompletionInline();
}

/**
 * Get the zsh completion script content
 */
export function getZshCompletion(): string {
  const scriptPath = path.join(__dirname, 'zsh.sh');
  if (fs.existsSync(scriptPath)) {
    return fs.readFileSync(scriptPath, 'utf-8');
  }
  return getZshCompletionInline();
}

/**
 * Get the fish completion script content
 */
export function getFishCompletion(): string {
  const scriptPath = path.join(__dirname, 'fish.fish');
  if (fs.existsSync(scriptPath)) {
    return fs.readFileSync(scriptPath, 'utf-8');
  }
  return getFishCompletionInline();
}

/**
 * Detect the current shell
 */
export function detectShell(): 'bash' | 'zsh' | 'fish' | 'unknown' {
  const shell = process.env.SHELL || '';

  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('bash')) return 'bash';
  if (shell.includes('fish')) return 'fish';

  return 'unknown';
}

/**
 * Get the completion install path for the current shell
 */
export function getCompletionInstallPath(shell: 'bash' | 'zsh' | 'fish'): string {
  const home = process.env.HOME || '/root';

  switch (shell) {
    case 'bash':
      // Check for bash-completion directory
      if (fs.existsSync('/etc/bash_completion.d')) {
        return '/etc/bash_completion.d/ankrcode';
      }
      return path.join(home, '.bash_completion.d', 'ankrcode');

    case 'zsh':
      // Check for oh-my-zsh
      const omzPath = path.join(home, '.oh-my-zsh', 'completions');
      if (fs.existsSync(path.join(home, '.oh-my-zsh'))) {
        return path.join(omzPath, '_ankrcode');
      }
      // Standard zsh completions
      return path.join(home, '.zsh', 'completions', '_ankrcode');

    case 'fish':
      return path.join(home, '.config', 'fish', 'completions', 'ankrcode.fish');
  }
}

/**
 * Install completion script for the specified shell
 */
export function installCompletion(shell?: 'bash' | 'zsh' | 'fish'): {
  success: boolean;
  shell: string;
  path: string;
  message: string;
} {
  const targetShell = shell || detectShell();

  if (targetShell === 'unknown') {
    return {
      success: false,
      shell: 'unknown',
      path: '',
      message: 'Could not detect shell. Please specify: ankrcode completion install --shell bash|zsh|fish',
    };
  }

  let script: string;
  switch (targetShell) {
    case 'bash':
      script = getBashCompletion();
      break;
    case 'zsh':
      script = getZshCompletion();
      break;
    case 'fish':
      script = getFishCompletion();
      break;
  }

  const installPath = getCompletionInstallPath(targetShell);
  const installDir = path.dirname(installPath);

  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(installDir)) {
      fs.mkdirSync(installDir, { recursive: true });
    }

    // Write the completion script
    fs.writeFileSync(installPath, script, 'utf-8');

    // Additional instructions based on shell
    let additionalInstructions = '';
    switch (targetShell) {
      case 'bash':
        additionalInstructions = `\nAdd to ~/.bashrc:\n  source ${installPath}\n\nOr reload with:\n  source ${installPath}`;
        break;
      case 'zsh':
        additionalInstructions = `\nAdd to ~/.zshrc (if not using oh-my-zsh):\n  fpath=(${path.dirname(installPath)} $fpath)\n  autoload -Uz compinit && compinit\n\nOr reload with:\n  source ~/.zshrc`;
        break;
      case 'fish':
        additionalInstructions = '\nCompletions will be available in new fish sessions.\nOr reload with:\n  source ' + installPath;
        break;
    }

    return {
      success: true,
      shell: targetShell,
      path: installPath,
      message: `Completion script installed to ${installPath}${additionalInstructions}`,
    };
  } catch (err) {
    return {
      success: false,
      shell: targetShell,
      path: installPath,
      message: `Failed to install: ${(err as Error).message}\n\nTry manually:\n  ankrcode completion ${targetShell} > ${installPath}`,
    };
  }
}

/**
 * Inline bash completion (fallback)
 */
function getBashCompletionInline(): string {
  return `#!/bin/bash
# AnkrCode Bash Completion
_ankrcode_completions() {
    local cur prev words cword
    _init_completion || return
    local commands="chat ask tools doctor plugins sessions resume config init mcp voice memory help analyze refactor explain test lint fix review commit pr changelog deps security generate docs translate debug profile benchmark clean upgrade migrate api bundle i18n env perf db deploy mock ci k8s docker log monitor secret audit migrate cache queue webhook cron proxy feature trace metric schema workflow agent completion"
    case "\${prev}" in
        ankrcode) COMPREPLY=($(compgen -W "\${commands}" -- "\${cur}")) ;;
        workflow|wf) COMPREPLY=($(compgen -W "run list create show delete templates" -- "\${cur}")) ;;
        agent|ag) COMPREPLY=($(compgen -W "spawn list stop logs status types" -- "\${cur}")) ;;
        completion) COMPREPLY=($(compgen -W "bash zsh fish install" -- "\${cur}")) ;;
        spawn) COMPREPLY=($(compgen -W "researcher coder reviewer tester debugger architect documenter" -- "\${cur}")) ;;
        *) COMPREPLY=($(compgen -W "\${commands}" -- "\${cur}")) ;;
    esac
}
complete -F _ankrcode_completions ankrcode`;
}

/**
 * Inline zsh completion (fallback)
 */
function getZshCompletionInline(): string {
  return `#compdef ankrcode
# AnkrCode Zsh Completion
_ankrcode() {
    local -a commands
    commands=(
        'chat:Start interactive chat'
        'ask:Ask a single question'
        'workflow:Workflow automation'
        'agent:Autonomous AI agents'
        'completion:Shell completion scripts'
    )
    _arguments -C '1: :->command' '*:: :->args'
    case "$state" in
        command) _describe -t commands 'ankrcode commands' commands ;;
    esac
}
_ankrcode "$@"`;
}

/**
 * Inline fish completion (fallback)
 */
function getFishCompletionInline(): string {
  return `# AnkrCode Fish Completion
complete -c ankrcode -f
complete -c ankrcode -n __fish_use_subcommand -a chat -d 'Start interactive chat'
complete -c ankrcode -n __fish_use_subcommand -a ask -d 'Ask a single question'
complete -c ankrcode -n __fish_use_subcommand -a workflow -d 'Workflow automation'
complete -c ankrcode -n __fish_use_subcommand -a agent -d 'Autonomous AI agents'
complete -c ankrcode -n __fish_use_subcommand -a completion -d 'Shell completion scripts'`;
}

export type ShellType = 'bash' | 'zsh' | 'fish';
