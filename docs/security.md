# Keeping it safe

## Keys

- Database keys are pasted by the owner in Settings and stay in that
  browser. They are not in the code and not in the repositories.
- Keys for WhatsApp and social accounts live only in server environment
  variables. The browser never receives them.
- **Important:** a service-role key was once committed in the `invofy`
  repository. Rotate that key in Supabase and remove it from the repository
  history before going live.

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
