import prisma from '../db/prisma.js';
import { embeddingService } from './embedding.service.js';

export interface CreateNoteInput {
  userId: string;
  title?: string;
  content: string;
  category?: string;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
}

export interface NoteSearchParams {
  userId: string;
  query?: string;
  category?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export class NotesService {
  async create(input: CreateNoteInput) {
    const { userId, title, content, category, tags } = input;

    // Generate embedding for the note content
    const textForEmbedding = `${title || ''} ${content}`.trim();
    const embedding = await embeddingService.generateEmbedding(textForEmbedding);

    // Auto-categorize if no category provided
    let finalCategory = category;
    if (!finalCategory) {
      finalCategory = await this.suggestCategory(userId, embedding, content);
    }

    // Create note with embedding using raw SQL
    const [note] = await prisma.$queryRaw<
      { id: string; user_id: string; title: string | null; content: string; category: string | null; tags: string[]; created_at: Date; updated_at: Date }[]
    >`
      INSERT INTO notes (id, user_id, title, content, category, tags, embedding, created_at, updated_at)
      VALUES (gen_random_uuid(), ${userId}, ${title || null}, ${content}, ${finalCategory || null}, ${tags || []}::text[], ${embedding}::vector, NOW(), NOW())
      RETURNING id, user_id, title, content, category, tags, created_at, updated_at
    `;

    // Update category embedding if we have a category
    if (finalCategory) {
      await embeddingService.createOrUpdateCategory(userId, finalCategory, 'note', embedding);
    }

    return {
      id: note.id,
      userId: note.user_id,
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    };
  }

  async update(noteId: string, userId: string, input: UpdateNoteInput) {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!existing) {
      throw new Error('Note not found');
    }

    const content = input.content ?? existing.content;
    const title = input.title ?? existing.title;

    // Regenerate embedding if content changed
    let embedding: number[] | undefined;
    if (input.content) {
      const textForEmbedding = `${title || ''} ${content}`.trim();
      embedding = await embeddingService.generateEmbedding(textForEmbedding);
    }

    if (embedding) {
      await prisma.$executeRaw`
        UPDATE notes 
        SET 
          title = ${title},
          content = ${content},
          category = ${input.category ?? existing.category},
          tags = ${input.tags ?? existing.tags}::text[],
          embedding = ${embedding}::vector,
          updated_at = NOW()
        WHERE id = ${noteId}
      `;
    } else {
      await prisma.note.update({
        where: { id: noteId },
        data: {
          title: input.title,
          content: input.content,
          category: input.category,
          tags: input.tags,
        },
      });
    }

    return this.getById(noteId, userId);
  }

  async delete(noteId: string, userId: string) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!note) {
      throw new Error('Note not found');
    }

    await prisma.note.delete({ where: { id: noteId } });
    return { success: true };
  }

  async getById(noteId: string, userId: string) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!note) {
      throw new Error('Note not found');
    }

    return note;
  }

  async list(params: NoteSearchParams) {
    const { userId, category, tags, limit = 50, offset = 0 } = params;

    const where: Record<string, unknown> = { userId };

    if (category) {
      where.category = category;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.note.count({ where });

    return { notes, total };
  }

  async search(userId: string, query: string, limit: number = 10) {
    // Generate embedding for search query
    const embedding = await embeddingService.generateEmbedding(query);

    // Semantic search using vector similarity
    const results = await embeddingService.findSimilarNotes(userId, embedding, limit);

    return results.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      category: r.category,
      similarity: r.similarity,
    }));
  }

  async getCategories(userId: string) {
    const categories = await prisma.note.groupBy({
      by: ['category'],
      where: { userId, category: { not: null } },
      _count: { category: true },
    });

    return categories
      .filter((c) => c.category)
      .map((c) => ({
        name: c.category!,
        count: c._count.category,
      }));
  }

  private async suggestCategory(userId: string, embedding: number[], content: string): Promise<string | undefined> {
    // Find similar categories
    const similarCategories = await embeddingService.findSimilarCategories(userId, embedding, 'note', 3);

    // If we have a highly similar category (> 0.8), use it
    if (similarCategories.length > 0 && similarCategories[0].similarity > 0.8) {
      return similarCategories[0].name;
    }

    // Otherwise, generate a category using content analysis
    // For now, use simple keyword-based categorization
    const lowercaseContent = content.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      'Work': ['meeting', 'project', 'deadline', 'client', 'presentation', 'report', 'office'],
      'Personal': ['family', 'friend', 'birthday', 'vacation', 'hobby', 'weekend'],
      'Health': ['workout', 'exercise', 'diet', 'doctor', 'medicine', 'sleep', 'meditation', 'gym'],
      'Finance': ['budget', 'expense', 'investment', 'salary', 'tax', 'savings', 'money'],
      'Learning': ['course', 'book', 'study', 'learn', 'tutorial', 'skill', 'education'],
      'Ideas': ['idea', 'thought', 'concept', 'brainstorm', 'plan', 'strategy'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => lowercaseContent.includes(keyword))) {
        return category;
      }
    }

    return 'General';
  }
}

export const notesService = new NotesService();
