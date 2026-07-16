import { ScheduleAudienceType, ScheduleBlockKind, Weekday, PhysicalBookingStatus } from "@homeschool/shared";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateGradeLevelDto {
  @IsString() @MinLength(1) @MaxLength(20) code!: string;
  @IsString() @MinLength(2) @MaxLength(80) name!: string;
  @IsInt() @Min(0) sortOrder!: number;
}

export class CreateScheduleTemplateDto {
  @IsString() academicYearId!: string;
  @IsEnum(ScheduleAudienceType) audienceType!: ScheduleAudienceType;
  @IsOptional() @IsString() classId?: string;
  @IsOptional() @IsString() teacherId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) classSubjectIds?: string[];
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
}

export class UpdateScheduleTemplateDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
}

export class ScheduleTemplateBlockDto {
  @IsString() periodId!: string;
  @IsEnum(Weekday) weekday!: Weekday;
  @IsEnum(ScheduleBlockKind) kind!: ScheduleBlockKind;
  @IsOptional() @IsString() @MaxLength(120) label?: string;
  @IsOptional() @IsString() classSubjectId?: string;
  @IsOptional() @IsString() teacherId?: string;
}

export class ReplaceScheduleBlocksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleTemplateBlockDto)
  blocks!: ScheduleTemplateBlockDto[];
}


export class ScheduleGridPeriodDto {
  @Matches(timePattern) startTime!: string;
  @Matches(timePattern) endTime!: string;
  @IsBoolean() suggestedBreak!: boolean;
}

export class ReplaceScheduleGridDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(24)
  @ValidateNested({ each: true }) @Type(() => ScheduleGridPeriodDto)
  periods!: ScheduleGridPeriodDto[];
}
export class AssignClassSubjectTeacherDto {
  @IsString() teacherProfileId!: string;
}

export class CreateAvailabilityDto {
  @IsString() classSubjectId!: string;
  @IsEnum(Weekday) weekday!: Weekday;
  @Matches(timePattern) startTime!: string;
  @Matches(timePattern) endTime!: string;
  @IsOptional() @IsString() @MaxLength(160) location?: string;
  @IsOptional() @IsString() @MaxLength(500) instructions?: string;
}

export class UpdateAvailabilityDto {
  @IsOptional() @IsEnum(Weekday) weekday?: Weekday;
  @IsOptional() @Matches(timePattern) startTime?: string;
  @IsOptional() @Matches(timePattern) endTime?: string;
  @IsOptional() @IsString() @MaxLength(160) location?: string;
  @IsOptional() @IsString() @MaxLength(500) instructions?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateBookingDto {
  @IsString() availabilitySlotId!: string;
  @IsDateString() scheduledDate!: string;
  @IsOptional() @IsString() @MaxLength(500) studentNote?: string;
}

export class UpdateBookingStatusDto {
  @IsEnum(PhysicalBookingStatus) status!: PhysicalBookingStatus;
  @IsOptional() @IsString() @MaxLength(500) teacherResponse?: string;
  @IsOptional() @IsString() availabilitySlotId?: string;
  @IsOptional() @IsDateString() scheduledDate?: string;
}
