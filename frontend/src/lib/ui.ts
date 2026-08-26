// Small set of shared class-name tokens so the same "card", "muted text",
// etc. look identical across every page without redefining them in each
// file. Kept as plain literal strings (not a template/generator) so
// Tailwind's static scanner can see and compile every class used.

export const CARD = "rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900";

export const CARD_LIST =
  "divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900";

export const SECTION_HEADING =
  "mb-1 px-3 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400";

export const MUTED = "text-neutral-500 dark:text-neutral-400";

export const FAINT = "text-neutral-400 dark:text-neutral-500";

// No padding-y baked in — callers add py-1.5 (compact, filters) or py-2
// (roomier, forms) so two conflicting py-* utilities never land on the
// same element.
export const FIELD =
  "rounded-lg bg-neutral-100 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500";

export const BUTTON_PRIMARY =
  "rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-400";

export const BUTTON_SECONDARY =
  "rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800";

export const BUTTON_GHOST_SM =
  "rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100";
