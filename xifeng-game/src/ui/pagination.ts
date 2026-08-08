export function paginate<T>(items: readonly T[], requestedPage: number, pageSize: number) {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error('pageSize must be a positive integer');
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(0, requestedPage), pageCount - 1);
  return {
    page,
    pageCount,
    items: items.slice(page * pageSize, (page + 1) * pageSize),
  };
}
