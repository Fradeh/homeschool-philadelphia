import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  Matches,
  ValidateNested
} from "class-validator";
import { GcrAttendanceStatus, GcrTaskCompletionStatus } from "@prisma/client";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class GcrDateQueryDto {
  @Matches(DATE_ONLY_PATTERN, { message: "date must use YYYY-MM-DD" })
  date!: string;
}

export class GcrStudentsQueryDto extends GcrDateQueryDto {}

export class GcrWeekQueryDto extends GcrStudentsQueryDto {}

export class GcrAttendanceSessionQueryDto extends GcrDateQueryDto {
  @IsUUID()
  classId!: string;
}

export class CreateGcrReportDto {
  @IsUUID()
  studentId!: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @Matches(DATE_ONLY_PATTERN, { message: "reportDate must use YYYY-MM-DD" })
  reportDate!: string;
}

class PostCloseReasonDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  postCloseReason?: string;
}

export class UpdateGcrReportDto extends PostCloseReasonDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  generalComment?: string | null;
}

export class UpsertGcrAttendanceDto extends PostCloseReasonDto {
  @IsEnum(GcrAttendanceStatus)
  status!: GcrAttendanceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string | null;
}

export class UpsertGcrSubjectTaskDto extends PostCloseReasonDto {
  @IsBoolean()
  homeworkAssigned!: boolean;

  @IsOptional()
  @IsEnum(GcrTaskCompletionStatus)
  completionStatus?: GcrTaskCompletionStatus | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string | null;
}

export class UpsertGcrVerseDto extends PostCloseReasonDto {
  @IsInt()
  @Min(1)
  @Max(3)
  slot!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reference!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  text?: string | null;

  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;

  @IsOptional()
  @IsUUID()
  classSubjectId?: string | null;
}

export class CreateGcrMeritDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  comment!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  benefit?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  occurredAt?: string;
}

export class CreateGcrDemeritItemDto {
  @IsInt()
  @Min(1)
  @Max(3)
  ordinal!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  comment!: string;
}

export class CreateGcrDemeritsDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ArrayUnique((item: CreateGcrDemeritItemDto) => item.ordinal)
  @ValidateNested({ each: true })
  @Type(() => CreateGcrDemeritItemDto)
  demerits!: CreateGcrDemeritItemDto[];

  @IsOptional()
  @IsISO8601({ strict: true })
  occurredAt?: string;
}

export class SubmitGcrReportDto {
  @IsInt()
  @Min(1)
  version!: number;
}

class SaveGcrDraftAttendanceDto {
  @IsEnum(GcrAttendanceStatus)
  status!: GcrAttendanceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string | null;
}

class SaveGcrDraftTaskDto {
  @IsUUID()
  classSubjectId!: string;

  @IsBoolean()
  homeworkAssigned!: boolean;

  @IsOptional()
  @IsEnum(GcrTaskCompletionStatus)
  completionStatus?: GcrTaskCompletionStatus | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string | null;
}

class SaveGcrDraftVerseDto {
  @IsInt()
  @Min(1)
  @Max(3)
  slot!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reference!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  text?: string | null;

  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;
}

export class SaveGcrDraftDto extends PostCloseReasonDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  generalComment?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => SaveGcrDraftAttendanceDto)
  attendance?: SaveGcrDraftAttendanceDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ArrayUnique((item: SaveGcrDraftTaskDto) => item.classSubjectId)
  @ValidateNested({ each: true })
  @Type(() => SaveGcrDraftTaskDto)
  subjectTasks?: SaveGcrDraftTaskDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SaveGcrDraftVerseDto)
  verse?: SaveGcrDraftVerseDto;
}
