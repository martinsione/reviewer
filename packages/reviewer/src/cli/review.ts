import type { CommandModule } from "yargs"
import { tui } from "./tui/bootstrap"

export const ReviewCommand: CommandModule = {
  command: "$0",
  describe: "Interactive git diff reviewer",
  builder: (yargs) =>
    yargs
      .option("staged", {
        type: "boolean",
        describe: "Review staged changes",
        default: false,
      })
      .option("all", {
        type: "boolean",
        describe: "Review all changes (staged + unstaged)",
        default: false,
      }),
  handler: async (args) => {
    await tui({ staged: args.staged as boolean, all: args.all as boolean })
  },
}
