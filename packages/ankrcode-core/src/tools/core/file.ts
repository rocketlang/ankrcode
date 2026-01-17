/**
 * File Operation Tools
 * Read, Write, Edit - Core tools for file manipulation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool, ToolResult } from '../../types.js';

// Track files that have been read (for Edit safety)
const filesRead = new Set<string>();

export function hasRecentlyRead(filePath: string): boolean {
  return filesRead.has(path.resolve(filePath));
}

export function markAsRead(filePath: string): void {
  filesRead.add(path.resolve(filePath));
}

/**
 * Read Tool - Read file contents with line numbers
 */
export const readTool: Tool = {
  name: 'Read',
  description: `Reads a file from the local filesystem.
- file_path must be an absolute path
- Returns content with line numbers (cat -n format)
- Can specify offset and limit for large files
- Supports images (returns base64), PDFs, and Jupyter notebooks`,
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to read',
      },
      offset: {
        type: 'number',
        description: 'Line number to start reading from (0-indexed)',
      },
      limit: {
        type: 'number',
        description: 'Number of lines to read (default: 2000)',
      },
    },
    required: ['file_path'],
  },

  async handler(params): Promise<ToolResult> {
    const { file_path, offset = 0, limit = 2000 } = params as {
      file_path: string;
      offset?: number;
      limit?: number;
    };

    // Validate absolute path
    if (!path.isAbsolute(file_path)) {
      return {
        success: false,
        error: `Path must be absolute. Got: ${file_path}`,
      };
    }

    try {
      // Check if file exists
      await fs.access(file_path);

      // Check file extension for special handling
      const ext = path.extname(file_path).toLowerCase();

      // Handle images
      if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) {
        const content = await fs.readFile(file_path);
        return {
          success: true,
          output: `[Image file: ${file_path}]`,
          data: {
            type: 'image',
            base64: content.toString('base64'),
            mimeType: getMimeType(ext),
          },
        };
      }

      // Handle PDFs (basic - would need pdf-parse for full support)
      if (ext === '.pdf') {
        return {
          success: true,
          output: `[PDF file: ${file_path}] - PDF parsing requires pdf-parse library`,
          data: { type: 'pdf', path: file_path },
        };
      }

      // Handle Jupyter notebooks
      if (ext === '.ipynb') {
        const content = await fs.readFile(file_path, 'utf-8');
        const notebook = JSON.parse(content);
        const formatted = formatNotebook(notebook);
        markAsRead(file_path);
        return { success: true, output: formatted };
      }

      // Handle text files
      const content = await fs.readFile(file_path, 'utf-8');
      const lines = content.split('\n');
      const selected = lines.slice(offset, offset + limit);

      // Format with line numbers (cat -n style)
      const formatted = selected
        .map((line, i) => {
          const lineNum = String(offset + i + 1).padStart(6);
          // Truncate long lines
          const truncated = line.length > 2000 ? line.slice(0, 2000) + '...' : line;
          return `${lineNum}\t${truncated}`;
        })
        .join('\n');

      markAsRead(file_path);

      return {
        success: true,
        output: formatted,
        metadata: {
          totalLines: lines.length,
          readFrom: offset,
          readTo: Math.min(offset + limit, lines.length),
        },
      };
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return { success: false, error: `File not found: ${file_path}` };
      }
      return { success: false, error: `Error reading file: ${err.message}` };
    }
  },
};

/**
 * Write Tool - Write content to a file
 */
export const writeTool: Tool = {
  name: 'Write',
  description: `Writes content to a file.
- Overwrites existing file if present
- Creates parent directories if needed
- REQUIRES reading file first if it already exists`,
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to write',
      },
      content: {
        type: 'string',
        description: 'The content to write to the file',
      },
    },
    required: ['file_path', 'content'],
  },

  async handler(params): Promise<ToolResult> {
    const { file_path, content } = params as {
      file_path: string;
      content: string;
    };

    if (!path.isAbsolute(file_path)) {
      return { success: false, error: 'Path must be absolute' };
    }

    try {
      // Check if file exists
      let exists = false;
      try {
        await fs.access(file_path);
        exists = true;
      } catch {
        exists = false;
      }

      // If file exists, must have been read first
      if (exists && !hasRecentlyRead(file_path)) {
        return {
          success: false,
          error: 'Must Read file before overwriting. Use Read tool first.',
        };
      }

      // Create parent directories if needed
      const dir = path.dirname(file_path);
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(file_path, content, 'utf-8');

      return {
        success: true,
        output: `File written: ${file_path} (${content.length} bytes)`,
      };
    } catch (error) {
      return { success: false, error: `Error writing file: ${(error as Error).message}` };
    }
  },
};

/**
 * Edit Tool - Precise string replacement in files
 * This is the CRITICAL tool for code editing
 */
export const editTool: Tool = {
  name: 'Edit',
  description: `Performs exact string replacements in files.
- old_string must be UNIQUE in file (or use replace_all)
- Preserves exact indentation and formatting
- REQUIRES reading file first (for safety)
- Fails if old_string not found or not unique`,
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to modify',
      },
      old_string: {
        type: 'string',
        description: 'The exact text to replace (must be unique)',
      },
      new_string: {
        type: 'string',
        description: 'The text to replace it with',
      },
      replace_all: {
        type: 'boolean',
        description: 'Replace all occurrences (default: false)',
      },
    },
    required: ['file_path', 'old_string', 'new_string'],
  },

  async handler(params): Promise<ToolResult> {
    const {
      file_path,
      old_string,
      new_string,
      replace_all = false,
    } = params as {
      file_path: string;
      old_string: string;
      new_string: string;
      replace_all?: boolean;
    };

    if (!path.isAbsolute(file_path)) {
      return { success: false, error: 'Path must be absolute' };
    }

    // Safety check: must have read file first
    if (!hasRecentlyRead(file_path)) {
      return {
        success: false,
        error: 'Must Read file before editing. Use Read tool first.',
      };
    }

    // Validate strings are different
    if (old_string === new_string) {
      return {
        success: false,
        error: 'old_string and new_string are identical',
      };
    }

    try {
      const content = await fs.readFile(file_path, 'utf-8');

      // Count occurrences
      const occurrences = countOccurrences(content, old_string);

      if (occurrences === 0) {
        return {
          success: false,
          error: `old_string not found in file. Check for exact match including whitespace.`,
        };
      }

      if (occurrences > 1 && !replace_all) {
        return {
          success: false,
          error: `old_string found ${occurrences} times. Provide more surrounding context to make it unique, or use replace_all: true`,
        };
      }

      // Perform replacement
      let newContent: string;
      if (replace_all) {
        newContent = content.split(old_string).join(new_string);
      } else {
        newContent = content.replace(old_string, new_string);
      }

      // Write back
      await fs.writeFile(file_path, newContent, 'utf-8');

      return {
        success: true,
        output: `Replaced ${replace_all ? occurrences : 1} occurrence(s) in ${file_path}`,
        metadata: {
          replacements: replace_all ? occurrences : 1,
          file_path,
        },
      };
    } catch (error) {
      return { success: false, error: `Error editing file: ${(error as Error).message}` };
    }
  },
};

// Helper functions
function countOccurrences(str: string, substr: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(substr, pos)) !== -1) {
    count++;
    pos += substr.length;
  }
  return count;
}

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function formatNotebook(notebook: any): string {
  const cells = notebook.cells || [];
  let output = '# Jupyter Notebook\n\n';

  cells.forEach((cell: any, i: number) => {
    const cellType = cell.cell_type;
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;

    output += `## Cell ${i + 1} (${cellType})\n`;
    if (cellType === 'code') {
      output += '```python\n' + source + '\n```\n';
      if (cell.outputs?.length) {
        output += '\n**Output:**\n';
        cell.outputs.forEach((out: any) => {
          if (out.text) {
            output += Array.isArray(out.text) ? out.text.join('') : out.text;
          }
        });
      }
    } else {
      output += source;
    }
    output += '\n\n';
  });

  return output;
}
