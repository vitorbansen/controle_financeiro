import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário com perfil
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Gerar JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

