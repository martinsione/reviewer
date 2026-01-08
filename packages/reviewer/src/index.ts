import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { ReviewCommand } from "./cli/review"

const cli = yargs(hideBin(process.argv))
  .scriptName("reviewer")
  .command(ReviewCommand)
  .help()
  .strict()

await cli.parse()
