import { useGit } from "../context/git"
import { useTheme } from "../context/theme"

export function StatusBar() {
  const { theme } = useTheme()
  const { state, computed } = useGit()

  const branch = state.branch || "unknown"

  const fileInfo = computed.currentFile
    ? `${computed.currentFile.path} (${computed.currentFile.status})`
    : "No changes"

  const hunkInfo = computed.currentFile
    ? `${state.selectedHunkIndex + 1}/${computed.totalHunks}`
    : ""

  return (
    <box
      style={{
        height: 1,
        paddingLeft: 1,
        paddingRight: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: theme.selection,
      }}
    >
      <box style={{ flexDirection: "row", gap: 2 }}>
        <text style={{ fg: theme.selectionFg }} content={branch} />
        <text style={{ fg: theme.selectionFg }} content={fileInfo} />
      </box>
      {hunkInfo && <text style={{ fg: theme.selectionFg }} content={hunkInfo} />}
    </box>
  )
}
