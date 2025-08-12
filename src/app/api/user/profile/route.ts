import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Função para verificar token JWT
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token não fornecido');
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };
  } catch (error) {
    throw new Error('Token inválido');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = verifyToken(request);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      profile: user.profile ? JSON.parse(user.profile.data) : {}
    });

  } catch (error: any) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { message: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Token não fornecido' || error.message === 'Token inválido' ? 401 : 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = verifyToken(request);
    const { name, profileData } = await request.json();

    // Atualizar dados básicos do usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name }
    });

    // Atualizar ou criar perfil
    const existingProfile = await prisma.profile.findUnique({
      where: { userId }
    });

    if (existingProfile) {
      await prisma.profile.update({
        where: { userId },
        data: { data: JSON.stringify(profileData) }
      });
    } else {
      await prisma.profile.create({
        data: {
          userId,
          data: JSON.stringify(profileData)
        }
      });
    }

    // Buscar dados atualizados
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = user!;

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      user: userWithoutPassword,
      profile: user!.profile ? JSON.parse(user!.profile.data) : {}
    });

  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { message: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Token não fornecido' || error.message === 'Token inválido' ? 401 : 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

