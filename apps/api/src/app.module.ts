import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./modules/admin/admin.module";
import { AcademicPacesModule } from "./modules/academic-paces/academic-paces.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CalendarModule } from "./modules/calendar/calendar.module";
import { ConversationsModule } from "./modules/conversations/conversations.module";
import { FilesModule } from "./modules/files/files.module";
import { GroupsModule } from "./modules/groups/groups.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PostsModule } from "./modules/posts/posts.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { RolesModule } from "./modules/roles/roles.module";
import { UsersModule } from "./modules/users/users.module";
import { SchedulesModule } from "./modules/schedules/schedules.module";
import { ClassroomModule } from "./modules/classroom/classroom.module";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { GcrModule } from "./modules/gcr/gcr.module";

function validateEnv(config: Record<string, string | undefined>) {
  const requiredKeys = ["DATABASE_URL", "JWT_SECRET", "WEB_ORIGIN", "NODE_ENV"];
  const missing = requiredKeys.filter((key) => !config[key]?.trim());

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    AuthModule,
    AcademicPacesModule,
    AdminModule,
    UsersModule,
    RolesModule,
    GroupsModule,
    PostsModule,
    FilesModule,
    CalendarModule,
    ConversationsModule,
    NotificationsModule,
    AuditModule,
    RealtimeModule,
    SchedulesModule,
    ClassroomModule,
    GcrModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
