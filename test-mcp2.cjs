const mcp = require('@powerpbox/mcp');

console.log('Module exports:', Object.keys(mcp));

// Check for tools directly
if (mcp.tools) {
  console.log('mcp.tools:', mcp.tools);
}

if (mcp.getAllTools) {
  console.log('mcp.getAllTools():', mcp.getAllTools()?.length);
}

if (mcp.registry) {
  console.log('mcp.registry.getAll():', mcp.registry.getAll()?.length);
}

if (mcp.server) {
  console.log('mcp.server:', Object.keys(mcp.server));
}

if (mcp.ToolRegistry) {
  console.log('ToolRegistry:', typeof mcp.ToolRegistry);
}

// Check default export
if (mcp.default) {
  console.log('default export:', Object.keys(mcp.default));
}
