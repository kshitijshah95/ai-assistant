import { createNoteTools } from './notes.tools.js';
import { createTaskTools } from './tasks.tools.js';
import { createGoalTools } from './goals.tools.js';
import { createHabitTools } from './habits.tools.js';
import { createCalendarTools } from './calendar.tools.js';

export function createAllTools(userId: string) {
  return [
    ...createNoteTools(userId),
    ...createTaskTools(userId),
    ...createGoalTools(userId),
    ...createHabitTools(userId),
    ...createCalendarTools(userId),
  ];
}

export { createNoteTools, createTaskTools, createGoalTools, createHabitTools, createCalendarTools };
