import { GroupVisibility, PostStatus, UserRole } from "@homeschool/shared";

export const teacherUser = {
  id: "teacher-001",
  firstName: "Ana",
  lastName: "Garcia",
  email: "ana.garcia@philadelphia.edu",
  roles: [UserRole.TEACHER]
};

export const teacherGroups = [
  {
    id: "group-english-8",
    name: "English 8th Grade",
    code: "ENG-8",
    description: "Reading, writing and weekly communication for eighth grade.",
    visibility: GroupVisibility.PRIVATE,
    studentsCount: 24,
    postsCount: 8,
    filesCount: 16,
    nextEvent: "Essay workshop",
    nextEventDate: "Tomorrow, 9:00 AM",
    accent: "#191970"
  },
  {
    id: "group-homeroom-7",
    name: "Homeroom 7A",
    code: "HR-7A",
    description: "Announcements, reminders and family-facing updates.",
    visibility: GroupVisibility.PRIVATE,
    studentsCount: 21,
    postsCount: 12,
    filesCount: 9,
    nextEvent: "Parent update",
    nextEventDate: "Friday, 2:30 PM",
    accent: "#078cc5"
  },
  {
    id: "group-projects",
    name: "Research Projects",
    code: "RSP",
    description: "Shared space for interdisciplinary projects and resources.",
    visibility: GroupVisibility.PRIVATE,
    studentsCount: 18,
    postsCount: 5,
    filesCount: 22,
    nextEvent: "Team review",
    nextEventDate: "Jun 24, 10:00 AM",
    accent: "#2f3f8f"
  }
];

export const recentTeacherActivity = [
  {
    id: "activity-1",
    groupName: "English 8th Grade",
    action: "New comment on Vocabulary list",
    time: "12 min ago"
  },
  {
    id: "activity-2",
    groupName: "Homeroom 7A",
    action: "Two students viewed the latest announcement",
    time: "38 min ago"
  },
  {
    id: "activity-3",
    groupName: "Research Projects",
    action: "File uploaded: rubric-final.pdf",
    time: "1 h ago"
  }
];

export const draftPost = {
  groupId: teacherGroups[0].id,
  title: "",
  content: "",
  status: PostStatus.DRAFT,
  attachments: []
};
