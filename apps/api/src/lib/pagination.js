// Parse and clamp list pagination query params. Never throws and never returns
// values Postgres rejects: page < 1 used to produce a negative OFFSET (and a
// garbage limit could too), which 500'd the request (PG 2201X).
export function parsePagination(query, { defaultLimit = 10, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
}
