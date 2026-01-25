#!/bin/bash
# AnkrCode Bash Completion Script
# Install: ankrcode completion install
# Or add to ~/.bashrc: eval "$(ankrcode completion bash)"

_ankrcode_completions() {
    local cur prev words cword
    _init_completion || return

    # All top-level commands
    local commands="chat ask tools doctor plugins sessions resume config init mcp voice memory help analyze refactor explain test lint fix review commit pr changelog deps security generate docs translate debug profile benchmark clean upgrade migrate api bundle i18n env perf db deploy mock ci k8s docker log monitor secret audit migrate cache queue webhook cron proxy feature trace metric schema workflow agent completion"

    # Command aliases
    local aliases="c a wf ag"

    case "${prev}" in
        ankrcode)
            COMPREPLY=($(compgen -W "${commands} ${aliases}" -- "${cur}"))
            return
            ;;

        # Workflow subcommands
        workflow|wf)
            COMPREPLY=($(compgen -W "run list create show delete templates" -- "${cur}"))
            return
            ;;

        # Agent subcommands
        agent|ag)
            COMPREPLY=($(compgen -W "spawn list stop logs status types" -- "${cur}"))
            return
            ;;

        # Agent spawn - suggest agent types
        spawn)
            if [[ "${words[1]}" == "agent" || "${words[1]}" == "ag" ]]; then
                COMPREPLY=($(compgen -W "researcher coder reviewer tester debugger architect documenter" -- "${cur}"))
            fi
            return
            ;;

        # Completion subcommands
        completion)
            COMPREPLY=($(compgen -W "bash zsh fish install" -- "${cur}"))
            return
            ;;

        # Config subcommands
        config)
            COMPREPLY=($(compgen -W "show set get reset" -- "${cur}"))
            return
            ;;

        # MCP subcommands
        mcp)
            COMPREPLY=($(compgen -W "list call servers refresh" -- "${cur}"))
            return
            ;;

        # Memory subcommands
        memory)
            COMPREPLY=($(compgen -W "store search list clear stats" -- "${cur}"))
            return
            ;;

        # DB subcommands
        db)
            COMPREPLY=($(compgen -W "query migrate seed backup restore status schema" -- "${cur}"))
            return
            ;;

        # K8s subcommands
        k8s)
            COMPREPLY=($(compgen -W "deploy status logs scale rollback pods services" -- "${cur}"))
            return
            ;;

        # Docker subcommands
        docker)
            COMPREPLY=($(compgen -W "build run push pull logs exec compose" -- "${cur}"))
            return
            ;;

        # CI subcommands
        ci)
            COMPREPLY=($(compgen -W "run status logs artifacts config" -- "${cur}"))
            return
            ;;

        # Deploy subcommands
        deploy)
            COMPREPLY=($(compgen -W "prod staging dev preview rollback status" -- "${cur}"))
            return
            ;;

        # Cache subcommands
        cache)
            COMPREPLY=($(compgen -W "get set delete clear stats keys" -- "${cur}"))
            return
            ;;

        # Queue subcommands
        queue)
            COMPREPLY=($(compgen -W "list add process status clear stats" -- "${cur}"))
            return
            ;;

        # Schema subcommands
        schema)
            COMPREPLY=($(compgen -W "validate generate convert diff merge lint docs mock infer migrate" -- "${cur}"))
            return
            ;;

        # Metric subcommands
        metric)
            COMPREPLY=($(compgen -W "list record query export dashboard alert" -- "${cur}"))
            return
            ;;

        # Trace subcommands
        trace)
            COMPREPLY=($(compgen -W "list show search export analyze" -- "${cur}"))
            return
            ;;

        # Options with values
        -m|--model)
            COMPREPLY=($(compgen -W "claude gpt groq gemini ollama" -- "${cur}"))
            return
            ;;

        -l|--lang)
            COMPREPLY=($(compgen -W "en hi ta te kn mr" -- "${cur}"))
            return
            ;;

        -p|--personality)
            COMPREPLY=($(compgen -W "default swayam" -- "${cur}"))
            return
            ;;

        -t|--template)
            COMPREPLY=($(compgen -W "ci cd release review hotfix" -- "${cur}"))
            return
            ;;

        --format)
            COMPREPLY=($(compgen -W "json yaml table csv markdown" -- "${cur}"))
            return
            ;;

        --type)
            COMPREPLY=($(compgen -W "json-schema openapi graphql protobuf avro typescript" -- "${cur}"))
            return
            ;;
    esac

    # Handle options
    if [[ "${cur}" == -* ]]; then
        local opts=""
        case "${words[1]}" in
            workflow|wf)
                opts="-f --file -t --template --dry-run --steps --from-step --verbose -h --help"
                ;;
            agent|ag)
                opts="-t --task --model --timeout --max-iterations --verbose --follow --all -h --help"
                ;;
            chat|c)
                opts="-l --lang -m --model --offline --voice -p --personality -v --verbose -h --help"
                ;;
            test)
                opts="-c --coverage -w --watch -u --update -f --filter --verbose -h --help"
                ;;
            lint)
                opts="--fix --format --config --ignore --verbose -h --help"
                ;;
            build|bundle)
                opts="-o --output --minify --sourcemap --target --format --verbose -h --help"
                ;;
            deploy)
                opts="--env --force --dry-run --rollback --verbose -h --help"
                ;;
            db)
                opts="--host --port --user --password --database --verbose -h --help"
                ;;
            docker)
                opts="--tag --file --no-cache --platform --verbose -h --help"
                ;;
            k8s)
                opts="--namespace --context --kubeconfig --verbose -h --help"
                ;;
            completion)
                opts="-h --help"
                ;;
            *)
                opts="-l --lang -m --model --offline --voice -p --personality -v --verbose -h --help"
                ;;
        esac
        COMPREPLY=($(compgen -W "${opts}" -- "${cur}"))
        return
    fi

    # Default to commands
    COMPREPLY=($(compgen -W "${commands}" -- "${cur}"))
}

complete -F _ankrcode_completions ankrcode
