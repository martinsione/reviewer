import { useGit } from "../context/git"
import { useTheme } from "../context/theme"

export function Header() {
  const { theme } = useTheme()
  const { state, computed } = useGit()

  const title = computed.currentFile
    ? `${computed.currentFile.path} (${computed.currentFile.status})`
    : "No changes"

  const hunkInfo = computed.currentFile
    ? `Hunk ${state.selectedHunkIndex + 1}/${computed.totalHunks}`
    : ""

  return (
    <box
      style={{
        height: 3,
        border: ["bottom"],
        borderColor: theme.border,
        paddingLeft: 1,
        paddingRight: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <text style={{ fg: theme.foreground }} content={title} />
      <text style={{ fg: theme.muted }} content={hunkInfo} />
    </box>
  )
}
