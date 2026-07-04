create table if not exists users (
  id serial primary key,
  email text not null unique,
  role varchar(20) not null default 'anonymous',
  created_at timestamptz not null default now()
);

create table if not exists thesis_projects (
  id serial primary key,
  title text not null,
  student_name text not null,
  career text not null,
  year integer not null,
  abstract text not null default '',
  pdf_url text,
  user_id integer,
  created_at timestamptz not null default now()
);

create index if not exists thesis_projects_created_at_idx on thesis_projects (created_at desc);
