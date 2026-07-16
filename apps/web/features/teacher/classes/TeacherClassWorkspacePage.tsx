"use client";

import { useEffect, useState } from "react";
import { ClassAssignmentStatus, type ClassroomWorkspace } from "@homeschool/shared";
import { classroomApi } from "@/features/classroom/classroom-api";
import { ClassroomWall } from "@/features/classroom/ClassroomWall";
import { workspaceToTeacherClass } from "@/features/classroom/workspace-mappers";
import { ClassDetailPage, type ClassTab } from "./ClassDetailPage";
import type { CreateWallPostForm } from "./ClassWall";
import type { CreateAssignmentForm } from "./CreateAssignmentModal";
import type { UploadContentForm } from "./UploadContentModal";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton, SkeletonGroup } from "@/components/feedback/skeleton";
import { Button } from "@/components/ui/button";

export function TeacherClassWorkspacePage({
  classId,
  initialTab
}: {
  classId: string;
  initialTab?: ClassTab;
}) {
  const [workspace, setWorkspace] = useState<ClassroomWorkspace | null>(null);
  const [message, setMessage] = useState("Cargando el espacio de clase…");
  useEffect(() => {
    classroomApi
      .workspace(classId)
      .then((next) => {
        setWorkspace(next);
        setMessage("");
      })
      .catch(() => setMessage("La clase no existe o no está asignada a tu cuenta."));
  }, [classId]);
  if (!workspace && message.startsWith("Cargando"))
    return (
      <SkeletonGroup label="Cargando detalle de clase">
        <div className="space-y-5 p-5 lg:p-6">
          <Skeleton className="h-20 w-full" rounded="lg" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-72 w-full" rounded="lg" />
        </div>
      </SkeletonGroup>
    );
  if (!workspace)
    return (
      <div className="p-5 lg:p-8">
        <ErrorState
          description={message}
          action={
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Intentar de nuevo
            </Button>
          }
        />
      </div>
    );
  const item = workspaceToTeacherClass(workspace);
  const persistence = {
    createWall: async (form: CreateWallPostForm) => {
      const next = await classroomApi.post(classId, { title: form.title, content: form.message });
      setWorkspace(next);
      return workspaceToTeacherClass(next);
    },
    createAssignment: async (form: CreateAssignmentForm) => {
      const next = await classroomApi.assignment(
        classId,
        {
          title: form.title,
          description: form.description,
          dueAt: form.dueDate
            ? new Date(`${form.dueDate}T${form.dueTime || "23:59"}:00`).toISOString()
            : undefined,
          points: form.points,
          submissionType: form.submissionType,
          status:
            form.status === "Publicada"
              ? ClassAssignmentStatus.PUBLISHED
              : ClassAssignmentStatus.DRAFT
        },
        form.files
      );
      setWorkspace(next);
      return workspaceToTeacherClass(next);
    },
    uploadContent: async (form: UploadContentForm) => {
      const data = new FormData();
      data.set("name", form.name);
      data.set("visibleToStudents", "true");
      if (form.file) data.set("file", form.file);
      if (form.url) data.set("externalUrl", form.url);
      const next = await classroomApi.material(classId, data);
      setWorkspace(next);
      return workspaceToTeacherClass(next);
    }
  };
  return (
    <ClassDetailPage
      teacherClass={item}
      initialTab={initialTab}
      persistence={persistence}
      wallContent={<ClassroomWall workspace={workspace} onChange={setWorkspace} canPost />}
    />
  );
}
