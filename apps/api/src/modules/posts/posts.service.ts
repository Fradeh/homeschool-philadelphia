import { Injectable } from "@nestjs/common";
import { PostStatus as PrismaPostStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { CreatePostDto } from "./dto/create-post.dto";

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.post.findMany({
      include: { group: true, comments: true, attachments: true },
      orderBy: { createdAt: "desc" }
    });
  }

  create(dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        groupId: dto.groupId,
        status: dto.status as PrismaPostStatus | undefined
      }
    });
  }

  comment(postId: string, dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        postId,
        content: dto.content
      }
    });
  }
}
