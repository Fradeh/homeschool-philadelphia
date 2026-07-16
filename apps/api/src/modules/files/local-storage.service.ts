import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { StorageService, type StoredFileInput } from "./storage.service";

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly root = join(process.cwd(), "uploads");

  async store(input: StoredFileInput): Promise<string> {
    await mkdir(this.root, { recursive: true });
    const safeName = input.originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `${randomUUID()}-${safeName}`;
    await writeFile(join(this.root, storageKey), input.buffer);
    return storageKey;
  }

  async read(storageKey: string): Promise<Buffer> {
    if (!storageKey || basename(storageKey) !== storageKey) {
      throw new Error("Invalid storage key");
    }
    return readFile(join(this.root, storageKey));
  }

  async deleteObject(storageKey: string): Promise<void> {
    if (!storageKey || basename(storageKey) !== storageKey) {
      throw new Error("Invalid storage key");
    }
    await rm(join(this.root, storageKey), { force: true });
  }
}
