# Relatório de implementação — BatataCore 2.0

## Corrigido

- credenciais administrativas fixas removidas;
- proteção comentada do painel substituída por Supabase Auth;
- leitura pública da tabela de inscritos removida no novo SQL;
- renderização insegura de eventos e participantes substituída por criação segura de elementos;
- estados de carregamento, erro e vazio adicionados;
- manifest antigo vazio corrigido;
- links legais, metadados SEO e cabeçalhos de segurança adicionados;
- navegação mobile e preferências de acessibilidade ativadas.

## Implementado no front-end

- autenticação, cadastro, recuperação de senha e logout;
- área do participante;
- painel administrativo responsivo;
- CRUD de eventos;
- página individual de evento;
- controle de vagas/lista de espera via RPC;
- ingresso e QR Code;
- cancelamento e check-in;
- exportação CSV;
- certificados verificáveis;
- PWA e modo offline;
- Política de Privacidade e Termos de Uso.

## Requer ação externa

As mudanças do banco não foram aplicadas automaticamente a um projeto Supabase, pois o projeto BatataCore não estava disponível na conexão ativa desta sessão. Execute `database/setup.sql` no projeto correto. O envio real de e-mail também exige domínio e chave do provedor configurados.
