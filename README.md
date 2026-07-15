# 🥔 BatataCore 2.0

Plataforma web para divulgação de eventos, inscrições, ingressos digitais, check-in e certificados. O projeto utiliza HTML, CSS e JavaScript no front-end, Supabase para banco de dados/autenticação e Vercel para hospedagem.

## Principais recursos

### Público e participante

- catálogo dinâmico de eventos com pesquisa e filtro por categoria;
- página individual para cada evento;
- inscrição com controle atômico de vagas e lista de espera;
- consentimento LGPD no formulário;
- criação de conta, login, recuperação de senha e sessão persistente com Supabase Auth;
- área do participante com histórico, cancelamento e dados pessoais;
- ingresso digital com código único e QR Code;
- certificado digital com código público de validação;
- compartilhamento e arquivo `.ics` para agenda;
- formulário de contato integrado ao Supabase;
- PWA instalável, página offline e aviso de conexão;
- tema escuro, controle de fonte, redução de animações, menu mobile e navegação por teclado;
- Política de Privacidade, Termos de Uso, sitemap e robots.txt.

### Administração

- painel protegido por autenticação e papel (`admin` ou `organizador`);
- indicadores de eventos, inscrições, check-ins e contatos;
- criação, edição, publicação, cancelamento e arquivamento de eventos;
- consulta e filtro de inscrições;
- exportação CSV;
- cancelamento com devolução de vaga;
- check-in por código de ingresso;
- central de mensagens de contato;
- auditoria básica no banco;
- fila de e-mails e Edge Function para processamento.

## Estrutura adicionada

```text
BatataCore-main/
├── database/setup.sql
├── supabase/functions/enviar-email/
├── service-worker.js
├── manifest.webmanifest
├── offline.html
├── robots.txt
├── sitemap.xml
├── css/
│   ├── modern.css
│   ├── portal.css
│   └── admin.css
├── html/
│   ├── evento.html
│   ├── minha-conta.html
│   ├── certificado.html
│   ├── privacidade.html
│   └── termos.html
└── js/
    ├── app.js
    ├── evento.js
    ├── minha-conta.js
    └── certificado.js
```

## Configuração obrigatória do Supabase

1. Abra o projeto Supabase usado pelo BatataCore.
2. Faça backup das tabelas atuais.
3. Abra **SQL Editor**. O script substitui as políticas RLS antigas das tabelas do BatataCore por regras seguras.
4. Execute todo o arquivo [`database/setup.sql`](database/setup.sql).
5. Em **Authentication → URL Configuration**, adicione a URL local e a URL da Vercel como URLs permitidas, por exemplo:
   - `http://localhost:8000/html/minha-conta.html`
   - `https://SEU-DOMINIO.vercel.app/html/minha-conta.html`
   - `https://SEU-DOMINIO.vercel.app/html/login.html`
6. Crie uma conta normalmente em `html/login.html`.
7. Promova a primeira conta administrativa pelo SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'seu-email@exemplo.com';
```

O painel fica em `html/inscritos.html` ou na rota curta `/admin` depois do deploy.

## Supabase no front-end

A URL e a chave publishable/anon estão em `js/supabase.js`. Nunca coloque `service_role` no navegador. A proteção dos dados é feita pelas políticas RLS do arquivo `database/setup.sql`.

## E-mails automáticos

A inscrição cria uma mensagem pendente na tabela `email_queue`. A Edge Function em `supabase/functions/enviar-email` processa a fila usando Resend.

Configure os segredos:

```bash
supabase secrets set RESEND_API_KEY=...
supabase secrets set EMAIL_FROM="BatataCore <eventos@seudominio.com>"
supabase functions deploy enviar-email --verify-jwt
```

A função exige um JWT de usuário com perfil `admin` ou `organizador`.

## Executar localmente

Não abra os arquivos diretamente com `file://`, porque autenticação e PWA precisam de um servidor HTTP.

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Deploy na Vercel

O arquivo `vercel.json` contém URLs limpas, rotas curtas e cabeçalhos de segurança. Ao conectar o repositório à Vercel, novos pushes na branch configurada geram novo deploy automaticamente.

## Checklist antes de publicar

- executar `database/setup.sql`;
- criar e promover o administrador;
- revisar a URL e a chave em `js/supabase.js`;
- configurar URLs de redirecionamento no Supabase Auth;
- testar criação e confirmação de conta;
- testar uma inscrição, lista de espera e cancelamento;
- testar painel e check-in;
- configurar domínio de e-mail;
- ajustar o domínio em `robots.txt` e `sitemap.xml` caso não seja `batata-core.vercel.app`;
- testar em celular real e limpar o cache antigo do Service Worker após o deploy.

## Segurança

- login fixo em JavaScript removido;
- painel protegido por Supabase Auth e perfil administrativo;
- leitura pública de dados pessoais removida;
- RLS habilitada nas tabelas expostas;
- criação de inscrição feita por RPC com bloqueio de linha para evitar excesso de vagas;
- papéis não podem ser elevados pelo próprio usuário;
- valores vindos do banco são inseridos no DOM com `textContent` nas telas novas;
- `service_role` é usado somente no ambiente seguro da Edge Function.

## Observação sobre migração

O SQL foi escrito para adicionar colunas às tabelas acadêmicas existentes (`eventos`, `inscritos` e `contatos`). Caso existam inscrições duplicadas para o mesmo e-mail/evento, o script emitirá um aviso e o índice único deverá ser criado depois da limpeza dos dados.
