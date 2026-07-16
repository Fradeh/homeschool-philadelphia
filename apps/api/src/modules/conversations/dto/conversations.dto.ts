import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class ConversationMessagesQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 30;
}

export class CreateConversationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  subject!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsString()
  studentProfileId?: string;

  @IsOptional()
  @IsString()
  parentProfileId?: string;

  @IsOptional()
  @IsString()
  teacherProfileId?: string;
}

export class SendConversationMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}

export class UpdateConversationMessageDto extends SendConversationMessageDto {}

export class EscalateConversationDto {
  @IsOptional()
  @IsString()
  directorProfileId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;
}

export class CloseConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;
}
