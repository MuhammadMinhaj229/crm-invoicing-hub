# Outside services

Nothing is faked here. Where a platform does not allow something, the app
says so on the **Social** page instead of pretending.

## WhatsApp

Two ways, both behind one adapter, so you can move from one to the other
without changing anything else.

1. **Your own server (Evolution API).** Free and open source. Pair by QR.
   Set `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`.
2. **Official Meta Cloud API.** Needs an approved WhatsApp Business account.
   Set `WHATSAPP_CLOUD_TOKEN`, `WHATSAPP_CLOUD_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`.

If both are set, the official one is used.

Incoming messages: point the provider's webhook at
`https://YOUR-SITE/api/public/whatsapp/webhook`.
Every call must carry the shared secret (`x-webhook-secret` header or
`?secret=`), matching `WHATSAPP_WEBHOOK_SECRET`. Repeats of the same message
are ignored, so a retry never creates two records.

## Social platforms

| Platform | Can | Cannot |
| --- | --- | --- |
| Instagram (Business) | Publish photos and reels, read comments, read messages with an approved app | Work with a personal account |
| Facebook Page | Publish posts, read comments and messages, read page stats | Post to personal profiles |
| Google Business Profile | Publish updates, read and reply to reviews | Change or remove honest reviews |
| LinkedIn Page | Publish company posts, read simple stats | Read private messages |
| YouTube | Upload videos, read comments and views | Change public numbers |

Each one needs its own keys, listed in `.env.example`. Until the keys are
set, the Social page shows the account as not connected and a planned post
is kept as a draft — it is never marked as sent.

## Checking

The team console asks the server which services really have their keys.
No key value is ever sent back to the browser.
