import { randomUUID } from "node:crypto";
import { StorageService, type StoredFileInput } from "./storage.service";

type SupabaseStorageConfig = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

export class SupabaseStorageService implements StorageService {
  private readonly url: string;

  constructor(private readonly config: SupabaseStorageConfig) {
    this.url = config.url.replace(/\/+$/, "");
  }

  async store(input: StoredFileInput): Promise<string> {
    const safeName = input.originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `${randomUUID()}-${safeName}`;
    const response = await fetch(this.uploadUrl(storageKey), {
      method: "POST",
      headers: {
        ...this.authHeaders(),
        "Content-Type": input.mimeType || "application/octet-stream",
        "x-upsert": "false"
      },
      body: new Uint8Array(input.buffer)
    });
    if (!response.ok) await this.throwStorageError("guardar", response);
    return storageKey;
  }

  async read(storageKey: string): Promise<Buffer> {
    assertStorageKey(storageKey);
    const response = await fetch(this.downloadUrl(storageKey), {
      method: "GET",
      headers: this.authHeaders()
    });
    if (!response.ok) await this.throwStorageError("descargar", response);
    return Buffer.from(await response.arrayBuffer());
  }

  async deleteObject(storageKey: string): Promise<void> {
    assertStorageKey(storageKey);
    const response = await fetch(
      `${this.url}/storage/v1/object/${encodeURIComponent(this.config.bucket)}`,
      {
        method: "DELETE",
        headers: {
          ...this.authHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prefixes: [storageKey] })
      }
    );
    if (!response.ok && response.status !== 404) {
      await this.throwStorageError("eliminar", response);
    }
  }

  private uploadUrl(storageKey: string) {
    assertStorageKey(storageKey);
    return `${this.url}/storage/v1/object/${encodeURIComponent(this.config.bucket)}/${encodeURIComponent(storageKey)}`;
  }

  private downloadUrl(storageKey: string) {
    assertStorageKey(storageKey);
    return `${this.url}/storage/v1/object/authenticated/${encodeURIComponent(this.config.bucket)}/${encodeURIComponent(storageKey)}`;
  }

  private authHeaders() {
    return {
      apikey: this.config.serviceRoleKey,
      Authorization: `Bearer ${this.config.serviceRoleKey}`
    };
  }

  private async throwStorageError(operation: string, response: Response): Promise<never> {
    const responseBody = await response.text();
    let detail = responseBody;
    try {
      const parsed = JSON.parse(responseBody) as { message?: string; error?: string };
      detail = parsed.message ?? parsed.error ?? responseBody;
    } catch {
      // Keep the plain response returned by the provider.
    }
    throw new Error(
      `Supabase Storage no pudo ${operation} el archivo (${response.status})${detail ? `: ${detail}` : ""}`
    );
  }
}

function assertStorageKey(storageKey: string) {
  if (!storageKey || storageKey.includes("/") || storageKey.includes("\\")) {
    throw new Error("Invalid storage key");
  }
}
