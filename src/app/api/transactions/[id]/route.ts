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

    // Buscar a transação para verificar se pertence ao usuário
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { message: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    // Se for uma transação parcelada, deletar todo o grupo
    if (transaction.isParcelled && transaction.groupId) {
      await prisma.transaction.deleteMany({
        where: {
          groupId: transaction.groupId,
          userId
        }
      });

      return NextResponse.json({
        message: 'Grupo de transações parceladas deletado com sucesso'
      });
    } else {
      // Deletar transação simples
      await prisma.transaction.delete({
        where: { id }
      });

      return NextResponse.json({
        message: 'Transação deletada com sucesso'
      });
    }

  } catch (error: any) {
    console.error('Erro ao deletar transação:', error);
    return NextResponse.json(
      { message: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Token não fornecido' || error.message === 'Token inválido' ? 401 : 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

