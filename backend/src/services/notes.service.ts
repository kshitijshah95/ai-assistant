import prisma from '../db/prisma.js';

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

    // Auto-categorize if no category provided
    const finalCategory = category || this.suggestCategory(content);

    const note = await prisma.note.create({
      data: {
        userId,
        title: title || null,
        content,
        category: finalCategory,
        tags: tags || [],
      },
    });

    return note;
  }

  async update(noteId: string, userId: string, input: UpdateNoteInput) {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!existing) {
      throw new Error('Note not found');
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: {
        title: input.title,
        content: input.content,
        category: input.category,
        tags: input.tags,
      },
    });

    return note;
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
    // Text-based search (fallback without vector search)
    const notes = await prisma.note.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      category: n.category,
      similarity: 1, // No actual similarity score without vectors
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

  private suggestCategory(content: string): string {
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
