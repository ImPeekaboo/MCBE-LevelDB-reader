import LevelDb from "./LevelDb.js";
import { BlobReader, ZipReader, Uint8ArrayWriter } from "@zip.js/zip.js";
import fs from "fs";
import path from "path";
/**
 * Extracts all LevelDB keys from a zipped `.mcworld` file.
 * (Browser & Node compatible)
 */
export async function readMcworld(mcworld) {
    const folder = new ZipReader(new BlobReader(mcworld));
    const fileEntries = (await folder.getEntries());
    folder.close();
    const currentEntry = fileEntries.find(entry => zipEntryBasename(entry) === "CURRENT");
    if (!currentEntry) {
        throw new Error("Cannot find LevelDB files in mcworld!");
    }
    const dbRootPath = zipEntryDirname(currentEntry);
    const dbEntries = fileEntries.filter(entry => !entry.directory && entry.filename.startsWith(dbRootPath));
    const dbFiles = await Promise.all(dbEntries.map(zipEntryToFile));
    return await readLevelDb(dbFiles);
}
/**
 * Converts a zip.js Entry into a File object.
 */
export async function zipEntryToFile(entry) {
    return new File([await entry.getData(new Uint8ArrayWriter())], zipEntryBasename(entry));
}
export function zipEntryBasename(entry) {
    return entry.filename.slice(entry.filename.lastIndexOf("/") + 1);
}
export function zipEntryDirname(entry) {
    return entry.filename.includes("/")
        ? entry.filename.slice(0, entry.filename.lastIndexOf("/") + 1)
        : "";
}
/**
 * Core LevelDB reader.
 * Accepts LevelDB files as File[] (zip OR folder).
 */
export async function readLevelDb(dbFiles) {
    const files = await Promise.all(dbFiles.map(async (file) => ({
        content: new Uint8Array(await file.arrayBuffer()),
        loadContent: () => new Date(),
        name: file.name,
        storageRelativePath: file.name,
        fullPath: file.name
    })));
    const ldbFiles = [];
    const logFiles = [];
    const manifestFiles = [];
    for (const file of files) {
        if (file.name.startsWith("MANIFEST")) {
            manifestFiles.push(file);
        }
        else if (file.name.endsWith(".ldb")) {
            ldbFiles.push(file);
        }
        else if (file.name.endsWith(".log")) {
            logFiles.push(file);
        }
    }
    const levelDb = new LevelDb(ldbFiles, logFiles, manifestFiles, "MCBEStructureReader");
    await levelDb.init(msg => {
        console.debug(`LevelDB: ${msg}`);
    });
    return levelDb.keys;
}
/**
 * Reads LevelDB directly from a `db/` folder (Node.js only).
 */
export async function readLevelDbFromFolder(dbDir) {
    if (!fs.existsSync(dbDir)) {
        throw new Error(`LevelDB folder not found: ${dbDir}`);
    }
    const files = fs.readdirSync(dbDir);
    const dbFiles = [];
    for (const fileName of files) {
        if (fileName.startsWith("MANIFEST") ||
            fileName.endsWith(".ldb") ||
            fileName.endsWith(".log")) {
            const fullPath = path.join(dbDir, fileName);
            const buffer = await fs.promises.readFile(fullPath);
            dbFiles.push(new File([buffer], fileName));
        }
    }
    if (dbFiles.length === 0) {
        throw new Error("No LevelDB files found in folder");
    }
    return await readLevelDb(dbFiles);
}
/**
 * Reads a full Bedrock world folder (expects `db/`).
 */
export async function readWorldFolder(worldDir) {
    const dbPath = path.join(worldDir, "db");
    return await readLevelDbFromFolder(dbPath);
}
//# sourceMappingURL=main.js.map