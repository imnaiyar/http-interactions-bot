import { join, extname } from "path";
import { readdirSync, lstatSync } from "node:fs";

/**
 * @param dir - the directory to read (from the root directory)
 * @param skipDirectories The directories/sub-directories to skip
 * @param allowedExtensions extension of the files to read
 * @example
 * import { pathToFileURL } from "node:url";
 * const { reacursiveReadDir } = require('Bot-utils');
 *
 * const files = recursiveReadDir('src/commands');
 * const commands = [];
 * files.forEach((file) => {
 * const { default: command } = await import(pathToFileURL(file).href);
 * commands.push(command.data.name, command);
 * });
 */
export function recursiveReadDir(
  dir: string,
  skipDirectories: string[] = [],
  allowedExtensions: string[] = [".js", ".ts"],
): string[] {
  const filePaths: string[] = [];
  const readCommands = (direct: string): void => {
    const files = readdirSync(join(process.cwd(), direct));
    files.forEach((file: string) => {
      const stat = lstatSync(join(process.cwd(), direct, file));
      if (stat.isDirectory() && !skipDirectories.includes(file)) {
        readCommands(join(direct, file));
      } else {
        const extension = extname(file);
        if (!allowedExtensions.includes(extension)) return;
        const filePath = join(process.cwd(), direct, file);
        filePaths.push(filePath);
      }
    });
  };
  readCommands(dir);
  return filePaths;
}
