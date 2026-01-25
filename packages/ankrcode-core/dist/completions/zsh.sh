#compdef ankrcode
# AnkrCode Zsh Completion Script
# Install: ankrcode completion install
# Or add to ~/.zshrc: eval "$(ankrcode completion zsh)"

_ankrcode() {
    local -a commands subcommands options

    commands=(
        'chat:Start interactive chat'
        'ask:Ask a single question'
        'tools:List available tools'
        'doctor:Check system health'
        'plugins:Manage plugins'
        'sessions:Manage chat sessions'
        'resume:Resume a previous session'
        'config:Configuration management'
        'init:Initialize project'
        'mcp:MCP server management'
        'voice:Voice input mode'
        'memory:EON memory operations'
        'help:Show help'
        'analyze:Analyze code'
        'refactor:Refactor code'
        'explain:Explain code'
        'test:Run tests'
        'lint:Run linting'
        'fix:Auto-fix issues'
        'review:AI code review'
        'commit:Create git commit'
        'pr:Create pull request'
        'changelog:Generate changelog'
        'deps:Dependency management'
        'security:Security scanning'
        'generate:Code generation'
        'docs:Documentation'
        'translate:Translate content'
        'debug:Debug code'
        'profile:Performance profiling'
        'benchmark:Run benchmarks'
        'clean:Clean project'
        'upgrade:Upgrade dependencies'
        'migrate:Database migrations'
        'api:API client generation'
        'bundle:Bundle code'
        'i18n:Internationalization'
        'env:Environment management'
        'perf:Performance analysis'
        'db:Database operations'
        'deploy:Deployment'
        'mock:Mock server'
        'ci:CI/CD operations'
        'k8s:Kubernetes operations'
        'docker:Docker operations'
        'log:Log management'
        'monitor:Monitoring'
        'secret:Secret management'
        'audit:Audit operations'
        'cache:Cache operations'
        'queue:Queue operations'
        'webhook:Webhook management'
        'cron:Cron job management'
        'proxy:Proxy management'
        'feature:Feature flags'
        'trace:Distributed tracing'
        'metric:Metrics operations'
        'schema:Schema management'
        'workflow:Workflow automation'
        'agent:Autonomous AI agents'
        'completion:Shell completion scripts'
    )

    _arguments -C \
        '(-l --lang)'{-l,--lang}'[UI language]:language:(en hi ta te kn mr)' \
        '(-m --model)'{-m,--model}'[LLM model]:model:(claude gpt groq gemini ollama)' \
        '--offline[Use local models only]' \
        '--voice[Enable voice input]' \
        '(-p --personality)'{-p,--personality}'[Personality]:personality:(default swayam)' \
        '(-v --verbose)'{-v,--verbose}'[Verbose output]' \
        '1: :->command' \
        '*:: :->args'

    case "$state" in
        command)
            _describe -t commands 'ankrcode commands' commands
            ;;
        args)
            case "$words[1]" in
                workflow|wf)
                    subcommands=(
                        'run:Run a workflow'
                        'list:List saved workflows'
                        'create:Create a new workflow'
                        'show:Show workflow details'
                        'delete:Delete a workflow'
                        'templates:List available templates'
                    )
                    _arguments \
                        '(-f --file)'{-f,--file}'[Workflow YAML file]:file:_files' \
                        '(-t --template)'{-t,--template}'[Create from template]:template:(ci cd release review hotfix)' \
                        '--dry-run[Show what would run]' \
                        '--steps[Run only specific steps]:steps:' \
                        '--from-step[Start from step]:step:' \
                        '--verbose[Verbose output]' \
                        '1: :->subcommand' \
                        '*:: :->subargs'
                    case "$state" in
                        subcommand)
                            _describe -t subcommands 'workflow commands' subcommands
                            ;;
                    esac
                    ;;

                agent|ag)
                    subcommands=(
                        'spawn:Spawn a new agent'
                        'list:List all agents'
                        'stop:Stop an agent'
                        'logs:View agent logs'
                        'status:Get agent status'
                        'types:List agent types'
                    )
                    local agent_types=(
                        'researcher:Search and gather information'
                        'coder:Write code and implement features'
                        'reviewer:Code review and find issues'
                        'tester:Generate and run tests'
                        'debugger:Debug errors and fix issues'
                        'architect:Design systems and architecture'
                        'documenter:Write documentation'
                    )
                    _arguments \
                        '(-t --task)'{-t,--task}'[Task description]:task:' \
                        '--model[AI model]:model:(claude gpt groq gemini)' \
                        '--timeout[Timeout in seconds]:seconds:' \
                        '--max-iterations[Maximum iterations]:iterations:' \
                        '--verbose[Verbose output]' \
                        '--follow[Follow agent logs]' \
                        '--all[Apply to all agents]' \
                        '1: :->subcommand' \
                        '2: :->agent_type'
                    case "$state" in
                        subcommand)
                            _describe -t subcommands 'agent commands' subcommands
                            ;;
                        agent_type)
                            if [[ "$words[2]" == "spawn" ]]; then
                                _describe -t agent_types 'agent types' agent_types
                            fi
                            ;;
                    esac
                    ;;

                completion)
                    subcommands=(
                        'bash:Output bash completion script'
                        'zsh:Output zsh completion script'
                        'fish:Output fish completion script'
                        'install:Install completion for current shell'
                    )
                    _arguments \
                        '1: :->subcommand'
                    case "$state" in
                        subcommand)
                            _describe -t subcommands 'completion commands' subcommands
                            ;;
                    esac
                    ;;

                config)
                    subcommands=(
                        'show:Show configuration'
                        'set:Set a config value'
                        'get:Get a config value'
                        'reset:Reset configuration'
                    )
                    _arguments '1: :->subcommand'
                    case "$state" in
                        subcommand)
                            _describe -t subcommands 'config commands' subcommands
                            ;;
                    esac
                    ;;

                mcp)
                    subcommands=(
                        'list:List MCP tools'
                        'call:Call an MCP tool'
                        'servers:List MCP servers'
                        'refresh:Refresh tool list'
                    )
                    _arguments '1: :->subcommand'
                    case "$state" in
                        subcommand)
                            _describe -t subcommands 'mcp commands' subcommands
                            ;;
                    esac
                    ;;

                memory)
                    subcommands=(
                        'store:Store a memory'
                        'search:Search memories'
                        'list:List recent memories'
                        'clear:Clear memories'
                        'stats:Memory statistics'
                    )
                    _arguments '1: :->subcommand'
                    case "$state" in
                        subcommand)
                            _describe -t subcommands 'memory commands' subcommands
                            ;;
                    esac
                    ;;

                db)
                    subcommands=(
                        'query:Run SQL query'
                        'migrate:Run migrations'
                        'seed:Seed database'
                        'backup:Backup database'
                        'restore:Restore database'
                        'status:Database status'
                        'schema:Show schema'
                    )
                    _arguments \
                        '--host[Database host]:host:' \
                        '--port[Database port]:port:' \
                        '--user[Database user]:user:' \
                        '--password[Database password]:password:' \
                        '--database[Database name]:database:' \
                        '1: :->subcommand'
                    case "$state" in
                        subcommand)
                            _describe -t subcommands 'db commands' subcommands
                            ;;
                    esac
                    ;;

                k8s)
                    subcommands=(
                        'deploy:Deploy to Kubernetes'
                        'status:Deployment status'
                        'logs:View pod logs'
                        'scale:Scale deployment'
                        'rollback:Rollback deployment'
                        'pods:List pods'
                        'services:List services'
                    )
                    _arguments \
                        '(-n --namespace)'{-n,--namespace}'[Kubernetes namespace]:namespace:' \
                        '--context[Kubernetes context]:context:' \
                        '--kubeconfig[Kubeconfig file]:file:_files' \
                        '1: :->subcommand'
                    case "$state" in
                        subcommand)
                            _describe -t subcommands 'k8s commands' subcommands
                            ;;
                    esac
                    ;;

                docker)
                    subcommands=(
                        'build:Build Docker image'
                        'run:Run container'
                        'push:Push image'
                        'pull:Pull image'
                        'logs:View container logs'
                        'exec:Execute in container'
                        'compose:Docker compose operations'
                    )
                    _arguments \
                        '(-t --tag)'{-t,--tag}'[Image tag]:tag:' \
                        '(-f --file)'{-f,--file}'[Dockerfile]:file:_files' \
                        '--no-cache[Build without cache]' \
                        '--platform[Target platform]:platform:(linux/amd64 linux/arm64)' \
                        '1: :->subcommand'
                    case "$state" in
                        subcommand)
                            _describe -t subcommands 'docker commands' subcommands
                            ;;
                    esac
                    ;;

                schema)
                    subcommands=(
                        'validate:Validate data against schema'
                        'generate:Generate schema'
                        'convert:Convert between formats'
                        'diff:Compare schema versions'
                        'merge:Merge schemas'
                        'lint:Lint schema'
                        'docs:Generate documentation'
                        'mock:Generate mock data'
                        'infer:Infer schema from data'
                        'migrate:Migrate schema version'
                    )
                    _arguments \
                        '(-f --file)'{-f,--file}'[Schema file]:file:_files' \
                        '(-d --data)'{-d,--data}'[Data file]:file:_files' \
                        '--type[Schema type]:type:(json-schema openapi graphql protobuf avro typescript)' \
                        '--from[Source format]:format:' \
                        '--to[Target format]:format:' \
                        '1: :->subcommand'
                    case "$state" in
                        subcommand)
                            _describe -t subcommands 'schema commands' subcommands
                            ;;
                    esac
                    ;;

                test)
                    _arguments \
                        '(-c --coverage)'{-c,--coverage}'[Run with coverage]' \
                        '(-w --watch)'{-w,--watch}'[Watch mode]' \
                        '(-u --update)'{-u,--update}'[Update snapshots]' \
                        '(-f --filter)'{-f,--filter}'[Filter tests]:filter:' \
                        '--verbose[Verbose output]'
                    ;;

                lint)
                    _arguments \
                        '--fix[Auto-fix issues]' \
                        '--format[Output format]:format:(json stylish compact)' \
                        '--config[Config file]:file:_files' \
                        '--ignore[Ignore patterns]:patterns:'
                    ;;

                deploy)
                    subcommands=(
                        'prod:Deploy to production'
                        'staging:Deploy to staging'
                        'dev:Deploy to development'
                        'preview:Create preview deployment'
                        'rollback:Rollback deployment'
                        'status:Deployment status'
                    )
                    _arguments \
                        '--env[Environment]:env:(prod staging dev)' \
                        '--force[Force deployment]' \
                        '--dry-run[Dry run]' \
                        '1: :->subcommand'
                    case "$state" in
                        subcommand)
                            _describe -t subcommands 'deploy commands' subcommands
                            ;;
                    esac
                    ;;
            esac
            ;;
    esac
}

_ankrcode "$@"
