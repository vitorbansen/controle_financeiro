# 🚀 Sistema Financeiro - Next.js App Router

Um sistema completo de gestão financeira pessoal construído com **Next.js 15** usando **App Router**, **Prisma ORM**, **Tailwind CSS** e **TypeScript**.

## ✨ Funcionalidades

### 🔐 **Autenticação Completa**
- ✅ Registro de usuários com validação
- ✅ Login seguro com JWT
- ✅ Proteção de rotas automática
- ✅ Perfis personalizáveis

### 💰 **Gestão Financeira**
- ✅ Controle de receitas e despesas
- ✅ Transações parceladas automáticas
- ✅ Transações recorrentes (mensais)
- ✅ Categorização inteligente
- ✅ Relatórios mensais e anuais
- ✅ Dashboard interativo e moderno

### 🎨 **Interface Moderna**
- ✅ Design responsivo com Tailwind CSS
- ✅ Componentes modernos e interativos
- ✅ Animações e transições suaves
- ✅ Gradientes e efeitos visuais
- ✅ Experiência mobile-first

## 🛠️ Tecnologias Utilizadas

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **Prisma ORM** - ORM moderno para banco de dados
- **SQLite** - Banco de dados local
- **Axios** - Cliente HTTP
- **JWT** - Autenticação segura
- **bcryptjs** - Hash de senhas

## 🚀 Como Executar

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

## 📊 Funcionalidades do Dashboard

### **Dashboard Principal**
- 📈 Resumo anual de entradas, saídas e saldo
- 📅 Visão mensal detalhada
- ➕ Formulário para adicionar transações
- 🔄 Suporte a transações parceladas
- 🗑️ Exclusão de transações

### **Transações Recorrentes**
- 🔁 Criação de transações mensais automáticas
- 📋 Gerenciamento de recorrências ativas
- ✏️ Edição e exclusão de recorrentes
- 📅 Configuração de dia de vencimento

## 🔒 Segurança

- 🔐 Senhas hasheadas com bcrypt
- 🎫 Autenticação JWT com expiração
- 🛡️ Validação de dados no backend
- 🚫 Proteção contra acesso não autorizado

---

**Desenvolvido com ❤️ usando Next.js 15 e App Router**
