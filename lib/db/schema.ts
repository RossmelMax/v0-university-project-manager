import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: varchar("role", { length: 20 }).notNull().default("anonymous"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const thesisProjects = pgTable("thesis_projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  studentName: text("student_name").notNull(),
  career: text("career").notNull(),
  year: integer("year").notNull(),
  abstract: text("abstract").notNull().default(""),
  pdfUrl: text("pdf_url"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ThesisProject = typeof thesisProjects.$inferSelect;
export type NewThesisProject = typeof thesisProjects.$inferInsert;
export type AppUser = typeof users.$inferSelect;
export type NewAppUser = typeof users.$inferInsert;
