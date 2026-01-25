const { getMCPAdapter } = require('./packages/ankrcode-core/dist/mcp/adapter.js');
const mcp = getMCPAdapter();

setTimeout(() => {
  console.log('Has registry:', mcp.mcpRegistry !== null);
  console.log('Tools count:', mcp.getAllTools().length);
  console.log('Available:', mcp.isAvailable());

  if (mcp.mcpRegistry) {
    const r = mcp.mcpRegistry;
    console.log('Registry prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(r) || {}));

    // Try different methods
    if (r.tools instanceof Map) {
      console.log('r.tools Map size:', r.tools.size);
    }
    if (typeof r.getTools === 'function') {
      console.log('r.getTools():', r.getTools().length);
    }
    if (typeof r.getAll === 'function') {
      console.log('r.getAll():', r.getAll().length);
    }
  }
}, 3000);
