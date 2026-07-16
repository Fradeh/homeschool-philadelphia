export type StoredFileInput = {
  originalName: string;
  mimeType?: string;
  buffer: Buffer;
};

export abstract class StorageService {
  abstract store(input: StoredFileInput): Promise<string>;
  abstract read(storageKey: string): Promise<Buffer>;
  abstract deleteObject(storageKey: string): Promise<void>;
}
