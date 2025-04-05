import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User/Staff schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // admin, doctor, nurse, receptionist
  department: integer("department").references(() => departments.id),
  specialization: text("specialization"),
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  department: true,
  specialization: true,
  avatar: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Department schema
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  capacity: integer("capacity"),
  occupancy: integer("occupancy").default(0),
  staffUtilization: integer("staff_utilization").default(0),
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  description: true,
  capacity: true,
  occupancy: true,
  staffUtilization: true,
});

// Patient schema
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull().unique(), // #PT-12345 format
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  bloodType: text("blood_type"),
  address: text("address"),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
  registrationDate: timestamp("registration_date").defaultNow(),
  avatar: text("avatar"),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  registrationDate: true,
});

// Appointment schema
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  doctorId: integer("doctor_id").references(() => users.id).notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  purpose: text("purpose").notNull(), // consultation, follow-up, check-up, etc.
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, completed
  notes: text("notes"),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
});

// Medical Record schema
export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  doctorId: integer("doctor_id").references(() => users.id).notNull(),
  recordDate: timestamp("record_date").defaultNow(),
  diagnosis: text("diagnosis"),
  symptoms: text("symptoms"),
  treatment: text("treatment"),
  notes: text("notes"),
  vitals: json("vitals"), // blood pressure, temperature, etc.
  attachments: text("attachments").array(), // paths to files, could be lab results, images, etc.
});

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({
  id: true,
  recordDate: true,
});

// Prescription schema
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  doctorId: integer("doctor_id").references(() => users.id).notNull(),
  issueDate: timestamp("issue_date").defaultNow(),
  medications: json("medications"), // array of medication objects with name, dosage, frequency, etc.
  instructions: text("instructions"),
  status: text("status").notNull().default("active"), // active, completed, cancelled
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  issueDate: true,
});

// Task schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: text("priority").default("standard"), // urgent, medium, standard
  status: text("status").default("pending"), // pending, completed
  relatedPatientId: integer("related_patient_id").references(() => patients.id),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
});

// Activity Log schema
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  patientId: integer("patient_id").references(() => patients.id),
  activityType: text("activity_type").notNull(), // appointment, prescription, record, etc.
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  details: json("details"), // Additional information
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type MedicalRecord = typeof medicalRecords.$inferSelect;

export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptions.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
