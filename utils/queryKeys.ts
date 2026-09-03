/**
 * Central query-key registry for React Query. Keeping these in one place
 * (rather than inline arrays scattered across components) avoids typo'd
 * keys silently missing the cache, and makes invalidation ("refetch
 * everything under /transactions") straightforward.
 *
 * Convention: [domain, ...params]. Add new domains here as more of the app
 * moves off manual useEffect fetching (see the todo doc, item #4).
 */
export const queryKeys = {
  userStats:    (): readonly ["user-stats"] => ["user-stats"],
  transactions: (
    params: Record<string, unknown> = {}
  ): readonly ["transactions", Record<string, unknown>] => ["transactions", params],
  land: {
    all:       (): readonly ["lands"] => ["lands"],
    detail:    (id: string | number): readonly ["lands", string | number] => ["lands", id],
    userUnits: (id: string | number): readonly ["lands", string | number, "units"] => [
      "lands",
      id,
      "units",
    ],
  },
} as const;