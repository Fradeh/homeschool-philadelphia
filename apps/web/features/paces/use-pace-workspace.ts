"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { PaceRecordSummary, UserRole } from "@homeschool/shared";
import { getSessionUser } from "@/lib/session";
import { getStudentPaces, getTeacherPaceWorkspace } from "./pace-api";
import type { PaceItem, PaceSubject, StudentPacePlan } from "./mock-pace-data";

export type PaceWorkspace = { subjects: PaceSubject[]; plans: StudentPacePlan[]; term: string; year: number };

const emptyWorkspace: PaceWorkspace = {
  subjects: [],
  plans: [],
  term: "1",
  year: new Date().getFullYear()
};

export function usePaceWorkspace(): {
  workspace: PaceWorkspace;
  setWorkspace: Dispatch<SetStateAction<PaceWorkspace>>;
  ready: boolean;
} {
  const [workspace, setWorkspace] = useState<PaceWorkspace>(emptyWorkspace);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ignore = false;
    const user = getSessionUser();
    const request = user?.roles.includes(UserRole.STUDENT)
      ? getStudentPaces().then((records) => ({ records }))
      : getTeacherPaceWorkspace();

    request
      .then((value) => {
        if (ignore) return;
        setWorkspace(fromRecords(value.records));
      })
      .catch(() => setWorkspace(emptyWorkspace))
      .finally(() => {
        if (!ignore) setReady(true);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { workspace, setWorkspace, ready };
}

function fromRecords(records: PaceRecordSummary[]): PaceWorkspace {
  const first = records[0];
  const subjectMap = new Map<string, PaceSubject>();
  const studentMap = new Map<string, StudentPacePlan>();

  records.forEach((record) => {
    subjectMap.set(record.subject.classSubjectId, {
      id: record.subject.classSubjectId,
      name: record.subject.name,
      shortName: record.subject.shortName,
      color: record.subject.color ?? "#191970",
      classId: record.class.id
    });

    const existing = studentMap.get(record.student.profileId) ?? {
      studentId: record.student.profileId,
      studentName: record.student.displayName,
      grade: record.student.gradeLevel ?? "Sin grado",
      targetPerSubject: record.subject.targetPaces,
      plans: {}
    };

    const items = existing.plans[record.subject.classSubjectId] ?? [];
    existing.plans[record.subject.classSubjectId] = [...items, toPaceItem(record)].sort((a, b) => a.number - b.number);
    studentMap.set(record.student.profileId, existing);
  });

  return {
    subjects: Array.from(subjectMap.values()),
    plans: Array.from(studentMap.values()),
    term: String(first?.academicTerm.order ?? 1),
    year: Number(first?.academicTerm.academicYearName.match(/\d{4}/)?.[0] ?? new Date().getFullYear())
  };
}

function toPaceItem(record: PaceRecordSummary): PaceItem {
  const status = record.status === "COMPLETED" ? "completed" : record.status === "CURRENT" ? "current" : "planned";
  return { number: record.pace.number, status };
}
