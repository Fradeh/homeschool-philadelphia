import { AcademicStatus, ParentRelationship, UserRole } from "@homeschool/shared";
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

export class CreateAdminUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  studentCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  employeeCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  gradeLevelId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  parentPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  directorTitle?: string;
}

export class CreateAdminClassDto {
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @IsOptional()
  @IsString()
  gradeLevelId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  color?: string;
}

export class AssignClassTeacherDto {
  @IsString()
  teacherProfileId!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class EnrollClassStudentDto {
  @IsString()
  studentProfileId!: string;
}

export class CreateAdminSubjectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(24)
  shortName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  color?: string;

  @IsOptional()
  @IsBoolean()
  paceEnabled?: boolean;
}

export class UpdateAdminSubjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(24)
  shortName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  color?: string;

  @IsOptional()
  @IsEnum(AcademicStatus)
  status?: AcademicStatus;

  @IsOptional()
  @IsBoolean()
  paceEnabled?: boolean;
}

export class AssignClassSubjectDto {
  @IsString()
  subjectId!: string;
}

export class UpsertFamilyLinkDto {
  @IsString()
  studentProfileId!: string;

  @IsString()
  parentProfileId!: string;

  @IsEnum(ParentRelationship)
  relationship!: ParentRelationship;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  receivesAcademicEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  receivesBehaviorEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  receivesBillingEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  canViewGrades?: boolean;

  @IsOptional()
  @IsBoolean()
  canMessageTeachers?: boolean;
}

export class UpdateFamilyLinkDto {
  @IsOptional()
  @IsEnum(ParentRelationship)
  relationship?: ParentRelationship;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  receivesAcademicEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  receivesBehaviorEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  receivesBillingEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  canViewGrades?: boolean;

  @IsOptional()
  @IsBoolean()
  canMessageTeachers?: boolean;
}

export class CreateAcademicYearDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateAcademicTermDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsInt()
  @Min(1)
  order!: number;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
