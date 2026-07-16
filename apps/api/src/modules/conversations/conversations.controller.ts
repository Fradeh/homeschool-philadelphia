import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuthUser, Permission, UserRole } from "@homeschool/shared";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ConversationsService } from "./conversations.service";
import { CloseConversationDto, ConversationMessagesQueryDto, CreateConversationDto, EscalateConversationDto, SendConversationMessageDto, UpdateConversationMessageDto } from "./dto/conversations.dto";

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT, UserRole.ADMINISTRATIVE, UserRole.DIRECTOR, UserRole.ADMIN)
@Controller("conversations")
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @Permissions(Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS)
  list(@CurrentUser() user: AuthUser) {
    return this.conversationsService.list(user);
  }

  @Get("contacts")
  @Permissions(Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS)
  contacts(@CurrentUser() user: AuthUser) {
    return this.conversationsService.contacts(user);
  }

  @Get(":conversationId/messages")
  @Permissions(Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS)
  messages(
    @CurrentUser() user: AuthUser,
    @Param("conversationId") conversationId: string,
    @Query() query: ConversationMessagesQueryDto
  ) {
    return this.conversationsService.messages(user, conversationId, query);
  }

  @Post()
  @Permissions(Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateConversationDto) {
    return this.conversationsService.create(user, dto);
  }

  @Post(":conversationId/messages")
  @Permissions(Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS)
  sendMessage(
    @CurrentUser() user: AuthUser,
    @Param("conversationId") conversationId: string,
    @Body() dto: SendConversationMessageDto
  ) {
    return this.conversationsService.sendMessage(user, conversationId, dto);
  }

  @Patch(":conversationId/messages/:messageId")
  @Permissions(Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS)
  updateMessage(@CurrentUser() user: AuthUser, @Param("conversationId") conversationId: string, @Param("messageId") messageId: string, @Body() dto: UpdateConversationMessageDto) {
    return this.conversationsService.updateMessage(user, conversationId, messageId, dto);
  }

  @Delete(":conversationId")
  @Permissions(Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS)
  remove(@CurrentUser() user: AuthUser, @Param("conversationId") conversationId: string) {
    return this.conversationsService.remove(user, conversationId);
  }

  @Post(":conversationId/escalate")
  @Permissions(Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS)
  escalate(
    @CurrentUser() user: AuthUser,
    @Param("conversationId") conversationId: string,
    @Body() dto: EscalateConversationDto
  ) {
    return this.conversationsService.escalate(user, conversationId, dto);
  }

  @Patch(":conversationId/close")
  @Permissions(Permission.JOIN_ESCALATED_CONVERSATIONS)
  close(
    @CurrentUser() user: AuthUser,
    @Param("conversationId") conversationId: string,
    @Body() dto: CloseConversationDto
  ) {
    return this.conversationsService.close(user, conversationId, dto);
  }
}
