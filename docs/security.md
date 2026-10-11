# Keeping it safe

## Keys

- Database keys are pasted by the owner in Settings and stay in that
  browser. They are not in the code and not in the repositories.
- Keys for WhatsApp and social accounts live only in server environment
  variables. The browser never receives them.
- **Important:** a service-role key was once committed in the `invofy`
  repository. Rotate that key in Supabase and remove it from the repository
  history before going live.

## Browser configuration and publishing

The browser configuration stores only the Supabase project URL and public/anon key. The client module removes the legacy serviceRoleKey property from stored browser configuration when it is next read. The public key is not a substitute for row-level security.

Never enter or persist a service-role key in the visual editor, browser local storage, seed data, or any VITE-prefixed environment variable. Keep service-role keys and direct PostgreSQL connection strings in server-only environment variables. Rotate a privileged key if it may have been exposed; deleting a value from the current file does not remove it from Git history.

Page documents are validated before saving and publishing. The database publishing RPC runs as the caller and relies on the existing RLS policies; verify those policies explicitly for the intended editor/publisher roles before production use. Local-only drafts are never an authoritative public publication.

## Who can do what

Roles are kept in `user_roles`, never on the person's profile row. A
security-definer function `has_role()` is used in every policy, so a person
cannot give themselves a higher role.

| Role | Typical rights |
| --- | --- |
| super_admin | Everything, including deletions and role changes |
| admin | Everything except changing super admins |
| manager | Read and write all business records |
| sales | Leads, customers, conversations |
| operations | Service requests, partners |
| support | Conversations, feedback |
| marketing | Website content, campaigns, social |
| analyst | Read only, plus reports |
| view_only | Read only |

## Requests from outside

Webhooks check a shared secret, record the provider's event id, and skip
anything already seen. Every call is written to `webhook_events` with its
result, so a failure can be found and replayed.

## Records

`audit_logs` keeps who did what, to which record, when, and the value
before and after — for price changes, deletions, role changes, integration
changes and messages sent.

## Privacy

- Only what is needed is collected.
- Marketing consent is stored on the lead.
- Anonymous website activity is joined to a person only after a real
  signal from that person.
- No private accounts from Google or any other service are read.
