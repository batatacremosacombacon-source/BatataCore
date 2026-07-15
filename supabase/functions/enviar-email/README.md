# Edge Function `enviar-email`

Processa até 20 mensagens pendentes da tabela `email_queue` e envia pelo Resend.

Segredos necessários:

```bash
supabase secrets set RESEND_API_KEY=...
supabase secrets set EMAIL_FROM="BatataCore <eventos@seudominio.com>"
```

Implante com verificação JWT habilitada:

```bash
supabase functions deploy enviar-email --verify-jwt
```

A função aceita apenas usuários autenticados com perfil `admin` ou `organizador`. Ela pode ser chamada pelo painel, por um cron autenticado ou manualmente.
