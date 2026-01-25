# AnkrCode Ecosystem Documentation

## Overview

AnkrCode is an AI coding assistant designed for Bharat (India-first) with Indic language support, voice capabilities, and integration with the ANKR Labs ecosystem of 255+ MCP tools.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AnkrCode Ecosystem                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐     ┌─────────────────────────────────┐   │
│  │   ankrcode-core     │     │      ankr-labs-nx (monorepo)    │   │
│  │   v2.38.3           │     │                                 │   │
│  │                     │     │  ┌─────────────────────────┐    │   │
│  │  • CLI Interface    │     │  │ @ankr/mcp-tools         │    │   │
│  │  • Browser Auto     │     │  │ 255+ MCP tools          │    │   │
│  │  • Voice Support    │     │  │ - Compliance (54)       │    │   │
│  │  • Indic Languages  │     │  │ - ERP (44)              │    │   │
│  └─────────┬───────────┘     │  │ - Logistics (35)        │    │   │
│            │                 │  │ - CRM (30)              │    │   │
│            │ optionalDeps    │  │ - Banking (28)          │    │   │
│            │                 │  │ - Government (22)       │    │   │
│            ▼                 │  │ - EON (14)              │    │   │
│  ┌─────────────────────┐     │  └─────────────────────────┘    │   │
│  │ Unified Adapter     │     │                                 │   │
│  │ src/adapters/       │     │  ┌─────────────────────────┐    │   │
│  │                     │     │  │ @ankr/vibecoding-tools  │    │   │
│  │ Detects & loads:    │     │  │ 10 tools (→35 planned)  │    │   │
│  │ • @ankr/mcp-tools   │◄────┼──│ - vibe_analyze          │    │   │
│  │ • @ankr/vibecoding  │     │  │ - scaffold_project      │    │   │
│  │ • @ankr/config      │     │  │ - generate_component    │    │   │
│  │ • @ankr/i18n        │     │  └─────────────────────────┘    │   │
│  └─────────────────────┘     │                                 │   │
│                              │  ┌─────────────────────────┐    │   │
│                              │  │ @ankr/config            │    │   │
│                              │  │ Port configuration      │    │   │
│                              │  │ Service URLs            │    │   │
│                              │  └─────────────────────────┘    │   │
│                              │                                 │   │
│                              │  ┌─────────────────────────┐    │   │
│                              │  │ ankr5 CLI               │    │   │
│                              │  │ .ankr/cli/bin/ankr5     │    │   │
│                              │  │ - gateway status        │    │   │
│                              │  │ - ports get/url         │    │   │
│                              │  │ - ai ask                │    │   │
│                              │  │ - mcp list/call         │    │   │
│                              │  │ - eon search/remember   │    │   │
│                              │  └─────────────────────────┘    │   │
│                              └─────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Repository Locations

| Component | Path | Status |
|-----------|------|--------|
| AnkrCode Standalone | `/root/ankrcode-project/` | v2.38.3 |
| AnkrCode in Monorepo | `/root/ankr-labs-nx/packages/ankrcode-core/` | Synced |
| MCP Tools | `/root/ankr-labs-nx/packages/mcp-tools/` | 255+ tools |
| Vibecoding Tools | `/root/ankr-labs-nx/packages/vibecoding-tools/` | 10 tools |
| ankr5 CLI | `/root/ankr-labs-nx/.ankr/cli/` | v2.1.0 |
| @ankr/config | `/root/ankr-labs-nx/libs/ankr-config/` | Active |
| @ankr/i18n | `/root/ankr-labs-nx/packages/ankr-i18n/` | Active |

---

## MCP Tools Categories

### 1. @ankr/mcp-tools (255+ tools)

| Category | Count | Example Tools |
|----------|-------|---------------|
| **Compliance** | 54 | `gst_verify`, `tds_calculate`, `itr_file`, `mca_search` |
| **ERP** | 44 | `invoice_create`, `inventory_check`, `order_process` |
| **Logistics** | 35 | `shipment_track`, `route_optimize`, `freight_calculate` |
| **CRM** | 30 | `lead_create`, `contact_add`, `deal_update` |
| **Banking** | 28 | `upi_pay`, `emi_calculate`, `bank_verify` |
| **Government** | 22 | `aadhaar_verify`, `digilocker_fetch`, `pan_validate` |
| **EON Memory** | 14 | `eon_remember`, `eon_recall`, `eon_context_query` |
| **Ports** | 4 | `ankr_get_port`, `ankr_get_url`, `ankr_list_services` |

### 2. @ankr/vibecoding-tools (10 tools → 35 planned)

| Category | Tools | Purpose |
|----------|-------|---------|
| **Vibe Analysis** | `vibe_analyze`, `vibe_score`, `vibe_compare` | Analyze code style/vibe |
| **Code Generation** | `generate_component`, `generate_hook`, `generate_util` | Generate React code |
| **API Generation** | `generate_api_route`, `generate_crud_routes` | Generate Fastify routes |
| **Scaffolding** | `scaffold_project`, `scaffold_module` | Full project scaffolding |

---

## ankr5 CLI Commands

```bash
# Gateway & Status
ankr5 gateway status          # Check all services health
ankr5 doctor                  # Full health diagnostics

# AI Operations
ankr5 ai ask "question"       # Quick AI query with RAG
ankr5 context build "query"   # Build RAG context

# Memory Operations
ankr5 eon search "term"       # Search EON memories
ankr5 eon remember "data"     # Store memory

# MCP Tools
ankr5 mcp list               # List all 255+ tools
ankr5 mcp call <tool> <args> # Call a specific tool

# Port Configuration
ankr5 ports get freightbox    # Get port: 4003
ankr5 ports url freightbox    # Get URL: http://localhost:4003

# Dev Automation (Ralph)
ankr5 ralph list              # List 24 AI dev tools
ankr5 ralph commit --all      # AI-powered git commit
```

---

## Integration Status

### AnkrCode Core Package Linkages

```json
// /root/ankrcode-project/packages/ankrcode-core/package.json
{
  "optionalDependencies": {
    "@ankr/mcp-tools": "file:../../../ankr-labs-nx/packages/mcp-tools",
    "@ankr/vibecoding-tools": "file:../../../ankr-labs-nx/packages/vibecoding-tools",
    "@ankr/config": "file:../../../ankr-labs-nx/libs/ankr-config",
    "@ankr/i18n": "file:../../../ankr-labs-nx/packages/ankr-i18n"
  }
}
```

### Unified Adapter Detection

The `src/adapters/unified.ts` detects available packages:

```typescript
// Detection flow
1. Try ESM import: await import(name)
2. Fallback to CJS: require(name)
3. Return { name, available: true/false, version }
```

---

## Doctor Command Output

```bash
$ ankrcode doctor

AnkrCode Doctor v2.38.3
=======================

Core Services:
  [✓] AI Proxy        http://localhost:4444
  [✓] EON Memory      http://localhost:4005
  [✓] MCP Server      http://localhost:4445
  [✓] Swayam          http://localhost:4443

ANKR Packages:
  [✓] @ankr/mcp-tools       v1.0.0 (255 tools)
  [✓] @ankr/vibecoding-tools v1.0.0 (10 tools)
  [?] @ankr/config          Has TS errors
  [✓] @ankr/i18n            v1.0.0
```

---

## Key Services & Ports

| Service | Port | URL |
|---------|------|-----|
| AI Proxy | 4444 | http://localhost:4444 |
| EON Memory | 4005 | http://localhost:4005 |
| MCP Server | 4445 | http://localhost:4445 |
| Swayam | 4443 | http://localhost:4443 |
| WowTruck Backend | 4000 | http://localhost:4000 |
| FreightBox Backend | 4003 | http://localhost:4003 |
| PostgreSQL | 5432 | postgresql://localhost:5432 |

---

## Usage Examples

### 1. Scaffold a Project with Vibecoding

```typescript
import { executeTool } from '@ankr/vibecoding-tools';

const result = await executeTool('scaffold_project', {
  name: 'my-app',
  type: 'react-app',
  vibe: 'modern'
});

// Writes files to disk
for (const file of result.files) {
  await fs.writeFile(file.path, file.content);
}
```

### 2. Use MCP Tools

```typescript
import { callTool } from '@ankr/mcp-tools';

// Validate GST number
const gstResult = await callTool('gst_verify', {
  gstNumber: '27AABCU9603R1ZM'
});

// Track shipment
const trackResult = await callTool('shipment_track', {
  trackingId: 'AWB123456789'
});
```

### 3. Use ankr5 CLI in Scripts

```bash
#!/bin/bash
# Get service URL dynamically
API_URL=$(ankr5 ports url freightbox)
curl "$API_URL/health"

# AI query with context
ankr5 ai ask "How do I implement pagination in FreightBox?"
```

---

## Development Workflow

### Adding New MCP Tools

1. Create tool in `packages/mcp-tools/src/tools/`
2. Register in `src/tools/index.ts`
3. Build: `npm run build`
4. Test: `ankr5 mcp call <tool-name> <args>`

### Adding Vibecoding Tools

1. Create tool in `packages/vibecoding-tools/src/tools/`
2. Register in `src/tools/index.ts`
3. Build: `npm run build`
4. Test: `executeTool('<tool-name>', { ... })`

---

## Known Issues

| Issue | Impact | Workaround |
|-------|--------|------------|
| @ankr/config has TS errors | Can't import directly | Use ankr5 CLI instead |
| ankr5 not in PATH | CLI commands fail | Add symlink or use full path |
| ESM/CJS interop | Some imports fail | Use createRequire fallback |

---

## Roadmap

### Short-term (v2.39)
- [ ] Fix @ankr/config TypeScript errors
- [ ] Add ankr5 to global PATH
- [ ] Integrate vibecoding with ankr5 ports

### Medium-term (v2.40)
- [ ] Upgrade vibecoding-tools to 35 tools
- [ ] Add RAG context to scaffolding
- [ ] EON memory for generation history

### Long-term (v3.0)
- [ ] Full enterprise templates
- [ ] AI-powered smart generation
- [ ] Voice-driven scaffolding

---

*Last Updated: 2026-01-17*
*Maintained by: ANKR Labs*
