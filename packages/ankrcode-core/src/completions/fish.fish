# AnkrCode Fish Completion Script
# Install: ankrcode completion install
# Or add to ~/.config/fish/completions/ankrcode.fish

# Disable file completion by default
complete -c ankrcode -f

# Global options
complete -c ankrcode -s l -l lang -d 'UI language' -xa 'en hi ta te kn mr'
complete -c ankrcode -s m -l model -d 'LLM model' -xa 'claude gpt groq gemini ollama'
complete -c ankrcode -l offline -d 'Use local models only'
complete -c ankrcode -l voice -d 'Enable voice input'
complete -c ankrcode -s p -l personality -d 'Personality' -xa 'default swayam'
complete -c ankrcode -s v -l verbose -d 'Verbose output'
complete -c ankrcode -s h -l help -d 'Show help'

# Main commands
complete -c ankrcode -n __fish_use_subcommand -a chat -d 'Start interactive chat'
complete -c ankrcode -n __fish_use_subcommand -a ask -d 'Ask a single question'
complete -c ankrcode -n __fish_use_subcommand -a tools -d 'List available tools'
complete -c ankrcode -n __fish_use_subcommand -a doctor -d 'Check system health'
complete -c ankrcode -n __fish_use_subcommand -a plugins -d 'Manage plugins'
complete -c ankrcode -n __fish_use_subcommand -a sessions -d 'Manage chat sessions'
complete -c ankrcode -n __fish_use_subcommand -a resume -d 'Resume a previous session'
complete -c ankrcode -n __fish_use_subcommand -a config -d 'Configuration management'
complete -c ankrcode -n __fish_use_subcommand -a init -d 'Initialize project'
complete -c ankrcode -n __fish_use_subcommand -a mcp -d 'MCP server management'
complete -c ankrcode -n __fish_use_subcommand -a voice -d 'Voice input mode'
complete -c ankrcode -n __fish_use_subcommand -a memory -d 'EON memory operations'
complete -c ankrcode -n __fish_use_subcommand -a help -d 'Show help'
complete -c ankrcode -n __fish_use_subcommand -a analyze -d 'Analyze code'
complete -c ankrcode -n __fish_use_subcommand -a refactor -d 'Refactor code'
complete -c ankrcode -n __fish_use_subcommand -a explain -d 'Explain code'
complete -c ankrcode -n __fish_use_subcommand -a test -d 'Run tests'
complete -c ankrcode -n __fish_use_subcommand -a lint -d 'Run linting'
complete -c ankrcode -n __fish_use_subcommand -a fix -d 'Auto-fix issues'
complete -c ankrcode -n __fish_use_subcommand -a review -d 'AI code review'
complete -c ankrcode -n __fish_use_subcommand -a commit -d 'Create git commit'
complete -c ankrcode -n __fish_use_subcommand -a pr -d 'Create pull request'
complete -c ankrcode -n __fish_use_subcommand -a changelog -d 'Generate changelog'
complete -c ankrcode -n __fish_use_subcommand -a deps -d 'Dependency management'
complete -c ankrcode -n __fish_use_subcommand -a security -d 'Security scanning'
complete -c ankrcode -n __fish_use_subcommand -a generate -d 'Code generation'
complete -c ankrcode -n __fish_use_subcommand -a docs -d 'Documentation'
complete -c ankrcode -n __fish_use_subcommand -a translate -d 'Translate content'
complete -c ankrcode -n __fish_use_subcommand -a debug -d 'Debug code'
complete -c ankrcode -n __fish_use_subcommand -a profile -d 'Performance profiling'
complete -c ankrcode -n __fish_use_subcommand -a benchmark -d 'Run benchmarks'
complete -c ankrcode -n __fish_use_subcommand -a clean -d 'Clean project'
complete -c ankrcode -n __fish_use_subcommand -a upgrade -d 'Upgrade dependencies'
complete -c ankrcode -n __fish_use_subcommand -a migrate -d 'Database migrations'
complete -c ankrcode -n __fish_use_subcommand -a api -d 'API client generation'
complete -c ankrcode -n __fish_use_subcommand -a bundle -d 'Bundle code'
complete -c ankrcode -n __fish_use_subcommand -a i18n -d 'Internationalization'
complete -c ankrcode -n __fish_use_subcommand -a env -d 'Environment management'
complete -c ankrcode -n __fish_use_subcommand -a perf -d 'Performance analysis'
complete -c ankrcode -n __fish_use_subcommand -a db -d 'Database operations'
complete -c ankrcode -n __fish_use_subcommand -a deploy -d 'Deployment'
complete -c ankrcode -n __fish_use_subcommand -a mock -d 'Mock server'
complete -c ankrcode -n __fish_use_subcommand -a ci -d 'CI/CD operations'
complete -c ankrcode -n __fish_use_subcommand -a k8s -d 'Kubernetes operations'
complete -c ankrcode -n __fish_use_subcommand -a docker -d 'Docker operations'
complete -c ankrcode -n __fish_use_subcommand -a log -d 'Log management'
complete -c ankrcode -n __fish_use_subcommand -a monitor -d 'Monitoring'
complete -c ankrcode -n __fish_use_subcommand -a secret -d 'Secret management'
complete -c ankrcode -n __fish_use_subcommand -a audit -d 'Audit operations'
complete -c ankrcode -n __fish_use_subcommand -a cache -d 'Cache operations'
complete -c ankrcode -n __fish_use_subcommand -a queue -d 'Queue operations'
complete -c ankrcode -n __fish_use_subcommand -a webhook -d 'Webhook management'
complete -c ankrcode -n __fish_use_subcommand -a cron -d 'Cron job management'
complete -c ankrcode -n __fish_use_subcommand -a proxy -d 'Proxy management'
complete -c ankrcode -n __fish_use_subcommand -a feature -d 'Feature flags'
complete -c ankrcode -n __fish_use_subcommand -a trace -d 'Distributed tracing'
complete -c ankrcode -n __fish_use_subcommand -a metric -d 'Metrics operations'
complete -c ankrcode -n __fish_use_subcommand -a schema -d 'Schema management'
complete -c ankrcode -n __fish_use_subcommand -a workflow -d 'Workflow automation'
complete -c ankrcode -n __fish_use_subcommand -a agent -d 'Autonomous AI agents'
complete -c ankrcode -n __fish_use_subcommand -a completion -d 'Shell completion scripts'

# Workflow subcommands
complete -c ankrcode -n '__fish_seen_subcommand_from workflow wf' -a run -d 'Run a workflow'
complete -c ankrcode -n '__fish_seen_subcommand_from workflow wf' -a list -d 'List saved workflows'
complete -c ankrcode -n '__fish_seen_subcommand_from workflow wf' -a create -d 'Create a new workflow'
complete -c ankrcode -n '__fish_seen_subcommand_from workflow wf' -a show -d 'Show workflow details'
complete -c ankrcode -n '__fish_seen_subcommand_from workflow wf' -a delete -d 'Delete a workflow'
complete -c ankrcode -n '__fish_seen_subcommand_from workflow wf' -a templates -d 'List available templates'
complete -c ankrcode -n '__fish_seen_subcommand_from workflow wf' -s f -l file -d 'Workflow YAML file' -r
complete -c ankrcode -n '__fish_seen_subcommand_from workflow wf' -s t -l template -d 'Create from template' -xa 'ci cd release review hotfix'
complete -c ankrcode -n '__fish_seen_subcommand_from workflow wf' -l dry-run -d 'Show what would run'
complete -c ankrcode -n '__fish_seen_subcommand_from workflow wf' -l steps -d 'Run only specific steps'
complete -c ankrcode -n '__fish_seen_subcommand_from workflow wf' -l from-step -d 'Start from step'
complete -c ankrcode -n '__fish_seen_subcommand_from workflow wf' -l verbose -d 'Verbose output'

# Agent subcommands
complete -c ankrcode -n '__fish_seen_subcommand_from agent ag' -a spawn -d 'Spawn a new agent'
complete -c ankrcode -n '__fish_seen_subcommand_from agent ag' -a list -d 'List all agents'
complete -c ankrcode -n '__fish_seen_subcommand_from agent ag' -a stop -d 'Stop an agent'
complete -c ankrcode -n '__fish_seen_subcommand_from agent ag' -a logs -d 'View agent logs'
complete -c ankrcode -n '__fish_seen_subcommand_from agent ag' -a status -d 'Get agent status'
complete -c ankrcode -n '__fish_seen_subcommand_from agent ag' -a types -d 'List agent types'
complete -c ankrcode -n '__fish_seen_subcommand_from agent ag' -s t -l task -d 'Task description' -r
complete -c ankrcode -n '__fish_seen_subcommand_from agent ag' -l model -d 'AI model' -xa 'claude gpt groq gemini'
complete -c ankrcode -n '__fish_seen_subcommand_from agent ag' -l timeout -d 'Timeout in seconds'
complete -c ankrcode -n '__fish_seen_subcommand_from agent ag' -l max-iterations -d 'Maximum iterations'
complete -c ankrcode -n '__fish_seen_subcommand_from agent ag' -l verbose -d 'Verbose output'
complete -c ankrcode -n '__fish_seen_subcommand_from agent ag' -l follow -d 'Follow agent logs'
complete -c ankrcode -n '__fish_seen_subcommand_from agent ag' -l all -d 'Apply to all agents'

# Agent types for spawn
complete -c ankrcode -n '__fish_seen_subcommand_from spawn' -a researcher -d 'Search and gather information'
complete -c ankrcode -n '__fish_seen_subcommand_from spawn' -a coder -d 'Write code and implement features'
complete -c ankrcode -n '__fish_seen_subcommand_from spawn' -a reviewer -d 'Code review and find issues'
complete -c ankrcode -n '__fish_seen_subcommand_from spawn' -a tester -d 'Generate and run tests'
complete -c ankrcode -n '__fish_seen_subcommand_from spawn' -a debugger -d 'Debug errors and fix issues'
complete -c ankrcode -n '__fish_seen_subcommand_from spawn' -a architect -d 'Design systems and architecture'
complete -c ankrcode -n '__fish_seen_subcommand_from spawn' -a documenter -d 'Write documentation'

# Completion subcommands
complete -c ankrcode -n '__fish_seen_subcommand_from completion' -a bash -d 'Output bash completion script'
complete -c ankrcode -n '__fish_seen_subcommand_from completion' -a zsh -d 'Output zsh completion script'
complete -c ankrcode -n '__fish_seen_subcommand_from completion' -a fish -d 'Output fish completion script'
complete -c ankrcode -n '__fish_seen_subcommand_from completion' -a install -d 'Install completion for current shell'

# Config subcommands
complete -c ankrcode -n '__fish_seen_subcommand_from config' -a show -d 'Show configuration'
complete -c ankrcode -n '__fish_seen_subcommand_from config' -a set -d 'Set a config value'
complete -c ankrcode -n '__fish_seen_subcommand_from config' -a get -d 'Get a config value'
complete -c ankrcode -n '__fish_seen_subcommand_from config' -a reset -d 'Reset configuration'

# MCP subcommands
complete -c ankrcode -n '__fish_seen_subcommand_from mcp' -a list -d 'List MCP tools'
complete -c ankrcode -n '__fish_seen_subcommand_from mcp' -a call -d 'Call an MCP tool'
complete -c ankrcode -n '__fish_seen_subcommand_from mcp' -a servers -d 'List MCP servers'
complete -c ankrcode -n '__fish_seen_subcommand_from mcp' -a refresh -d 'Refresh tool list'

# Memory subcommands
complete -c ankrcode -n '__fish_seen_subcommand_from memory' -a store -d 'Store a memory'
complete -c ankrcode -n '__fish_seen_subcommand_from memory' -a search -d 'Search memories'
complete -c ankrcode -n '__fish_seen_subcommand_from memory' -a list -d 'List recent memories'
complete -c ankrcode -n '__fish_seen_subcommand_from memory' -a clear -d 'Clear memories'
complete -c ankrcode -n '__fish_seen_subcommand_from memory' -a stats -d 'Memory statistics'

# DB subcommands
complete -c ankrcode -n '__fish_seen_subcommand_from db' -a query -d 'Run SQL query'
complete -c ankrcode -n '__fish_seen_subcommand_from db' -a migrate -d 'Run migrations'
complete -c ankrcode -n '__fish_seen_subcommand_from db' -a seed -d 'Seed database'
complete -c ankrcode -n '__fish_seen_subcommand_from db' -a backup -d 'Backup database'
complete -c ankrcode -n '__fish_seen_subcommand_from db' -a restore -d 'Restore database'
complete -c ankrcode -n '__fish_seen_subcommand_from db' -a status -d 'Database status'
complete -c ankrcode -n '__fish_seen_subcommand_from db' -a schema -d 'Show schema'
complete -c ankrcode -n '__fish_seen_subcommand_from db' -l host -d 'Database host'
complete -c ankrcode -n '__fish_seen_subcommand_from db' -l port -d 'Database port'
complete -c ankrcode -n '__fish_seen_subcommand_from db' -l user -d 'Database user'
complete -c ankrcode -n '__fish_seen_subcommand_from db' -l password -d 'Database password'
complete -c ankrcode -n '__fish_seen_subcommand_from db' -l database -d 'Database name'

# K8s subcommands
complete -c ankrcode -n '__fish_seen_subcommand_from k8s' -a deploy -d 'Deploy to Kubernetes'
complete -c ankrcode -n '__fish_seen_subcommand_from k8s' -a status -d 'Deployment status'
complete -c ankrcode -n '__fish_seen_subcommand_from k8s' -a logs -d 'View pod logs'
complete -c ankrcode -n '__fish_seen_subcommand_from k8s' -a scale -d 'Scale deployment'
complete -c ankrcode -n '__fish_seen_subcommand_from k8s' -a rollback -d 'Rollback deployment'
complete -c ankrcode -n '__fish_seen_subcommand_from k8s' -a pods -d 'List pods'
complete -c ankrcode -n '__fish_seen_subcommand_from k8s' -a services -d 'List services'
complete -c ankrcode -n '__fish_seen_subcommand_from k8s' -s n -l namespace -d 'Kubernetes namespace'
complete -c ankrcode -n '__fish_seen_subcommand_from k8s' -l context -d 'Kubernetes context'
complete -c ankrcode -n '__fish_seen_subcommand_from k8s' -l kubeconfig -d 'Kubeconfig file' -r

# Docker subcommands
complete -c ankrcode -n '__fish_seen_subcommand_from docker' -a build -d 'Build Docker image'
complete -c ankrcode -n '__fish_seen_subcommand_from docker' -a run -d 'Run container'
complete -c ankrcode -n '__fish_seen_subcommand_from docker' -a push -d 'Push image'
complete -c ankrcode -n '__fish_seen_subcommand_from docker' -a pull -d 'Pull image'
complete -c ankrcode -n '__fish_seen_subcommand_from docker' -a logs -d 'View container logs'
complete -c ankrcode -n '__fish_seen_subcommand_from docker' -a exec -d 'Execute in container'
complete -c ankrcode -n '__fish_seen_subcommand_from docker' -a compose -d 'Docker compose operations'
complete -c ankrcode -n '__fish_seen_subcommand_from docker' -s t -l tag -d 'Image tag'
complete -c ankrcode -n '__fish_seen_subcommand_from docker' -s f -l file -d 'Dockerfile' -r
complete -c ankrcode -n '__fish_seen_subcommand_from docker' -l no-cache -d 'Build without cache'
complete -c ankrcode -n '__fish_seen_subcommand_from docker' -l platform -d 'Target platform' -xa 'linux/amd64 linux/arm64'

# Deploy subcommands
complete -c ankrcode -n '__fish_seen_subcommand_from deploy' -a prod -d 'Deploy to production'
complete -c ankrcode -n '__fish_seen_subcommand_from deploy' -a staging -d 'Deploy to staging'
complete -c ankrcode -n '__fish_seen_subcommand_from deploy' -a dev -d 'Deploy to development'
complete -c ankrcode -n '__fish_seen_subcommand_from deploy' -a preview -d 'Create preview deployment'
complete -c ankrcode -n '__fish_seen_subcommand_from deploy' -a rollback -d 'Rollback deployment'
complete -c ankrcode -n '__fish_seen_subcommand_from deploy' -a status -d 'Deployment status'
complete -c ankrcode -n '__fish_seen_subcommand_from deploy' -l env -d 'Environment' -xa 'prod staging dev'
complete -c ankrcode -n '__fish_seen_subcommand_from deploy' -l force -d 'Force deployment'
complete -c ankrcode -n '__fish_seen_subcommand_from deploy' -l dry-run -d 'Dry run'

# Schema subcommands
complete -c ankrcode -n '__fish_seen_subcommand_from schema' -a validate -d 'Validate data against schema'
complete -c ankrcode -n '__fish_seen_subcommand_from schema' -a generate -d 'Generate schema'
complete -c ankrcode -n '__fish_seen_subcommand_from schema' -a convert -d 'Convert between formats'
complete -c ankrcode -n '__fish_seen_subcommand_from schema' -a diff -d 'Compare schema versions'
complete -c ankrcode -n '__fish_seen_subcommand_from schema' -a merge -d 'Merge schemas'
complete -c ankrcode -n '__fish_seen_subcommand_from schema' -a lint -d 'Lint schema'
complete -c ankrcode -n '__fish_seen_subcommand_from schema' -a docs -d 'Generate documentation'
complete -c ankrcode -n '__fish_seen_subcommand_from schema' -a mock -d 'Generate mock data'
complete -c ankrcode -n '__fish_seen_subcommand_from schema' -a infer -d 'Infer schema from data'
complete -c ankrcode -n '__fish_seen_subcommand_from schema' -a migrate -d 'Migrate schema version'
complete -c ankrcode -n '__fish_seen_subcommand_from schema' -s f -l file -d 'Schema file' -r
complete -c ankrcode -n '__fish_seen_subcommand_from schema' -l type -d 'Schema type' -xa 'json-schema openapi graphql protobuf avro typescript'

# Test options
complete -c ankrcode -n '__fish_seen_subcommand_from test' -s c -l coverage -d 'Run with coverage'
complete -c ankrcode -n '__fish_seen_subcommand_from test' -s w -l watch -d 'Watch mode'
complete -c ankrcode -n '__fish_seen_subcommand_from test' -s u -l update -d 'Update snapshots'
complete -c ankrcode -n '__fish_seen_subcommand_from test' -s f -l filter -d 'Filter tests'

# Lint options
complete -c ankrcode -n '__fish_seen_subcommand_from lint' -l fix -d 'Auto-fix issues'
complete -c ankrcode -n '__fish_seen_subcommand_from lint' -l format -d 'Output format' -xa 'json stylish compact'
complete -c ankrcode -n '__fish_seen_subcommand_from lint' -l config -d 'Config file' -r
