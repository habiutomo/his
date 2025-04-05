import {
  users, patients, appointments, medicalRecords, prescriptions,
  departments, tasks, activityLogs,
  type User, type Patient, type Appointment, type MedicalRecord,
  type Prescription, type Department, type Task, type ActivityLog,
  type InsertUser, type InsertPatient, type InsertAppointment,
  type InsertMedicalRecord, type InsertPrescription, type InsertDepartment,
  type InsertTask, type InsertActivityLog
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Patient operations
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  
  // Appointment operations
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  getAppointmentsByPatientId(patientId: number): Promise<Appointment[]>;
  getAppointmentsByDoctorId(doctorId: number): Promise<Appointment[]>;
  getAllAppointments(): Promise<Appointment[]>;
  
  // Medical Record operations
  getMedicalRecord(id: number): Promise<MedicalRecord | undefined>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  updateMedicalRecord(id: number, record: Partial<InsertMedicalRecord>): Promise<MedicalRecord | undefined>;
  getMedicalRecordsByPatientId(patientId: number): Promise<MedicalRecord[]>;
  getAllMedicalRecords(): Promise<MedicalRecord[]>;
  
  // Prescription operations
  getPrescription(id: number): Promise<Prescription | undefined>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined>;
  getPrescriptionsByPatientId(patientId: number): Promise<Prescription[]>;
  getAllPrescriptions(): Promise<Prescription[]>;
  
  // Department operations
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  getTasksByUserId(userId: number): Promise<Task[]>;
  getAllTasks(): Promise<Task[]>;
  
  // Activity Log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivityLogs(limit: number): Promise<ActivityLog[]>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private appointments: Map<number, Appointment>;
  private medicalRecords: Map<number, MedicalRecord>;
  private prescriptions: Map<number, Prescription>;
  private departments: Map<number, Department>;
  private tasks: Map<number, Task>;
  private activityLogs: Map<number, ActivityLog>;
  
  sessionStore: session.SessionStore;
  currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.appointments = new Map();
    this.medicalRecords = new Map();
    this.prescriptions = new Map();
    this.departments = new Map();
    this.tasks = new Map();
    this.activityLogs = new Map();
    
    this.currentId = {
      users: 1,
      patients: 1,
      appointments: 1,
      medicalRecords: 1,
      prescriptions: 1,
      departments: 1,
      tasks: 1,
      activityLogs: 1,
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with some departments
    this.initializeDepartments();
  }
  
  private initializeDepartments() {
    const departments = [
      { name: "Cardiology", description: "Heart and vascular system", capacity: 100, occupancy: 85, staffUtilization: 90 },
      { name: "Neurology", description: "Brain and nervous system", capacity: 100, occupancy: 65, staffUtilization: 80 },
      { name: "Pediatrics", description: "Children's health", capacity: 100, occupancy: 72, staffUtilization: 85 },
      { name: "Orthopedics", description: "Musculoskeletal system", capacity: 100, occupancy: 90, staffUtilization: 95 },
      { name: "Oncology", description: "Cancer treatment", capacity: 100, occupancy: 78, staffUtilization: 88 },
    ];
    
    departments.forEach(dept => {
      this.createDepartment(dept);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Patient operations
  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }
  
  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(
      (patient) => patient.patientId === patientId,
    );
  }
  
  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.currentId.patients++;
    const registrationDate = new Date();
    const patient: Patient = { ...insertPatient, id, registrationDate };
    this.patients.set(id, patient);
    return patient;
  }
  
  async updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const existingPatient = this.patients.get(id);
    if (!existingPatient) return undefined;
    
    const updatedPatient = { ...existingPatient, ...patient };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }
  
  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }
  
  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentId.appointments++;
    const appointment: Appointment = { ...insertAppointment, id };
    this.appointments.set(id, appointment);
    return appointment;
  }
  
  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const existingAppointment = this.appointments.get(id);
    if (!existingAppointment) return undefined;
    
    const updatedAppointment = { ...existingAppointment, ...appointment };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  async getAppointmentsByPatientId(patientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.patientId === patientId,
    );
  }
  
  async getAppointmentsByDoctorId(doctorId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.doctorId === doctorId,
    );
  }
  
  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }
  
  // Medical Record operations
  async getMedicalRecord(id: number): Promise<MedicalRecord | undefined> {
    return this.medicalRecords.get(id);
  }
  
  async createMedicalRecord(insertRecord: InsertMedicalRecord): Promise<MedicalRecord> {
    const id = this.currentId.medicalRecords++;
    const recordDate = new Date();
    const record: MedicalRecord = { ...insertRecord, id, recordDate };
    this.medicalRecords.set(id, record);
    return record;
  }
  
  async updateMedicalRecord(id: number, record: Partial<InsertMedicalRecord>): Promise<MedicalRecord | undefined> {
    const existingRecord = this.medicalRecords.get(id);
    if (!existingRecord) return undefined;
    
    const updatedRecord = { ...existingRecord, ...record };
    this.medicalRecords.set(id, updatedRecord);
    return updatedRecord;
  }
  
  async getMedicalRecordsByPatientId(patientId: number): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values()).filter(
      (record) => record.patientId === patientId,
    );
  }
  
  async getAllMedicalRecords(): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values());
  }
  
  // Prescription operations
  async getPrescription(id: number): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }
  
  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const id = this.currentId.prescriptions++;
    const issueDate = new Date();
    const prescription: Prescription = { ...insertPrescription, id, issueDate };
    this.prescriptions.set(id, prescription);
    return prescription;
  }
  
  async updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const existingPrescription = this.prescriptions.get(id);
    if (!existingPrescription) return undefined;
    
    const updatedPrescription = { ...existingPrescription, ...prescription };
    this.prescriptions.set(id, updatedPrescription);
    return updatedPrescription;
  }
  
  async getPrescriptionsByPatientId(patientId: number): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(
      (prescription) => prescription.patientId === patientId,
    );
  }
  
  async getAllPrescriptions(): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values());
  }
  
  // Department operations
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }
  
  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.currentId.departments++;
    const department: Department = { ...insertDepartment, id };
    this.departments.set(id, department);
    return department;
  }
  
  async updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined> {
    const existingDepartment = this.departments.get(id);
    if (!existingDepartment) return undefined;
    
    const updatedDepartment = { ...existingDepartment, ...department };
    this.departments.set(id, updatedDepartment);
    return updatedDepartment;
  }
  
  async getAllDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }
  
  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentId.tasks++;
    const task: Task = { ...insertTask, id };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { ...existingTask, ...task };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async getTasksByUserId(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId,
    );
  }
  
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }
  
  // Activity Log operations
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentId.activityLogs++;
    const timestamp = new Date();
    const log: ActivityLog = { ...insertLog, id, timestamp };
    this.activityLogs.set(id, log);
    return log;
  }
  
  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
