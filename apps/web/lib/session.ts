"use client";

import type { AuthUser, LoginResponse } from "@homeschool/shared";

const legacySessionKey = "homeschool-session";
let currentSession: AuthSession | null = null;
const listeners = new Set<(user: AuthUser | null) => void>();

export type AuthSession = LoginResponse;

export function saveSession(session: AuthSession) {
  currentSession = session;
  if (typeof window !== "undefined") {
    localStorage.removeItem(legacySessionKey);
    localStorage.removeItem("homeschool-session-user");
  }
  listeners.forEach((listener) => listener(session.user));
}

export function getSession(): AuthSession | null {
  return currentSession;
}

export function getSessionUser(): AuthUser | null {
  return getSession()?.user ?? null;
}

export function clearSession() {
  currentSession = null;
  listeners.forEach((listener) => listener(null));
  localStorage.removeItem(legacySessionKey);
  localStorage.removeItem("homeschool-session-user");
  void fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
}

export function subscribeSession(listener: (user: AuthUser | null) => void) {
  listeners.add(listener);
  listener(currentSession?.user ?? null);
  return () => { listeners.delete(listener); };
}
