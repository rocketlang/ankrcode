/**
 * NotebookEdit Tool
 *
 * Edit Jupyter notebooks (.ipynb files)
 * Supports: replace cell content, insert cells, delete cells
 */
import * as fs from 'fs';
// ============================================================================
// Notebook Parser
// ============================================================================
function parseNotebook(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const notebook = JSON.parse(content);
    // Validate structure
    if (!notebook.cells || !Array.isArray(notebook.cells)) {
        throw new Error('Invalid notebook: missing cells array');
    }
    if (typeof notebook.nbformat !== 'number') {
        throw new Error('Invalid notebook: missing nbformat');
    }
    return notebook;
}
function writeNotebook(filePath, notebook) {
    const content = JSON.stringify(notebook, null, 1);
    fs.writeFileSync(filePath, content, 'utf-8');
}
// ============================================================================
// Cell Operations
// ============================================================================
function normalizeSource(source) {
    if (typeof source === 'string') {
        // Split by newlines but preserve them
        return source.split(/(?<=\n)/);
    }
    return source;
}
function sourceToString(source) {
    if (Array.isArray(source)) {
        return source.join('');
    }
    return source;
}
function findCellIndex(notebook, cellId, cellNumber) {
    if (cellId) {
        const index = notebook.cells.findIndex(c => c.id === cellId);
        if (index === -1) {
            throw new Error(`Cell with ID "${cellId}" not found`);
        }
        return index;
    }
    if (cellNumber !== undefined) {
        if (cellNumber < 0 || cellNumber >= notebook.cells.length) {
            throw new Error(`Cell number ${cellNumber} out of range (0-${notebook.cells.length - 1})`);
        }
        return cellNumber;
    }
    throw new Error('Either cell_id or cell_number must be provided');
}
function generateCellId() {
    return Math.random().toString(36).substring(2, 10);
}
function createCell(cellType, source, metadata) {
    const cell = {
        cell_type: cellType,
        source: normalizeSource(source),
        metadata: metadata || {},
        id: generateCellId(),
    };
    if (cellType === 'code') {
        cell.execution_count = null;
        cell.outputs = [];
    }
    return cell;
}
// ============================================================================
// Edit Operations
// ============================================================================
function replaceCell(notebook, index, newSource, newCellType) {
    const cell = notebook.cells[index];
    // Update source
    cell.source = normalizeSource(newSource);
    // Optionally change cell type
    if (newCellType && newCellType !== cell.cell_type) {
        cell.cell_type = newCellType;
        if (newCellType === 'code') {
            cell.execution_count = null;
            cell.outputs = [];
        }
        else {
            delete cell.execution_count;
            delete cell.outputs;
        }
    }
    // Clear outputs on code cell edit
    if (cell.cell_type === 'code') {
        cell.execution_count = null;
        cell.outputs = [];
    }
    return cell;
}
function insertCell(notebook, afterIndex, cellType, source) {
    const newCell = createCell(cellType, source);
    // Insert after the specified index (-1 means at beginning)
    notebook.cells.splice(afterIndex + 1, 0, newCell);
    return newCell;
}
function deleteCell(notebook, index) {
    const [deleted] = notebook.cells.splice(index, 1);
    return deleted;
}
// ============================================================================
// Tool Definition
// ============================================================================
export const notebookEditTool = {
    name: 'NotebookEdit',
    description: `Edit Jupyter notebook (.ipynb) files. Supports replacing cell contents, inserting new cells, and deleting cells.

Usage:
- Replace: Change content of an existing cell
- Insert: Add a new cell after a specified position
- Delete: Remove a cell

Cell identification:
- By cell_id: Use the cell's unique ID (found in cell metadata)
- By cell_number: Use 0-based index (0 = first cell)

For insert mode, cell_number specifies where to insert AFTER (-1 or omit for beginning).`,
    parameters: {
        type: 'object',
        properties: {
            notebook_path: {
                type: 'string',
                description: 'Absolute path to the .ipynb file',
            },
            new_source: {
                type: 'string',
                description: 'New content for the cell (required for replace/insert)',
            },
            cell_id: {
                type: 'string',
                description: 'ID of the cell to edit (alternative to cell_number)',
            },
            cell_number: {
                type: 'number',
                description: '0-based index of cell. For insert: position to insert after (-1 for beginning)',
            },
            cell_type: {
                type: 'string',
                enum: ['code', 'markdown'],
                description: 'Cell type (required for insert, optional for replace)',
            },
            edit_mode: {
                type: 'string',
                enum: ['replace', 'insert', 'delete'],
                description: 'Type of edit: replace (default), insert, or delete',
            },
        },
        required: ['notebook_path', 'new_source'],
    },
    async handler(params) {
        const { notebook_path, new_source, cell_id, cell_number, cell_type, edit_mode = 'replace', } = params;
        // Validate path
        if (!notebook_path.endsWith('.ipynb')) {
            return {
                success: false,
                error: 'File must be a Jupyter notebook (.ipynb)',
            };
        }
        if (!fs.existsSync(notebook_path)) {
            return {
                success: false,
                error: `Notebook not found: ${notebook_path}`,
            };
        }
        try {
            const notebook = parseNotebook(notebook_path);
            let result;
            let message;
            switch (edit_mode) {
                case 'replace': {
                    const index = findCellIndex(notebook, cell_id, cell_number);
                    result = replaceCell(notebook, index, new_source, cell_type);
                    message = `Replaced cell ${index} (${result.cell_type})`;
                    break;
                }
                case 'insert': {
                    if (!cell_type) {
                        return {
                            success: false,
                            error: 'cell_type is required for insert mode',
                        };
                    }
                    const afterIndex = cell_number ?? -1;
                    result = insertCell(notebook, afterIndex, cell_type, new_source);
                    message = `Inserted new ${cell_type} cell after position ${afterIndex}`;
                    break;
                }
                case 'delete': {
                    const index = findCellIndex(notebook, cell_id, cell_number);
                    result = deleteCell(notebook, index);
                    message = `Deleted cell ${index} (${result.cell_type})`;
                    break;
                }
                default:
                    return {
                        success: false,
                        error: `Unknown edit_mode: ${edit_mode}`,
                    };
            }
            // Write the modified notebook
            writeNotebook(notebook_path, notebook);
            return {
                success: true,
                output: message,
                data: {
                    cell: {
                        id: result.id,
                        type: result.cell_type,
                        source: sourceToString(result.source).slice(0, 200) +
                            (sourceToString(result.source).length > 200 ? '...' : ''),
                    },
                    totalCells: notebook.cells.length,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
};
// ============================================================================
// Notebook Read Tool (companion)
// ============================================================================
export const notebookReadTool = {
    name: 'NotebookRead',
    description: `Read a Jupyter notebook (.ipynb) file and display its cells.
Returns cell contents, types, and outputs in a readable format.`,
    parameters: {
        type: 'object',
        properties: {
            notebook_path: {
                type: 'string',
                description: 'Absolute path to the .ipynb file',
            },
            cell_number: {
                type: 'number',
                description: 'Read only a specific cell (0-based index)',
            },
            include_outputs: {
                type: 'boolean',
                description: 'Include cell outputs (default: true)',
            },
        },
        required: ['notebook_path'],
    },
    async handler(params) {
        const { notebook_path, cell_number, include_outputs = true } = params;
        if (!notebook_path.endsWith('.ipynb')) {
            return {
                success: false,
                error: 'File must be a Jupyter notebook (.ipynb)',
            };
        }
        if (!fs.existsSync(notebook_path)) {
            return {
                success: false,
                error: `Notebook not found: ${notebook_path}`,
            };
        }
        try {
            const notebook = parseNotebook(notebook_path);
            // Format cells for display
            const formatCell = (cell, index) => {
                const lines = [];
                const source = sourceToString(cell.source);
                lines.push(`--- Cell ${index} [${cell.cell_type}] ${cell.id ? `(${cell.id})` : ''} ---`);
                if (cell.cell_type === 'code') {
                    lines.push('```python');
                    lines.push(source.trim());
                    lines.push('```');
                    if (include_outputs && cell.outputs && cell.outputs.length > 0) {
                        lines.push('Output:');
                        for (const output of cell.outputs) {
                            if (output.output_type === 'stream') {
                                lines.push(output.text?.join('') || '');
                            }
                            else if (output.output_type === 'execute_result') {
                                const text = output.data?.['text/plain'];
                                if (text) {
                                    lines.push(Array.isArray(text) ? text.join('') : text);
                                }
                            }
                            else if (output.output_type === 'error') {
                                lines.push(`Error: ${output.ename}: ${output.evalue}`);
                            }
                        }
                    }
                }
                else {
                    lines.push(source.trim());
                }
                return lines.join('\n');
            };
            let output;
            if (cell_number !== undefined) {
                if (cell_number < 0 || cell_number >= notebook.cells.length) {
                    return {
                        success: false,
                        error: `Cell ${cell_number} out of range (0-${notebook.cells.length - 1})`,
                    };
                }
                output = formatCell(notebook.cells[cell_number], cell_number);
            }
            else {
                output = notebook.cells.map((cell, i) => formatCell(cell, i)).join('\n\n');
            }
            return {
                success: true,
                output,
                data: {
                    totalCells: notebook.cells.length,
                    metadata: {
                        kernel: notebook.metadata.kernelspec?.display_name,
                        language: notebook.metadata.language_info?.name,
                    },
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
};
// ============================================================================
// Export
// ============================================================================
export default {
    notebookEditTool,
    notebookReadTool,
};
//# sourceMappingURL=notebook.js.map