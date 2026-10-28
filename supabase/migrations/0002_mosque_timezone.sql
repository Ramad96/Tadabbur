-- Recitation times are shown in the mosque's own local time ("Fajr · 04:52"), so each mosque
-- records its IANA time zone. Existing (London) mosques get Europe/London.
-- Run in the SQL Editor after 0001_init.sql.

alter table tadabbur.mosques
  add column timezone text not null default 'Europe/London'
  check (timezone ~ '^[A-Za-z]+(/[A-Za-z0-9_+-]+)*$' and char_length(timezone) <= 64);
