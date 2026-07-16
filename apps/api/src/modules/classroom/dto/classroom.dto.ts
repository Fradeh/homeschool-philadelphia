import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength
} from "class-validator";
import { ClassAssignmentStatus } from "@homeschool/shared";
import { Transform } from "class-transformer";

export class CreateWallPostDto {
  @IsString() @MinLength(2) @MaxLength(160) title!: string;
  @IsString() @MinLength(1) @MaxLength(5000) content!: string;
}

export class CreateWallCommentDto {
  @IsString() @MinLength(1) @MaxLength(2000) content!: string;
}

export class CreateClassAssignmentDto {
  @IsString() @MinLength(2) @MaxLength(180) title!: string;
  @IsString() @MinLength(1) @MaxLength(10000) description!: string;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(0) @Max(10000) points?: number;
  @IsOptional() @IsString() @MaxLength(80) submissionType?: string;
  @IsOptional() @IsEnum(ClassAssignmentStatus) status?: ClassAssignmentStatus;
}

export class CreateClassMaterialDto {
  @IsString() @MinLength(1) @MaxLength(220) name!: string;
  @IsOptional() @IsUrl() externalUrl?: string;
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  visibleToStudents?: boolean;
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  isImportant?: boolean;
}

export class SubmitAssignmentDto {
  @IsOptional() @IsString() @MaxLength(15000) body?: string;
}

export class GradeClassSubmissionDto {
  @IsNumber() @Min(0) @Max(10000) score!: number;
  @IsOptional() @IsString() @MaxLength(5000) feedback?: string;
}
