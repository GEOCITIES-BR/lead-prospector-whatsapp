# Configuração Supabase — Lead Prospector WhatsApp

## O que é Supabase?

Supabase é um backend como serviço open source que fornece PostgreSQL, autenticação, storage e edge functions. Usamos o Supabase como banco de dados principal da plataforma.

## Setup

### 1. Crie uma conta

Acesse [supabase.com](https://supabase.com) e crie uma conta.

### 2. Crie um projeto

- Nome: `lead-prospector-whatsapp`
- Database Password: (guarde com segurança)
- Region: escolha a mais próxima

### 3. Obtenha as credenciais

No dashboard do projeto:

1. **Project Settings > Database**
   - Connection string (URI)
   
2. **Project Settings > API**
   - Project URL (SUPABASE_URL)
   - anon public key (SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY)

### 4. Configure no .env

```env
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres?sslmode=require
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Execute as migrations

```bash
npx prisma migrate deploy
```

## Desenvolvimento Local

Para desenvolvimento, use o PostgreSQL do Docker Compose:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lead_prospector
```

## Schemas e Tabelas

O Prisma gerencia os schemas. Para visualizar:

```bash
npx prisma studio
```

Os modelos estão definidos em `prisma/schema.prisma`.
