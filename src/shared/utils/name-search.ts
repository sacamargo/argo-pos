/** Case-insensitive name match (Spanish locale). Empty query matches all. */
export function matchesNameSearch(name: string, query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  if (!normalizedQuery) {
    return true;
  }
  return name.toLocaleLowerCase("es").includes(normalizedQuery);
}
