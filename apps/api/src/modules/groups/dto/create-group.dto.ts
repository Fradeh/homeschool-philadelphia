import { GroupVisibility } from "@homeschool/shared";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateGroupDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(GroupVisibility)
  visibility?: GroupVisibility;
}
