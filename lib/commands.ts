import type { LucideIcon } from 'lucide-react';
import { FilePlus } from 'lucide-react';
import { actions } from './store';

type CommandContext = { navigate: (href: string) => void };

export type Command = {
  name: `/${string}`;
  description: string;
  icon: LucideIcon;
  run: (ctx: CommandContext) => void;
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
    run: ({ navigate }) => navigate(`/pages/${actions.createPage().id}`),
  },
];

export function matchCommands(input: string) {
  const q = input.trim().toLowerCase();
  if (!q.startsWith('/')) return [];
  return COMMANDS.filter((c) => c.name.startsWith(q));
}
