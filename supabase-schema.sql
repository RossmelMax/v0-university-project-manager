create table if not exists thesis_projects (
  id serial primary key,
  title text not null,
  student_name text not null,
  career text not null,
  year integer not null,
  abstract text not null default '',
  pdf_url text,
  user_id integer,
  advisor text default '',
  created_at timestamptz not null default now()
);

create index if not exists thesis_projects_created_at_idx on thesis_projects (created_at desc);
