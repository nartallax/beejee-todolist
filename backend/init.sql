drop table if exists tasks;
create table tasks(
	id serial primary key,
	username text,
	email text,
	body text,
	completed bool,
	"editedByAdmin" bool
);

drop table if exists admins;
create table admins(
	id serial primary key,
	login text,
	"passwordHash" text,
	token text
);
insert into admins(login, "passwordHash", token) values('admin', 'e282ffc012ad9e6eee065a0aa144632691057feaea0470e8c6fd04014b224152c69de0a8fea8d161af4dca5828c01dd7a817b2b1b81c9bbc79a1a44dca5285eb', null);