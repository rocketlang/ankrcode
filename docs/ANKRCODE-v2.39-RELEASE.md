# AnkrCode v2.39 Release Notes

> **Version:** 2.39.0 | **Date:** 2026-01-17
> **Codename:** "Workflow & Agents"

---

## Overview

AnkrCode v2.39 introduces two powerful features for automation and AI-assisted development:

1. **`workflow`** - Custom multi-step workflow automation
2. **`agent`** - Autonomous AI agents for complex tasks

These features represent the next evolution of AnkrCode from a coding assistant to a full development automation platform.

---

## New Commands

### 1. `workflow` - Custom Workflow Automation

Create, manage, and execute multi-step development workflows.

#### Commands

```bash
# List all workflows
ankrcode workflow

# Create new workflow (interactive)
ankrcode workflow create "deploy-prod"

# Create from template
ankrcode workflow create "ci-pipeline" --template ci

# Run workflow
ankrcode workflow run deploy-prod

# Run with dry-run (preview only)
ankrcode workflow run deploy-prod --dry-run

# Run specific steps
ankrcode workflow run deploy-prod --steps lint,test

# Run from specific step
ankrcode workflow run deploy-prod --from build

# Edit workflow
ankrcode workflow edit deploy-prod

# Delete workflow
ankrcode workflow delete deploy-prod

# Show workflow details
ankrcode workflow show deploy-prod

# Export workflows
ankrcode workflow export -o workflows.json

# Import workflows
ankrcode workflow import -f workflows.json

# AI-generate workflow from description
ankrcode workflow --ai-generate "deploy to production with tests"

# Validate workflow definition
ankrcode workflow validate deploy-prod
```

#### Workflow Definition (YAML)

```yaml
# ~/.ankrcode/workflows/deploy-prod.yaml
name: deploy-prod
description: Deploy application to production
version: 1.0.0
author: developer

# Environment variables for this workflow
env:
  NODE_ENV: production
  DEPLOY_TARGET: prod

# Trigger conditions (optional)
triggers:
  - branch: main
  - tag: "v*"

# Workflow steps
steps:
  - name: lint
    description: Run linting
    command: ankrcode lint --fix
    continueOnError: false

  - name: test
    description: Run tests with coverage
    command: ankrcode test -c --min-coverage 80
    failFast: true
    timeout: 300  # 5 minutes

  - name: security
    description: Security scan
    command: ankrcode security --severity high
    continueOnError: true  # Don't fail on warnings

  - name: build
    description: Build for production
    command: npm run build
    env:
      VITE_API_URL: https://api.example.com

  - name: deploy
    description: Deploy to production
    command: ankrcode deploy release --env prod
    condition: "{{ steps.build.success }}"

  - name: notify
    description: Send Slack notification
    command: |
      ankrcode webhook test -n slack-deploy \
        -d '{"status": "{{ workflow.status }}", "version": "{{ env.VERSION }}"}'
    runAlways: true  # Run even if previous steps failed

# Hooks
hooks:
  onStart: echo "Starting deployment..."
  onSuccess: echo "Deployment successful!"
  onFailure: ankrcode webhook test -n slack-alert -d '{"error": "Deployment failed"}'
```

#### Built-in Workflow Templates

| Template | Description |
|----------|-------------|
| `ci` | Lint → Test → Build |
| `cd` | Build → Deploy → Notify |
| `release` | Version → Changelog → Tag → Publish |
| `review` | Lint → Test → Security → Review |
| `hotfix` | Test → Build → Deploy (fast) |

#### Workflow Variables

```yaml
steps:
  - name: deploy
    command: ankrcode deploy --env {{ env.TARGET }}
    condition: "{{ steps.test.exitCode == 0 }}"
```

Available variables:
- `{{ env.VAR }}` - Environment variables
- `{{ steps.NAME.success }}` - Step success (boolean)
- `{{ steps.NAME.exitCode }}` - Step exit code
- `{{ steps.NAME.output }}` - Step output
- `{{ workflow.name }}` - Workflow name
- `{{ workflow.status }}` - Current status
- `{{ timestamp }}` - Current timestamp

---

### 2. `agent` - Autonomous AI Agents

Spawn specialized AI agents that work autonomously on complex tasks.

#### Commands

```bash
# List running agents
ankrcode agent

# Spawn researcher agent
ankrcode agent spawn researcher "find best practices for JWT auth"

# Spawn coder agent
ankrcode agent spawn coder "implement user authentication with JWT"

# Spawn reviewer agent
ankrcode agent spawn reviewer "review src/auth/ for security issues"

# Spawn tester agent
ankrcode agent spawn tester "write comprehensive tests for auth module"

# Spawn debugger agent
ankrcode agent spawn debugger "fix the login timeout error"

# Spawn architect agent
ankrcode agent spawn architect "design microservices architecture for e-commerce"

# Spawn documenter agent
ankrcode agent spawn documenter "document the API endpoints in src/api/"

# Check agent status
ankrcode agent status <agent-id>

# View agent logs/progress
ankrcode agent logs <agent-id>

# View agent output
ankrcode agent output <agent-id>

# Stop running agent
ankrcode agent stop <agent-id>

# Stop all agents
ankrcode agent stop --all

# Resume paused agent
ankrcode agent resume <agent-id>

# Multi-agent collaboration mode
ankrcode agent --collaborate "build a REST API for user management"

# Set agent verbosity
ankrcode agent spawn coder "task" --verbose

# Set agent timeout
ankrcode agent spawn researcher "task" --timeout 600

# Agent with specific model
ankrcode agent spawn coder "task" --model claude-opus
```

#### Agent Types

| Agent | Specialty | Tools Available |
|-------|-----------|-----------------|
| **researcher** | Search, explore, gather info | WebSearch, WebFetch, Grep, Glob, Read |
| **coder** | Write code, implement features | Read, Write, Edit, Bash, Task |
| **reviewer** | Code review, find issues | Read, Grep, Glob, security tools |
| **tester** | Generate and run tests | Read, Write, Bash, test frameworks |
| **debugger** | Debug errors, fix issues | Read, Edit, Bash, logs, traces |
| **architect** | Design systems, plan | Read, Glob, WebSearch, diagrams |
| **documenter** | Write documentation | Read, Write, Glob, markdown |

#### Agent Collaboration

Multiple agents can work together on complex tasks:

```bash
# Start collaborative session
ankrcode agent --collaborate "build user authentication system"

# This spawns:
# 1. Architect agent - designs the system
# 2. Coder agent - implements the design
# 3. Reviewer agent - reviews the implementation
# 4. Tester agent - writes and runs tests
# 5. Documenter agent - documents the code
```

#### Agent Configuration

```yaml
# ~/.ankrcode/agents.yaml
defaults:
  timeout: 300
  maxIterations: 50
  model: claude-sonnet

agents:
  researcher:
    tools: [WebSearch, WebFetch, Read, Grep, Glob]
    systemPrompt: "You are a research specialist..."

  coder:
    tools: [Read, Write, Edit, Bash, Task]
    systemPrompt: "You are an expert programmer..."
    model: claude-sonnet

  reviewer:
    tools: [Read, Grep, Glob]
    systemPrompt: "You are a senior code reviewer..."
    focusAreas: [security, performance, maintainability]
```

#### Agent Events & Hooks

```bash
# Watch agent progress in real-time
ankrcode agent logs <id> --follow

# Set up webhook notifications
ankrcode agent spawn coder "task" \
  --on-complete "curl -X POST https://webhook.site/xxx" \
  --on-error "ankrcode webhook test -n slack-alert"
```

---

## Architecture

### Workflow Engine

```
┌─────────────────────────────────────────────────────────┐
│                    Workflow Engine                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │  Parser  │───▶│ Executor │───▶│ Reporter │          │
│  │  (YAML)  │    │ (Steps)  │    │ (Output) │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│       │               │               │                  │
│       ▼               ▼               ▼                  │
│  ┌──────────────────────────────────────────────┐      │
│  │              Variable Resolver                │      │
│  │  env, steps, workflow, timestamp, secrets     │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Agent System

```
┌─────────────────────────────────────────────────────────┐
│                     Agent Manager                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │              Agent Orchestrator               │      │
│  └──────────────────────────────────────────────┘      │
│       │                                                  │
│       ├──────────┬──────────┬──────────┬─────────┐     │
│       ▼          ▼          ▼          ▼         ▼     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ │
│  │Research│ │ Coder  │ │Reviewer│ │ Tester │ │Debug │ │
│  │ Agent  │ │ Agent  │ │ Agent  │ │ Agent  │ │Agent │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └──────┘ │
│       │          │          │          │         │     │
│       └──────────┴──────────┴──────────┴─────────┘     │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────┐      │
│  │           Shared Context (EON Memory)         │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Examples

### Example 1: CI/CD Workflow

```bash
# Create CI workflow
ankrcode workflow create "ci" --template ci

# Customize
ankrcode workflow edit ci

# Run on every push
ankrcode workflow run ci
```

### Example 2: Feature Development with Agents

```bash
# Research best practices
ankrcode agent spawn researcher "OAuth 2.0 implementation patterns in Node.js"

# Wait for research, then implement
ankrcode agent spawn coder "implement OAuth 2.0 login with Google provider"

# Review the implementation
ankrcode agent spawn reviewer "review src/auth/oauth.ts for security"

# Generate tests
ankrcode agent spawn tester "write tests for OAuth flow"
```

### Example 3: Full Collaboration

```bash
# Let agents collaborate on a feature
ankrcode agent --collaborate "add dark mode support to the application"

# Agents will:
# 1. Research dark mode best practices
# 2. Design the theme system
# 3. Implement theme switching
# 4. Update components
# 5. Write tests
# 6. Document the feature
```

---

## Migration Guide

No breaking changes. New commands are additive.

---

## What's Next (v2.40)

- **RocketLang Compiler** - Full DSL compilation
- **IDE Extensions** - VS Code, JetBrains
- **Multi-Agent Orchestration** - Complex agent pipelines
- **Workflow Marketplace** - Share workflows

---

## Changelog

### v2.39.0 (2026-01-17)

#### Added
- `workflow` command for custom multi-step workflow automation
  - Create, edit, delete, run workflows
  - YAML-based workflow definitions
  - Built-in templates (ci, cd, release, review, hotfix)
  - Variable interpolation and conditions
  - Hooks (onStart, onSuccess, onFailure)
  - AI-generate workflows from descriptions

- `agent` command for autonomous AI agents
  - 7 agent types: researcher, coder, reviewer, tester, debugger, architect, documenter
  - Agent lifecycle management (spawn, stop, resume, status, logs)
  - Multi-agent collaboration mode
  - Configurable timeouts and models
  - Event hooks and notifications

#### Technical
- New `src/workflow/` module for workflow engine
- New `src/agents/` module for agent system
- Extended Task tool for agent spawning
- EON Memory integration for agent context sharing

---

*AnkrCode v2.39 - "Workflow & Agents"*
*Built with pride in Bharat*
