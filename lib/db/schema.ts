import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core"

export const thesisProjects = pgTable("thesis_projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  studentName: text("student_name").notNull(),
  career: text("career").notNull(),
  year: integer("year").notNull(),
  abstract: text("abstract").notNull().default(""),
  advisor: text("advisor").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type ThesisProject = typeof thesisProjects.$inferSelect
export type NewThesisProject = typeof thesisProjects.$inferInsert
