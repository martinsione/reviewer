import { useGit } from "../context/git"
import { useTheme } from "../context/theme"

interface FileListProps {
  width: number
}

export function FileList({ width }: FileListProps) {
  const { theme } = useTheme()
  const { state } = useGit()

  if (state.loading) {
    return (
      <box
        style={{
          width,
          border: ["right"],
          borderColor: theme.border,
          padding: 1,
        }}
      >
        <text style={{ fg: theme.muted }} content="Loading..." />
      </box>
    )
  }

  if (state.files.length === 0) {
    return (
      <box
        style={{
          width,
          border: ["right"],
          borderColor: theme.border,
          padding: 1,
        }}
      >
        <text style={{ fg: theme.muted }} content="No changes" />
      </box>
    )
  }

  return (
    <box
      style={{
        width,
        border: ["right"],
        borderColor: theme.border,
        flexDirection: "column",
      }}
    >
      <box
        style={{
          height: 1,
          paddingLeft: 1,
          border: ["bottom"],
          borderColor: theme.border,
        }}
      >
        <text style={{ fg: theme.muted }} content="Files" />
      </box>
      <box style={{ flexDirection: "column", padding: 1 }}>
        {state.files.map((file, index) => {
          const isSelected = index === state.selectedFileIndex
          const statusIcon =
            file.status === "added"
              ? "+"
              : file.status === "deleted"
                ? "-"
                : file.status === "renamed"
                  ? "R"
                  : "M"
          const statusColor =
            file.status === "added"
              ? theme.diff.addedSign
              : file.status === "deleted"
                ? theme.diff.removedSign
                : theme.foreground

          // Truncate filename to fit
          const maxLen = width - 6
          const name =
            file.path.length > maxLen
              ? "..." + file.path.slice(-(maxLen - 3))
              : file.path

          return (
            <box
              key={file.path}
              style={{
                height: 1,
                backgroundColor: isSelected ? theme.selection : "transparent",
                flexDirection: "row",
              }}
            >
              <text
                style={{ fg: statusColor, width: 2 }}
                content={statusIcon}
              />
              <text
                style={{
                  fg: isSelected ? theme.selectionFg : theme.foreground,
                }}
                content={name}
              />
            </box>
          )
        })}
      </box>
    </box>
  )
}
