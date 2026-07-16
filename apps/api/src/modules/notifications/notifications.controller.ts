import { Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { AuthUser } from "@homeschool/shared";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";

@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.notificationsService.findMine(user.id);
  }

  @Patch(":notificationId/read")
  markRead(@CurrentUser() user: AuthUser, @Param("notificationId") id: string) {
    return this.notificationsService.markRead(user.id, id);
  }
}
