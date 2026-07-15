import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'index.html','offline.html','manifest.webmanifest','service-worker.js','database/setup.sql',
  'html/login.html','html/inscritos.html','html/minha-conta.html','html/evento.html','html/certificado.html',
  'html/privacidade.html','html/termos.html','js/app.js','js/supabase.js'
];
const failures = [];
for (const file of required) if (!existsSync(join(root,file))) failures.push(`Arquivo ausente: ${file}`);

for (const file of readdirSync(join(root,'js')).filter(name=>name.endsWith('.js'))) {
  const text=readFileSync(join(root,'js',file),'utf8');
  if (/admin@batatacore\.com|SENHA_ADMIN\s*=|123456/.test(text)) failures.push(`Credencial fixa encontrada em js/${file}`);
}

const login = readFileSync(join(root,'html/login.html'),'utf8');
if (!login.includes('signInWithPassword') && !readFileSync(join(root,'js/login.js'),'utf8').includes('signInWithPassword')) failures.push('Login Supabase não encontrado.');
const sql = readFileSync(join(root,'database/setup.sql'),'utf8');
for (const token of ['enable row level security','criar_inscricao','realizar_checkin','validar_certificado']) if (!sql.includes(token)) failures.push(`SQL sem ${token}`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Smoke test aprovado: ${required.length} arquivos essenciais e ${readdirSync(join(root,'js')).filter(n=>n.endsWith('.js')).length} scripts revisados.`);
