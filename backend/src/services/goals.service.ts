import prisma from '../db/prisma.js';

export type GoalStatus = 'active' | 'completed' | 'archived';

export interface CreateGoalInput {
  userId: string;
  title: string;
  description?: string;
  targetDate?: Date;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  status?: GoalStatus;
  targetDate?: Date | null;
}

export class GoalsService {
  async create(input: CreateGoalInput) {
    const goal = await prisma.goal.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        targetDate: input.targetDate,
      },
      include: {
        tasks: true,
      },
    });

    return goal;
  }

  async update(goalId: string, userId: string, input: UpdateGoalInput) {
    const existing = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!existing) {
      throw new Error('Goal not found');
    }

    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        targetDate: input.targetDate,
      },
      include: {
        tasks: true,
      },
    });

    return goal;
  }

  async delete(goalId: string, userId: string) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    await prisma.goal.delete({ where: { id: goalId } });
    return { success: true };
  }

  async getById(goalId: string, userId: string) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    return goal;
  }

  async list(userId: string, status?: GoalStatus) {
    const where: Record<string, unknown> = { userId };
    if (status) where.status = status;

    const goals = await prisma.goal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: true,
      },
    });

    return goals.map((goal) => ({
      ...goal,
      progress: this.calculateProgress(goal.tasks),
    }));
  }

  async getGoalWithProgress(goalId: string, userId: string) {
    const goal = await this.getById(goalId, userId);
    return {
      ...goal,
      progress: this.calculateProgress(goal.tasks),
    };
  }

  private calculateProgress(tasks: { status: string }[]): number {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  }
}

export const goalsService = new GoalsService();
