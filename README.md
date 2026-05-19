# Andamiro Demo

## Links

- Local: http://localhost:8080/presentation
- Deploy: https://gounpark.github.io/andamiro-demo/presentation

## Exchange diary push notifications

Web Push needs VAPID keys in both the frontend build and Supabase Edge Function.

```bash
node scripts/generate-vapid-keys.mjs
```

Set `VITE_VAPID_PUBLIC_KEY` for the web app build. Set `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` as Supabase secrets, then deploy:

```bash
supabase db push
supabase functions deploy send-exchange-notification
```
