import { FileEntry } from "@zip.js/zip.js";
import { LevelKeyValue } from "./types.js";
/**
 * Extracts all LevelDB keys from a zipped `.mcworld` file.
 * (Browser & Node compatible)
 */
export declare function readMcworld(mcworld: Blob): Promise<Record<string, LevelKeyValue>>;
/**
 * Converts a zip.js Entry into a File object.
 */
export declare function zipEntryToFile(entry: FileEntry): Promise<File>;
export declare function zipEntryBasename(entry: FileEntry): string;
export declare function zipEntryDirname(entry: FileEntry): string;
/**
 * Core LevelDB reader.
 * Accepts LevelDB files as File[] (zip OR folder).
 */
export declare function readLevelDb(dbFiles: Array<File>): Promise<Record<string, LevelKeyValue>>;
/**
 * Reads LevelDB directly from a `db/` folder (Node.js only).
 */
export declare function readLevelDbFromFolder(dbDir: string): Promise<Record<string, LevelKeyValue>>;
/**
 * Reads a full Bedrock world folder (expects `db/`).
 */
export declare function readWorldFolder(worldDir: string): Promise<Record<string, LevelKeyValue>>;
