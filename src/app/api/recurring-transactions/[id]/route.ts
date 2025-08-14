// app/api/recurring-transactions/[id]/route.ts
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = verifyToken(request);
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a transação pertence ao usuário
    const existingTransaction = await prisma.recurringTransaction.findFirst({
      where: { id, userId }
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { message: 'Transação recorrente não encontrada' },
        { status: 404 }
      );
    }

    await prisma.recurringTransaction.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Transação recorrente deletada com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao deletar transação recorrente:', error);
    return NextResponse.json(
      { message: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Token não fornecido' || error.message === 'Token inválido' ? 401 : 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}