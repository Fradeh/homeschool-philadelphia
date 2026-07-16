import { PaceGradeStatus, PaceProgressStatus } from "@homeschool/shared";
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";

export class SetStudentPaceGoalDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  classSubjectId!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  targetPaces!: number;

  @IsInt()
  @Min(1)
  @Max(9999)
  startingPaceNumber!: number;
}

export class UpdatePaceStatusDto {
  @IsEnum(PaceProgressStatus)
  status!: PaceProgressStatus;
}

export class GradePaceDto {
  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  feedback?: string;
}

export class UpdatePaceGradeDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  feedback?: string;

  @IsOptional()
  @IsEnum(PaceGradeStatus)
  status?: PaceGradeStatus;
}
