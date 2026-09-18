"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "hospital" | "insurance";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userName: string;
  userTitle: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("insurance"); // Default to insurance reviewer for demo

  const userName = role === "hospital" ? "CityCare Hospital" : "Dr. Sarah Mitchell";
  const userTitle = role === "hospital" ? "Hospital Administrator" : "Insurance Reviewer";

  return (
    <RoleContext.Provider value={{ role, setRole, userName, userTitle }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
}
