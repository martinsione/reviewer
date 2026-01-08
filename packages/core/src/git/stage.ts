import type { FileDiff, Hunk } from "./types"

export function buildHunkPatch(file: FileDiff, hunk: Hunk): string {
  const header = [
    `diff --git a/${file.path} b/${file.path}`,
    `--- a/${file.path}`,
    `+++ b/${file.path}`,
    hunk.header,
  ].join("\n")

  const lines = hunk.lines
    .map((line) => {
      switch (line.type) {
        case "context":
          return ` ${line.content}`
        case "add":
          return `+${line.content}`
        case "remove":
          return `-${line.content}`
      }
    })
    .join("\n")

  return `${header}\n${lines}\n`
}

export async function stageHunk(file: FileDiff, hunkIndex: number): Promise<void> {
  const hunk = file.hunks[hunkIndex]
  if (!hunk) throw new Error(`Hunk ${hunkIndex} not found in ${file.path}`)

  const patch = buildHunkPatch(file, hunk)

  const proc = Bun.spawn(["git", "apply", "--cached", "-"], {
    stdin: new Blob([patch]),
  })
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    throw new Error(`Failed to stage hunk`)
  }
}

export async function unstageHunk(file: FileDiff, hunkIndex: number): Promise<void> {
  const hunk = file.hunks[hunkIndex]
  if (!hunk) throw new Error(`Hunk ${hunkIndex} not found in ${file.path}`)

  const patch = buildHunkPatch(file, hunk)

  const proc = Bun.spawn(["git", "apply", "--cached", "--reverse", "-"], {
    stdin: new Blob([patch]),
  })
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    throw new Error(`Failed to unstage hunk`)
  }
}

export async function stageFile(path: string): Promise<void> {
  await Bun.$`git add ${path}`.quiet()
}

export async function unstageFile(path: string): Promise<void> {
  await Bun.$`git reset HEAD ${path}`.quiet()
}
