import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { notesService } from '../../services/notes.service.js';

export function createNoteTools(userId: string) {
  const createNoteTool = new DynamicStructuredTool({
    name: 'create_note',
    description: 'Create a new note. Use this when the user wants to save information, take a note, or remember something.',
    schema: z.object({
      title: z.string().optional().describe('Optional title for the note'),
      content: z.string().describe('The content of the note'),
      category: z.string().optional().describe('Optional category for the note (e.g., Work, Personal, Health, Ideas)'),
      tags: z.array(z.string()).optional().describe('Optional tags for the note'),
    }),
    func: async ({ title, content, category, tags }) => {
      try {
        const note = await notesService.create({
          userId,
          title,
          content,
          category,
          tags,
        });
        return JSON.stringify({
          success: true,
          message: `Note created successfully${note.category ? ` in category "${note.category}"` : ''}`,
          note: {
            id: note.id,
            title: note.title,
            category: note.category,
          },
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const searchNotesTool = new DynamicStructuredTool({
    name: 'search_notes',
    description: 'Search through notes using semantic similarity. Use this when the user wants to find notes about a specific topic.',
    schema: z.object({
      query: z.string().describe('The search query to find related notes'),
      limit: z.number().optional().default(5).describe('Maximum number of results to return'),
    }),
    func: async ({ query, limit }) => {
      try {
        const results = await notesService.search(userId, query, limit);
        if (results.length === 0) {
          return JSON.stringify({
            success: true,
            message: 'No notes found matching your query.',
            notes: [],
          });
        }
        return JSON.stringify({
          success: true,
          message: `Found ${results.length} related note(s)`,
          notes: results.map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content.slice(0, 200) + (n.content.length > 200 ? '...' : ''),
            category: n.category,
            relevance: Math.round(n.similarity * 100) + '%',
          })),
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const listNotesTool = new DynamicStructuredTool({
    name: 'list_notes',
    description: 'List notes, optionally filtered by category. Use this when the user wants to see their notes.',
    schema: z.object({
      category: z.string().optional().describe('Filter by category'),
      limit: z.number().optional().default(10).describe('Maximum number of notes to return'),
    }),
    func: async ({ category, limit }) => {
      try {
        const result = await notesService.list({
          userId,
          category,
          limit,
        });
        return JSON.stringify({
          success: true,
          message: `Found ${result.total} note(s)${category ? ` in "${category}"` : ''}`,
          notes: result.notes.map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content.slice(0, 100) + (n.content.length > 100 ? '...' : ''),
            category: n.category,
            createdAt: n.createdAt,
          })),
          total: result.total,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const getCategoriesTool = new DynamicStructuredTool({
    name: 'get_note_categories',
    description: 'Get all note categories with counts. Use this when the user asks about their note organization.',
    schema: z.object({}),
    func: async () => {
      try {
        const categories = await notesService.getCategories(userId);
        if (categories.length === 0) {
          return JSON.stringify({
            success: true,
            message: 'No categories found. Notes will be auto-categorized when created.',
            categories: [],
          });
        }
        return JSON.stringify({
          success: true,
          message: `Found ${categories.length} categories`,
          categories,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const updateNoteTool = new DynamicStructuredTool({
    name: 'update_note',
    description: 'Update an existing note. Use this when the user wants to modify a note.',
    schema: z.object({
      noteId: z.string().describe('The ID of the note to update'),
      title: z.string().optional().describe('New title'),
      content: z.string().optional().describe('New content'),
      category: z.string().optional().describe('New category'),
      tags: z.array(z.string()).optional().describe('New tags'),
    }),
    func: async ({ noteId, title, content, category, tags }) => {
      try {
        const note = await notesService.update(noteId, userId, {
          title,
          content,
          category,
          tags,
        });
        return JSON.stringify({
          success: true,
          message: 'Note updated successfully',
          note: {
            id: note?.id,
            title: note?.title,
            category: note?.category,
          },
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const deleteNoteTool = new DynamicStructuredTool({
    name: 'delete_note',
    description: 'Delete a note. Use this when the user wants to remove a note.',
    schema: z.object({
      noteId: z.string().describe('The ID of the note to delete'),
    }),
    func: async ({ noteId }) => {
      try {
        await notesService.delete(noteId, userId);
        return JSON.stringify({
          success: true,
          message: 'Note deleted successfully',
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  return [
    createNoteTool,
    searchNotesTool,
    listNotesTool,
    getCategoriesTool,
    updateNoteTool,
    deleteNoteTool,
  ];
}
