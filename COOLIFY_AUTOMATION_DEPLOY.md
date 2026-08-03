# Evolution API + n8n + Ctrl LTV no Coolify

Esta implantação usa Docker Compose comum e uma rede externa compartilhada. Bancos e Redis permanecem isolados nas redes internas de cada stack.

## 1. Criar a rede uma única vez

No terminal da VPS:

```bash
docker network inspect ctrl-ltv-automation >/dev/null 2>&1 || docker network create ctrl-ltv-automation
```

## 2. Preparar DNS

Crie os registros DNS apontando para a VPS:

- `evolution.seudominio.com`
- `n8n.seudominio.com`
- `webhook-n8n.seudominio.com`

Use os domínios reais nas variáveis do Coolify. O proxy e os certificados HTTPS serão gerenciados pelo Coolify.

## 3. Gerar segredos

Gere valores diferentes para cada variável:

```bash
openssl rand -hex 32
```

Nunca troque `N8N_ENCRYPTION_KEY` depois que credenciais forem cadastradas no n8n. A perda dessa chave impede a leitura das credenciais criptografadas.

## 4. Publicar a Evolution API

No Coolify, crie um recurso **Docker Compose** usando o repositório do frontend e informe:

```text
Compose file: /evolution-api
Service público: evolution-api
Porta interna: 8080
Domínio: https://evolution.seudominio.com
```

Cadastre as variáveis correspondentes ao bloco `EVOLUTION_*` de `automation.env.example` e também:

```env
AUTOMATION_NETWORK=ctrl-ltv-automation
```

Não publique portas do PostgreSQL ou Redis.

## 5. Publicar o n8n

Crie outro recurso **Docker Compose** usando:

```text
Compose file: /n8n.stack.yaml
```

Configure dois serviços públicos:

```text
n8n-editor  → porta 5678 → https://n8n.seudominio.com
n8n-webhook → porta 5678 → https://webhook-n8n.seudominio.com
```

O serviço `n8n-worker`, o PostgreSQL e o Redis não recebem domínio público.

Cadastre as variáveis `N8N_*` de `automation.env.example`. Editor, webhook e worker devem usar exatamente a mesma `N8N_ENCRYPTION_KEY`.

## 6. Atualizar o backend Ctrl LTV

No recurso Docker Compose do backend, defina:

```env
AUTOMATION_NETWORK=ctrl-ltv-automation
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_WEBHOOK_URL=http://ctrl-ltv-api:4000/v1/webhooks/evolution
EVOLUTION_API_GLOBAL_KEY=O_MESMO_VALOR_DE_EVOLUTION_API_KEY
```

Faça o deploy do backend somente depois que Evolution API e n8n estiverem saudáveis.

## 7. Testar comunicação interna

No terminal da VPS, descubra os containers conectados:

```bash
docker network inspect ctrl-ltv-automation
```

Teste a partir do container da API do Ctrl LTV:

```bash
docker exec <container-ctrl-ltv-api> node -e "fetch('http://evolution-api:8080').then(r=>console.log(r.status)).catch(e=>{console.error(e);process.exit(1)})"
```

No n8n, use o node HTTP Request com:

```text
http://ctrl-ltv-api:4000/health
```

## 8. Ordem de implantação

1. Fazer backup de volumes antigos, caso existam.
2. Criar a rede compartilhada.
3. Publicar Evolution API e validar banco/Redis.
4. Publicar n8n e criar o usuário proprietário.
5. Atualizar o backend Ctrl LTV.
6. Cadastrar a Evolution no Ctrl LTV.
7. Criar um workflow de teste no n8n.
8. Validar webhooks e reinicialização dos containers.

## Endereços internos

```text
Ctrl LTV → http://evolution-api:8080
Evolution → http://ctrl-ltv-api:4000/v1/webhooks/evolution
n8n → http://ctrl-ltv-api:4000
n8n → http://evolution-api:8080
```
