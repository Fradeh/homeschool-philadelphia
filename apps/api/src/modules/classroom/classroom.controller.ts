import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { AuthUser, UserRole } from "@homeschool/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ClassroomService } from "./classroom.service";
import {
  CreateClassAssignmentDto,
  CreateClassMaterialDto,
  CreateWallCommentDto,
  CreateWallPostDto,
  GradeClassSubmissionDto,
  SubmitAssignmentDto
} from "./dto/classroom.dto";

type Upload = { originalname: string; mimetype: string; size: number; buffer: Buffer };

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("classroom")
export class ClassroomController {
  constructor(private readonly classroom: ClassroomService) {}

  @Get("teacher/classes") @Roles(UserRole.TEACHER) teacherClasses(@CurrentUser() user: AuthUser) {
    return this.classroom.teacherClassSummaries(user);
  }
  @Get("student/classes") @Roles(UserRole.STUDENT) studentClasses(@CurrentUser() user: AuthUser) {
    return this.classroom.studentClassSummaries(user);
  }
  @Get("classes/:classId") @Roles(UserRole.TEACHER, UserRole.STUDENT, UserRole.ADMIN) workspace(
    @CurrentUser() user: AuthUser,
    @Param("classId") id: string
  ) {
    return this.classroom.workspace(user, id);
  }
  @Post("classes/:classId/wall") @Roles(UserRole.TEACHER) wall(
    @CurrentUser() user: AuthUser,
    @Param("classId") id: string,
    @Body() dto: CreateWallPostDto
  ) {
    return this.classroom.createWallPost(user, id, dto);
  }
  @Post("wall/:postId/comments") @Roles(UserRole.TEACHER, UserRole.STUDENT, UserRole.ADMIN) comment(
    @CurrentUser() user: AuthUser,
    @Param("postId") id: string,
    @Body() dto: CreateWallCommentDto
  ) {
    return this.classroom.comment(user, id, dto);
  }
  @Post("classes/:classId/assignments")
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor("files", 5, { limits: { fileSize: 25 * 1024 * 1024 } }))
  assignment(
    @CurrentUser() user: AuthUser,
    @Param("classId") id: string,
    @Body() dto: CreateClassAssignmentDto,
    @UploadedFiles() files?: Upload[]
  ) {
    return this.classroom.createAssignment(user, id, dto, files ?? []);
  }
  @Post("classes/:classId/materials")
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 25 * 1024 * 1024 } }))
  material(
    @CurrentUser() user: AuthUser,
    @Param("classId") id: string,
    @Body() dto: CreateClassMaterialDto,
    @UploadedFile() file?: Upload
  ) {
    return this.classroom.createMaterial(user, id, dto, file);
  }
  @Post("assignments/:assignmentId/submission")
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FilesInterceptor("files", 5, { limits: { fileSize: 25 * 1024 * 1024 } }))
  submit(
    @CurrentUser() user: AuthUser,
    @Param("assignmentId") id: string,
    @Body() dto: SubmitAssignmentDto,
    @UploadedFiles() files?: Upload[]
  ) {
    return this.classroom.submit(user, id, dto, files ?? []);
  }
  @Get("assignments/:assignmentId/submissions")
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  submissions(@CurrentUser() user: AuthUser, @Param("assignmentId") id: string) {
    return this.classroom.assignmentSubmissions(user, id);
  }
  @Patch("submissions/:submissionId/grade")
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  gradeSubmission(
    @CurrentUser() user: AuthUser,
    @Param("submissionId") id: string,
    @Body() dto: GradeClassSubmissionDto
  ) {
    return this.classroom.gradeSubmission(user, id, dto);
  }
  @Get("submissions/:submissionId/download")
  @Roles(UserRole.TEACHER, UserRole.STUDENT, UserRole.ADMIN)
  async downloadSubmission(
    @CurrentUser() user: AuthUser,
    @Param("submissionId") id: string,
    @Res({ passthrough: true }) response: Response
  ) {
    const file = await this.classroom.submissionFile(user, id);
    response.setHeader("Content-Type", file.mimeType);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`
    );
    return new StreamableFile(file.data);
  }
  @Get("submission-attachments/:attachmentId/download")
  @Roles(UserRole.TEACHER, UserRole.STUDENT, UserRole.ADMIN)
  async downloadSubmissionAttachment(
    @CurrentUser() user: AuthUser,
    @Param("attachmentId") id: string,
    @Res({ passthrough: true }) response: Response
  ) {
    const file = await this.classroom.submissionAttachmentFile(user, id);
    response.setHeader("Content-Type", file.mimeType);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`
    );
    return new StreamableFile(file.data);
  }
  @Get("assignment-attachments/:attachmentId/download")
  @Roles(UserRole.TEACHER, UserRole.STUDENT, UserRole.ADMIN)
  async downloadAssignmentAttachment(
    @CurrentUser() user: AuthUser,
    @Param("attachmentId") id: string,
    @Res({ passthrough: true }) response: Response
  ) {
    const file = await this.classroom.assignmentAttachmentFile(user, id);
    response.setHeader("Content-Type", file.mimeType);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`
    );
    return new StreamableFile(file.data);
  }
  @Delete("submissions/:submissionId")
  @Roles(UserRole.STUDENT)
  removeOwnSubmission(@CurrentUser() user: AuthUser, @Param("submissionId") id: string) {
    return this.classroom.deleteOwnSubmission(user, id);
  }
  @Delete("submission-attachments/:attachmentId")
  @Roles(UserRole.STUDENT)
  removeOwnSubmissionAttachment(@CurrentUser() user: AuthUser, @Param("attachmentId") id: string) {
    return this.classroom.deleteOwnSubmissionAttachment(user, id);
  }
  @Get("materials/:materialId/download")
  @Roles(UserRole.TEACHER, UserRole.STUDENT, UserRole.ADMIN)
  async download(
    @CurrentUser() user: AuthUser,
    @Param("materialId") id: string,
    @Res({ passthrough: true }) response: Response
  ) {
    const file = await this.classroom.materialFile(user, id);
    response.setHeader("Content-Type", file.mimeType);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`
    );
    return new StreamableFile(file.data);
  }

  @Delete("materials/:materialId")
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  removeMaterial(@CurrentUser() user: AuthUser, @Param("materialId") id: string) {
    return this.classroom.deleteMaterial(user, id);
  }
}
