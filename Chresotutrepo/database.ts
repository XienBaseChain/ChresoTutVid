
import { Role, UniversityUser, Tutorial, AuditLog } from './types';

// Initial Mock Data
const MOCK_USERS: UniversityUser[] = [
  { id: 'u1', idNumber: 'STF001', role: Role.STAFF, name: 'Dr. John Phiri', isActive: true },
  { id: 'u2', idNumber: 'STF002', role: Role.STAFF, name: 'Prof. Mary Banda', isActive: true },
  { id: 'u3', idNumber: 'CU411', role: Role.STAFF, name: 'Charoy Chilu', isActive: true },
  { id: 's1', idNumber: 'STD001', role: Role.STUDENT, name: 'Alice Zulu', isActive: true },
  { id: 's2', idNumber: 'STD002', role: Role.STUDENT, name: 'Bob Mwale', isActive: true },
  { id: 's3', idNumber: '2501010502', role: Role.STUDENT, name: 'Steven Malu', isActive: true },
];

const MOCK_ADMINS: UniversityUser[] = [
  { id: 'a1', idNumber: 'ADM001', role: Role.ADMIN, name: 'System Admin', isActive: true, email: 'admin@chresouniversity.edu.zm' },
];

const MOCK_TUTORIALS: Tutorial[] = [
  {
    id: 't1',
    title: 'Staff Portal: Grade Submission',
    description: 'A step-by-step guide on how to submit semester grades through the Staff Portal.',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    portalLink: 'https://staff.chresouniversity.edu.zm',
    elearningLink: 'https://elearning.chresouniversity.edu.zm/staff',
    targetRole: Role.STAFF,
    createdAt: new Date().toISOString()
  },
  {
    id: 't2',
    title: 'Student E-Learning: Accessing Course Materials',
    description: 'Learn how to find your modules and download reading materials.',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    portalLink: 'https://student.chresouniversity.edu.zm',
    elearningLink: 'https://elearning.chresouniversity.edu.zm/student',
    targetRole: Role.STUDENT,
    createdAt: new Date().toISOString()
  }
];

// Database Persistence Simulation
class UniversityDB {
  private users: UniversityUser[] = [...MOCK_USERS];
  private admins: UniversityUser[] = [...MOCK_ADMINS];
  private tutorials: Tutorial[] = [...MOCK_TUTORIALS];
  private logs: AuditLog[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private saveToStorage() {
    localStorage.setItem('chreso_db_users', JSON.stringify(this.users));
    localStorage.setItem('chreso_db_admins', JSON.stringify(this.admins));
    localStorage.setItem('chreso_db_tutorials', JSON.stringify(this.tutorials));
    localStorage.setItem('chreso_db_logs', JSON.stringify(this.logs));
  }

  private loadFromStorage() {
    const u = localStorage.getItem('chreso_db_users');
    const a = localStorage.getItem('chreso_db_admins');
    const t = localStorage.getItem('chreso_db_tutorials');
    const l = localStorage.getItem('chreso_db_logs');
    if (u) this.users = JSON.parse(u);
    if (a) this.admins = JSON.parse(a);
    if (t) this.tutorials = JSON.parse(t);
    if (l) this.logs = JSON.parse(l);
  }

  // Auth Methods
  verifyUser(idNumber: string, role: Role.STAFF | Role.STUDENT): UniversityUser | null {
    const user = this.users.find(u => u.idNumber === idNumber && u.role === role);
    this.addLog(user?.id || 'unknown', role, 'LOGIN_ATTEMPT', `ID: ${idNumber}, Success: ${!!user}`);
    return user || null;
  }

  verifyAdmin(email: string): UniversityUser | null {
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail.endsWith('@chresouniversity.edu.zm')) {
      this.addLog('unknown', Role.ADMIN, 'ADMIN_LOGIN_FAIL', `Invalid domain or empty email: ${normalizedEmail}`);
      return null;
    }
    const admin = this.admins.find(a => a.email && a.email.toLowerCase() === normalizedEmail);
    this.addLog(admin?.id || 'unknown', Role.ADMIN, 'ADMIN_LOGIN', `Email: ${normalizedEmail}, Success: ${!!admin}`);
    return admin || null;
  }

  // Content Methods (RLS-like filtering)
  getTutorials(role: Role): Tutorial[] {
    if (role === Role.ADMIN) return this.tutorials;
    return this.tutorials.filter(t => t.targetRole === role);
  }

  addTutorial(tutorial: Omit<Tutorial, 'id' | 'createdAt'>, adminId: string) {
    const newTutorial: Tutorial = {
      ...tutorial,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    this.tutorials.push(newTutorial);
    this.addLog(adminId, Role.ADMIN, 'CREATE_TUTORIAL', `Added: ${newTutorial.title}`);
    this.saveToStorage();
    return newTutorial;
  }

  updateTutorial(id: string, updates: Partial<Tutorial>, adminId: string) {
    const index = this.tutorials.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tutorials[index] = { ...this.tutorials[index], ...updates };
      this.addLog(adminId, Role.ADMIN, 'UPDATE_TUTORIAL', `Updated tutorial ID: ${id}`);
      this.saveToStorage();
    }
  }

  deleteTutorial(id: string, adminId: string) {
    this.tutorials = this.tutorials.filter(t => t.id !== id);
    this.addLog(adminId, Role.ADMIN, 'DELETE_TUTORIAL', `Deleted tutorial ID: ${id}`);
    this.saveToStorage();
  }

  // Admin ID Management
  getUsersByType(role: Role.STAFF | Role.STUDENT): UniversityUser[] {
    return this.users.filter(u => u.role === role);
  }

  addUser(user: Omit<UniversityUser, 'id'>, adminId: string) {
    const newUser = { ...user, id: Math.random().toString(36).substr(2, 9) };
    this.users.push(newUser);
    this.addLog(adminId, Role.ADMIN, 'ADD_USER_ID', `Added ${user.role}: ${user.idNumber}`);
    this.saveToStorage();
  }

  deleteUser(idNumber: string, adminId: string) {
    this.users = this.users.filter(u => u.idNumber !== idNumber);
    this.addLog(adminId, Role.ADMIN, 'DELETE_USER_ID', `Removed ID: ${idNumber}`);
    this.saveToStorage();
  }

  // Logging
  addLog(userId: string, userRole: Role, action: string, details: string) {
    const log: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      userRole,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.logs.unshift(log);
    // Cleanup old logs (simulate 1 month auto-delete)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    this.logs = this.logs.filter(l => new Date(l.timestamp) > oneMonthAgo);
    this.saveToStorage();
  }

  getLogs(): AuditLog[] {
    return this.logs;
  }
}

export const db = new UniversityDB();
