import type { LucideIcon } from 'lucide-react';
import { FilePlus } from 'lucide-react';
import { actions } from './store';

type CommandContext = { navigate: (href: string) => void };

export type Command = {
  name: `/${string}`;
  description: string;
  icon: LucideIcon;
  /** Shown under the input when `run` throws (UX writing: what happened + what to do). */
  failMessage: string;
  run: (ctx: CommandContext) => void | Promise<void>;
};

/**
 * Slash-command registry (PRD §6). Add a new entry here to add a command,
 * e.g. `/todo` — the workspace input picks it up automatically.
 */
export const COMMANDS: Command[] = [
  {
    name: '/page',
    description: '새 글 만들기',
    icon: FilePlus,
    failMessage: '새 글을 만들지 못했어요. 다시 시도해 주세요.',
    run: async ({ navigate }) => navigate(`/pages/${(await actions.createPage()).id}`),
  },
];

export function matchCommands(input: string) {
  const q = input.trim().toLowerCase();
  if (!q.startsWith('/')) return [];
  return COMMANDS.filter((c) => c.name.startsWith(q));
}
