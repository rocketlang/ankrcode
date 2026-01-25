/**
 * Skill Tool
 * Bridge to MCP tools and user-defined skills
 */
const skillRegistry = new Map();
// Built-in ANKR skills
const ANKR_SKILLS = {
    'ankr-db': {
        name: 'ankr-db',
        description: 'ANKR database operations for PostgreSQL',
        async handler(args) {
            // Would integrate with @ankr/db or direct PostgreSQL
            return {
                success: true,
                output: `[ankr-db] Database skill invoked with: ${args || 'no args'}

To use:
- Query: ankr-db "SELECT * FROM users LIMIT 10"
- Connect: postgresql://ankr:indrA@0612@localhost:5432/ankr_eon`,
            };
        },
    },
    'ankr-delegate': {
        name: 'ankr-delegate',
        description: 'Delegate tasks to GPT experts via Codex MCP',
        async handler(args) {
            // Would integrate with claude-delegator package
            return {
                success: true,
                output: `[ankr-delegate] Expert delegation invoked

Available experts:
- Architect: System design, tradeoffs
- Plan Reviewer: Validate plans
- Scope Analyst: Requirements analysis
- Code Reviewer: Code quality
- Security Analyst: Vulnerabilities

Args: ${args || 'none'}`,
            };
        },
    },
    'ankr-eon': {
        name: 'ankr-eon',
        description: 'EON Memory knowledge graph operations',
        async handler(args) {
            // Would integrate with @ankr/eon
            return {
                success: true,
                output: `[ankr-eon] Memory operations

Commands:
- remember <content>: Store in memory
- recall <query>: Retrieve from memory
- forget <id>: Remove from memory

Args: ${args || 'none'}`,
            };
        },
    },
    'ankr-freightbox': {
        name: 'ankr-freightbox',
        description: 'FreightBox NVOCC platform operations',
        async handler(args) {
            return {
                success: true,
                output: `[ankr-freightbox] FreightBox operations

Available operations:
- Booking management
- Container tracking
- BL generation
- Freight rates

Service URL: http://localhost:4003
Args: ${args || 'none'}`,
            };
        },
    },
    'ankr-wowtruck': {
        name: 'ankr-wowtruck',
        description: 'WowTruck TMS operations',
        async handler(args) {
            return {
                success: true,
                output: `[ankr-wowtruck] TMS operations

Available operations:
- Fleet management
- Trip planning
- Driver assignment
- GPS tracking

Service URL: http://localhost:4000
Args: ${args || 'none'}`,
            };
        },
    },
    'ankr-mcp': {
        name: 'ankr-mcp',
        description: 'Access 260+ MCP tools for ANKR operations',
        async handler(args) {
            // Would list or execute MCP tools
            return {
                success: true,
                output: `[ankr-mcp] MCP Tool Gateway

Categories:
- Compliance: 54 tools (GST, TDS, ITR)
- ERP: 44 tools (Invoice, Inventory)
- CRM: 30 tools (Lead, Contact)
- Banking: 28 tools (UPI, BBPS)
- Government: 22 tools (Aadhaar, DigiLocker)
- Logistics: 35 tools (Shipment, GPS)
- EON: 14 tools (Memory, Context)

Total: 255+ tools
Args: ${args || 'none'}`,
            };
        },
    },
    'ankr-ports': {
        name: 'ankr-ports',
        description: 'Get service ports and URLs',
        async handler(args) {
            // Would integrate with @ankr/config
            const ports = {
                'ai-proxy': 4444,
                'eon-memory': 4005,
                freightbox: 4003,
                wowtruck: 4000,
                crm: 4010,
                bani: 7777,
                postgresql: 5432,
                redis: 6379,
            };
            if (args) {
                const port = ports[args.toLowerCase()];
                if (port) {
                    return {
                        success: true,
                        output: `${args}: ${port}`,
                    };
                }
                return {
                    success: false,
                    error: `Unknown service: ${args}`,
                };
            }
            const list = Object.entries(ports)
                .map(([name, port]) => `${name}: ${port}`)
                .join('\n');
            return {
                success: true,
                output: `Service Ports:\n${list}`,
            };
        },
    },
};
// Register built-in skills
Object.values(ANKR_SKILLS).forEach((skill) => {
    skillRegistry.set(skill.name, skill);
});
/**
 * Skill Tool - Execute skills and slash commands
 */
export const skillTool = {
    name: 'Skill',
    description: `Execute a skill or slash command.

Available skills:
- ankr-db: PostgreSQL database operations
- ankr-delegate: GPT expert delegation
- ankr-eon: Memory/knowledge graph operations
- ankr-freightbox: NVOCC platform operations
- ankr-wowtruck: TMS operations
- ankr-mcp: Access 260+ MCP tools
- ankr-ports: Service port discovery

Usage: Skill with skill="ankr-ports" args="freightbox"`,
    parameters: {
        type: 'object',
        properties: {
            skill: {
                type: 'string',
                description: 'The skill name (e.g., "ankr-db", "ankr-mcp")',
            },
            args: {
                type: 'string',
                description: 'Optional arguments for the skill',
            },
        },
        required: ['skill'],
    },
    async handler(params) {
        const { skill, args } = params;
        // Look up skill
        const skillDef = skillRegistry.get(skill);
        if (!skillDef) {
            // List available skills
            const available = Array.from(skillRegistry.keys()).join(', ');
            return {
                success: false,
                error: `Unknown skill: "${skill}"\n\nAvailable skills: ${available}`,
            };
        }
        try {
            return await skillDef.handler(args);
        }
        catch (error) {
            return {
                success: false,
                error: `Skill error: ${error.message}`,
            };
        }
    },
};
// Skill management functions
export function registerSkill(skill) {
    skillRegistry.set(skill.name, skill);
}
export function getSkill(name) {
    return skillRegistry.get(name);
}
export function listSkills() {
    return Array.from(skillRegistry.values());
}
export function removeSkill(name) {
    return skillRegistry.delete(name);
}
//# sourceMappingURL=skill.js.map