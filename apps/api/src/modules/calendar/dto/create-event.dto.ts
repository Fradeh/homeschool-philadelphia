import { EventScope } from "@homeschool/shared";
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(EventScope)
  scope!: EventScope;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  groupId?: string;
}
