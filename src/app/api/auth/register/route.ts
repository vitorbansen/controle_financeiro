import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validação básica
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Usuário já existe com este email' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    });

    // Criar perfil padrão para o usuário
    await prisma.profile.create({
      data: {
        userId: user.id,
        data: JSON.stringify({
          preferences: {
            theme: 'light',
            language: 'pt-BR',
            notifications: true
          },
          personalInfo: {
            bio: '',
            location: '',
            website: ''
          },
          settings: {
            privacy: 'public',
            showEmail: false
          }
        })
      }
    });

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Usuário criado com sucesso',
      user: userWithoutPassword
    }, { status: 201 });

  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

