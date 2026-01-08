/**
 * Get the current git branch name
 */
export async function getBranch(): Promise<string> {
  const result = await Bun.$`git rev-parse --abbrev-ref HEAD`.quiet().text().catch(() => "")
  return result.trim() || "unknown"
}
