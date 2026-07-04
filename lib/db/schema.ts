import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("anonymous"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const thesisProjects = pgTable("thesis_projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  studentName: text("student_name").notNull(),
  career: text("career").notNull(),
  year: integer("year").notNull(),
  abstract: text("abstract").notNull().default(""),
  userId: integer("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const projectPdfs = pgTable("project_pdfs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  pdfUrl: text("pdf_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type ThesisProject = typeof thesisProjects.$inferSelect
export type NewThesisProject = typeof thesisProjects.$inferInsert
export type ProjectPdf = typeof projectPdfs.$inferSelect
export type NewProjectPdf = typeof projectPdfs.$inferInsert
