import { PostStatus } from "@homeschool/shared";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(3)
  content!: string;

  @IsString()
  groupId!: string;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}
