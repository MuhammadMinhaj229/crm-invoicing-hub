-- Isolated legacy objects used to prove reset behavior on the CI-only PostgreSQL database.
create type public.legacy_reset_role as enum ('legacy');
create table public.legacy_reset_accounts (
  id integer primary key,
  name text not null
);
create table public.legacy_reset_contacts (
  id integer primary key,
  account_id integer not null references public.legacy_reset_accounts(id),
  role public.legacy_reset_role not null
);
insert into public.legacy_reset_accounts(id, name) values (1, 'legacy account');
insert into public.legacy_reset_contacts(id, account_id, role) values (1, 1, 'legacy');

create view public.legacy_reset_contact_view as
select contact.id, account.name
from public.legacy_reset_contacts contact
join public.legacy_reset_accounts account on account.id = contact.account_id;

create function public.legacy_reset_rpc()
returns bigint
language sql
as $function$
  select count(*) from public.legacy_reset_contacts
$function$;

create sequence public.legacy_reset_orphan_seq;
