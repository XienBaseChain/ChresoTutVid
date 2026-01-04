
export enum Role {
  STAFF = 'STAFF',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export interface UniversityUser {
  id: string;
  idNumber: string;
  role: Role;
  name: string;
  isActive: boolean;
  email?: string; // For Admins
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  portalLink: string;
  elearningLink: string;
  targetRole: Role.STAFF | Role.STUDENT;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userRole: Role;
  timestamp: string;
  details: string;
}

export interface AuthState {
  user: UniversityUser | null;
  role: Role | null;
  isAuthenticated: boolean;
}
