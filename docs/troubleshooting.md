# When something is not right

## "Connect your database in Settings first"

The browser has no database keys. Open **Settings → Connections**, paste
your project URL and public key, press Test, then reload.

## A page says a table is missing

The setup script has not been run, or a newer version has not been run yet.
Open **Settings → Connections**, press **Copy setup script**, and run the
whole thing in your Supabase SQL editor. It only adds, so it is safe to run
again.

## A message shows "not delivered"

The messaging service is not connected. Check the Connections panel on the
Dashboard. It tells you exactly which settings are missing. The message is
kept, so you can send it again once the service is connected.

## Incoming WhatsApp messages do not arrive

1. The webhook must point to `https://YOUR-SITE/api/public/whatsapp/webhook`.
2. The call must carry the shared secret that matches `WHATSAPP_WEBHOOK_SECRET`.
3. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be set on the host.

Every attempt, good or bad, is written to `webhook_events` with the reason.

## A social account says "not connected"

Its keys are not set on the host. The Social page lists exactly which ones
each platform needs, and what that platform does and does not allow.

## The website shows old text

Website content has a draft and a published version. Open **Website**,
check the section, and press **Publish**.

## Numbers look wrong

Every number on the Dashboard is counted from real records. If one looks
wrong, open the matching page (Customers, Finance, Inbox) and check the
records behind it. Nothing is estimated or filled in.
