#  Sistema Financeiro - Next.js App Router

Um sistema completo de gestão financeira pessoal construído com **Next.js 15** usando **App Router**, **Prisma ORM**, **Tailwind CSS** e **TypeScript**.

##  Funcionalidades

###  **Autenticação Completa**
-  Registro de usuários com validação
-  Login seguro com JWT
-  Proteção de rotas automática
-  Perfis personalizáveis

###  **Gestão Financeira**
-  Controle de receitas e despesas
-  Transações parceladas automáticas
-  Transações recorrentes (mensais)
-  Categorização inteligente
-  Relatórios mensais e anuais
-  Dashboard interativo e moderno

###  **Interface Moderna**
-  Design responsivo com Tailwind CSS
-  Componentes modernos e interativos
-  Animações e transições suaves
-  Gradientes e efeitos visuais
-  Experiência mobile-first

##  Tecnologias Utilizadas

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **Prisma ORM** - ORM moderno para banco de dados
- **SQLite** - Banco de dados local
- **Axios** - Cliente HTTP
- **JWT** - Autenticação segura
- **bcryptjs** - Hash de senhas

##  Como Executar

### 1. **Instalar Dependências**
```bash
npm install
```

### 2. **Configurar Banco de Dados**
```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev --name init
```

### 3. **Iniciar Servidor de Desenvolvimento**
```bash
npm run dev
```

### 4. **Acessar Aplicação**
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

##  Funcionalidades do Dashboard

### **Dashboard Principal**
-  Resumo anual de entradas, saídas e saldo
-  Visão mensal detalhada
-  Formulário para adicionar transações
-  Suporte a transações parceladas
-  Exclusão de transações

### **Transações Recorrentes**
-  Criação de transações mensais automáticas
-  Gerenciamento de recorrências ativas
-  Edição e exclusão de recorrentes
-  Configuração de dia de vencimento

##  Segurança

-  Senhas hasheadas com bcrypt
-  Autenticação JWT com expiração
-  Validação de dados no backend
-  Proteção contra acesso não autorizado

---

# Funcionalidades Detalhadas (App Router)



## 1. Visão Geral do Projeto

O projeto de controle financeiro é uma aplicação web completa que permite aos usuários gerenciar suas finanças pessoais de forma eficiente. Ele inclui um sistema de autenticação robusto, gerenciamento de transações (entradas e saídas), transações recorrentes e relatórios financeiros detalhados. Cada usuário possui seus próprios dados isolados, garantindo privacidade e personalização.

## 2. Estrutura do Projeto

O projeto segue a arquitetura do Next.js com o App Router, organizando o código de forma modular e escalável. A estrutura principal é a seguinte:

```
nextjs-auth-app/
├── prisma/                 # Definições do schema do banco de dados e migrações
│   └── schema.prisma
├── src/                    # Código fonte da aplicação
│   ├── app/                # Rotas e páginas do App Router
│   │   ├── api/            # Endpoints da API
│   │   │   ├── auth/       # APIs de autenticação (login, registro, etc.)
│   │   │   ├── financial-reports/ # APIs para relatórios financeiros
│   │   │   ├── recurring-transactions/ # APIs para transações recorrentes
│   │   │   ├── transactions/ # APIs para gerenciamento de transações
│   │   │   └── user/       # APIs para perfil do usuário
│   │   ├── components/     # Componentes React reutilizáveis
│   │   ├── lib/            # Funções utilitárias e de configuração (ex: Axios)
│   │   └── [...outras pastas de rotas e páginas]
├── .env                    # Variáveis de ambiente
├── package.json            # Dependências e scripts do projeto
├── tsconfig.json           # Configurações do TypeScript
└── README.md               # Informações básicas do projeto
```

## 3. Configuração do Banco de Dados (Prisma)

O projeto utiliza o Prisma ORM para interagir com o banco de dados. O `schema.prisma` define os modelos de dados e seus relacionamentos. Por padrão, o projeto é configurado para usar SQLite, o que facilita o desenvolvimento local, pois não requer um servidor de banco de dados separado.

### 3.1. Modelos de Dados

Os principais modelos de dados definidos no `schema.prisma` são:

- **User**: Representa os usuários do sistema, contendo informações de autenticação.

- **Profile**: Armazena informações adicionais e personalizadas de cada usuário, com um relacionamento 1:1 com o modelo `User`.

- **Transaction**: Registra todas as transações financeiras (entradas e saídas) de um usuário, incluindo detalhes como tipo, valor, categoria e data. Suporta parcelamento.

- **RecurringTransaction**: Gerencia transações que se repetem periodicamente, como aluguel ou salários.

### 3.2. Exemplo de `schema.prisma`

```
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String
  name      String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  profile   Profile? 
  transactions Transaction[]
  recurringTransactions RecurringTransaction[]
}

model Profile {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  data      String     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Transaction {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  type          String    // 'entrada' or 'saida'
  description   String
  value         Float
  category      String
  date          DateTime
  isParcelled   Boolean   @default(false)
  parcelNumber  Int?      // Número de parcelas (1, 2, 3)
  totalParcels  Int?      // Total de Parcelas
  groupId       String?   // Grupo de Parcelamento
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model RecurringTransaction {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  type          String    // 'entrada' or 'saida'
  description   String
  value         Float
  category      String
  dueDay        Int       // Dia de Recorrencia 
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

```

## 4. APIs do Backend

As APIs são construídas com Next.js (App Router) e utilizam o Prisma para persistência de dados. Todas as APIs são protegidas e requerem autenticação JWT.

### 4.1. APIs de Autenticação (`/api/auth`)

- **`/api/auth/register`**** (POST)**: Registra um novo usuário e cria um perfil padrão para ele.

- **`/api/auth/login`**** (POST)**: Autentica um usuário e retorna um token JWT.

- **`/api/auth/forgot-password`**** (POST)**: Inicia o processo de recuperação de senha.

- **`/api/auth/reset-password`**** (POST)**: Redefine a senha do usuário.

### 4.2. APIs de Perfil do Usuário (`/api/user`)

- **`/api/user/profile`**** (GET)**: Retorna os dados do perfil do usuário autenticado.

- **`/api/user/profile`**** (PUT)**: Atualiza os dados do perfil do usuário autenticado.

### 4.3. APIs de Transações (`/api/transactions`)

- **`/api/transactions`**** (GET)**: Busca transações financeiras, com filtros por ano e mês.

- **`/api/transactions`**** (POST)**: Cria uma nova transação ou um grupo de transações parceladas.

- **`/api/transactions`**** (DELETE)**: Remove uma transação ou um grupo de transações parceladas.

### 4.4. APIs de Transações Recorrentes (`/api/recurring-transactions`)

- **`/api/recurring-transactions`**** (GET)**: Lista as transações recorrentes do usuário.

- **`/api/recurring-transactions`**** (POST)**: Cria uma nova transação recorrente.

- **`/api/recurring-transactions`**** (PUT)**: Atualiza uma transação recorrente existente.

- **`/api/recurring-transactions`**** (DELETE)**: Remove uma transação recorrente.

- **`/api/recurring-transactions/apply`**** (POST)**: Aplica as transações recorrentes para um mês específico, gerando transações reais com base nas definições de recorrência.

### 4.5. APIs de Relatórios Financeiros (`/api/financial-reports`)

- **`/api/financial-reports`**** (GET)**: Gera diferentes tipos de relatórios financeiros, como resumo mensal, por categorias e saldo acumulado.

## 5. Frontend (Componentes e Páginas)

O frontend é construído com React e Next.js, utilizando componentes reutilizáveis e o sistema de roteamento do App Router. O Axios é configurado para lidar com as chamadas à API, incluindo interceptadores para tratamento de tokens JWT.

### 5.1. Componentes Principais

- **`LoginForm.tsx`**: Formulário para login de usuários.

- **`RegisterForm.tsx`**: Formulário para registro de novos usuários.

- **`ForgotPasswordForm.tsx`**: Formulário para iniciar o processo de recuperação de senha.

- **`ResetPasswordForm.tsx`**: Formulário para redefinir a senha.

- **`Dashboard.tsx`**: O principal componente do dashboard financeiro, onde os usuários podem visualizar e gerenciar suas transações, transações recorrentes e relatórios.

### 5.2. Páginas (Rotas)

- **`/`**: Página inicial (pode redirecionar para login/dashboard).

- **`/login`**: Página de login.

- **`/register`**: Página de registro.

- **`/forgot-password`**: Página para recuperação de senha.

- **`/reset-password`**: Página para redefinição de senha.

- **`/dashboard`**: Página principal do dashboard financeiro, protegida por autenticação.

## 6. Como Usar o Projeto

Para configurar e executar o projeto em seu ambiente local, siga os passos abaixo:

### 6.1. Pré-requisitos

- Node.js (versão 18 ou superior)

- npm ou Yarn

### 6.2. Configuração

1. **Extraia o arquivo do projeto:**
   ```bash
   tar -xzf nextjs-auth-app-slim.tar.gz
   cd nextjs-auth-app
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   # ou yarn install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="sua_chave_secreta_jwt_aqui"
   ```
   - `DATABASE_URL`: Define a URL de conexão com o banco de dados. Para SQLite, `file:./dev.db` criará um arquivo `dev.db` na raiz do projeto.
   - `JWT_SECRET`: Uma string secreta para assinar e verificar os tokens JWT. **Mude esta string para uma valor forte e único em produção.**

4. **Execute as migrações do Prisma:**
   Este comando criará o banco de dados (se não existir) e aplicará o schema definido no `prisma/schema.prisma`.

### 6.3. Execução

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
# ou yarn dev
```

O aplicativo estará disponível em `http://localhost:3000`.

## 7. Testando as Funcionalidades

- **Registro:** Acesse `/register` para criar uma nova conta.

- **Login:** Após o registro, acesse `/login` para entrar no sistema.

- **Dashboard:** Após o login, você será redirecionado para `/dashboard`, onde poderá gerenciar suas finanças.

- **Gerenciamento de Transações:** Adicione, edite e visualize suas transações.

- **Transações Recorrentes:** Configure transações que se repetem automaticamente.

- **Relatórios:** Gere relatórios para analisar seus gastos e ganhos.

- **Perfil:** Edite suas informações de perfil em `/dashboard`.

## 8. Considerações Finais

Este projeto serve como uma base sólida para uma aplicação de controle financeiro. Ele pode ser estendido com funcionalidades adicionais, como categorias personalizadas, orçamentos, integração com APIs bancárias, etc. A arquitetura modular e o uso de tecnologias modernas como Next.js, React, Prisma e Tailwind CSS (se configurado) facilitam a manutenção e o desenvolvimento futuro.

---

