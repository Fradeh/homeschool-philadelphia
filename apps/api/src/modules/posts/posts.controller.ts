import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Permission, UserRole } from "@homeschool/shared";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { CreatePostDto } from "./dto/create-post.dto";
import { PostsService } from "./posts.service";

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.MANAGE_ASSIGNED_CLASS_CONTENT)
  @Post()
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @Post(":postId/comments")
  comment(@Param("postId") postId: string, @Body() dto: CreateCommentDto) {
    return this.postsService.comment(postId, dto);
  }
}
