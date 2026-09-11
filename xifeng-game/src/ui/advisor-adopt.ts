export function appendAdoptedAdvice(current: string, suggestion: string): string {
  const existing = current.trimEnd();
  const addition = suggestion.trim();
  return existing && addition ? `${existing}\n${addition}` : existing || addition;
}
