"use client";

import { useEffect, useState } from "react";
import { UserRole } from "@homeschool/shared";
import { getSessionUser } from "@/lib/session";
import { getStudentGrades, getTeacherGrades, gradeTeacherPace } from "./pace-api";

export type PaceGradeStatus = "pending" | "graded";

export type PaceGradeRecord = {
  id: string;
  recordId?: string;
  studentId: string;
  subjectId: string;
  paceNumber: number;
  score?: number;
  feedback?: string;
  status: PaceGradeStatus;
  updatedAt?: string;
};

export type PaceGradeMap = Record<string, PaceGradeRecord>;

export function gradeKey(studentId: string, subjectId: string, paceNumber: number) {
  return `${studentId}:${subjectId}:${paceNumber}`;
}

export function usePaceGrades() {
  const [grades, setGrades] = useState<PaceGradeMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ignore = false;
    const user = getSessionUser();
    const request = user?.roles.includes(UserRole.STUDENT) ? getStudentGrades() : getTeacherGrades();

    request
      .then((records) => {
        if (ignore) return;
        setGrades(
          Object.fromEntries(
            records.map((record) => [
              gradeKey(record.student.profileId, record.subject.classSubjectId, record.pace.number),
              {
                id: record.grade?.id ?? record.id,
                recordId: record.id,
                studentId: record.student.profileId,
                subjectId: record.subject.classSubjectId,
                paceNumber: record.pace.number,
                score: record.grade?.score,
                feedback: record.grade?.feedback ?? undefined,
                status: record.grade ? "graded" : "pending",
                updatedAt: record.grade?.updatedAt
              } satisfies PaceGradeRecord
            ])
          )
        );
      })
      .catch(() => setGrades({}))
      .finally(() => {
        if (!ignore) setReady(true);
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function saveGrade(input: Omit<PaceGradeRecord, "id" | "status" | "updatedAt">) {
    if (!input.recordId) return;
    const updated = await gradeTeacherPace(input.recordId, {
      score: input.score ?? 0,
      feedback: input.feedback
    });
    const id = gradeKey(updated.student.profileId, updated.subject.classSubjectId, updated.pace.number);
    setGrades((current) => ({
      ...current,
      [id]: {
        id: updated.grade?.id ?? updated.id,
        recordId: updated.id,
        studentId: updated.student.profileId,
        subjectId: updated.subject.classSubjectId,
        paceNumber: updated.pace.number,
        score: updated.grade?.score,
        feedback: updated.grade?.feedback ?? undefined,
        status: updated.grade ? "graded" : "pending",
        updatedAt: updated.grade?.updatedAt
      }
    }));
  }

  return { grades, saveGrade, ready };
}
