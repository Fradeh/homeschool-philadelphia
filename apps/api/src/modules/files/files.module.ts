import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FilesController } from "./files.controller";
import { LocalStorageService } from "./local-storage.service";
import { StorageService } from "./storage.service";
import { SupabaseStorageService } from "./supabase-storage.service";

const storageProvider = {
  provide: StorageService,
  inject: [ConfigService],
  useFactory: (config: ConfigService): StorageService => {
    const driver = config.get<string>("STORAGE_DRIVER", "local").trim().toLowerCase();
    if (driver === "local") return new LocalStorageService();
    if (driver !== "supabase") {
      throw new Error('STORAGE_DRIVER must be either "local" or "supabase"');
    }

    const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET"] as const;
    const missing = required.filter((key) => !config.get<string>(key)?.trim());
    if (missing.length) {
      throw new Error(`Supabase Storage configuration is incomplete. Missing: ${missing.join(", ")}`);
    }

    return new SupabaseStorageService({
      url: config.getOrThrow<string>("SUPABASE_URL"),
      serviceRoleKey: config.getOrThrow<string>("SUPABASE_SERVICE_ROLE_KEY"),
      bucket: config.getOrThrow<string>("SUPABASE_STORAGE_BUCKET")
    });
  }
};

@Module({
  controllers: [FilesController],
  providers: [storageProvider],
  exports: [StorageService]
})
export class FilesModule {}
