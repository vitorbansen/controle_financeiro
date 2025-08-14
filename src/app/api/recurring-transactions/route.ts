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

    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Mapear para o formato esperado pelo frontend
    const mappedTransactions = recurringTransactions.map(transaction => ({
      id: transaction.id,
      tipo: transaction.type,
      descricao: transaction.description,
      valor: transaction.value,
      categoria: transaction.category,
      diaVencimento: transaction.dueDay,
      ativa: transaction.isActive
    }));

    return NextResponse.json(mappedTransactions);

  } catch (error: any) {
    console.error('Erro ao buscar transações recorrentes:', error);
    return NextResponse.json(
      { message: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Token não fornecido' || error.message === 'Token inválido' ? 401 : 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = verifyToken(request);
    const { tipo, descricao, valor, categoria, diaVencimento } = await request.json();

    // Validação básica
    if (!tipo || !descricao || !valor || !categoria || !diaVencimento) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    if (diaVencimento < 1 || diaVencimento > 31) {
      return NextResponse.json(
        { message: 'Dia de vencimento deve estar entre 1 e 31' },
        { status: 400 }
      );
    }

    const recurringTransaction = await prisma.recurringTransaction.create({
      data: {
        userId,
        type: tipo,
        description: descricao,
        value: valor,
        category: categoria,
        dueDay: diaVencimento,
        isActive: true
      }
    });

    return NextResponse.json({
      message: 'Transação recorrente criada com sucesso',
      transaction: {
        id: recurringTransaction.id,
        tipo: recurringTransaction.type,
        descricao: recurringTransaction.description,
        valor: recurringTransaction.value,
        categoria: recurringTransaction.category,
        diaVencimento: recurringTransaction.dueDay,
        ativa: recurringTransaction.isActive
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar transação recorrente:', error);
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
    const { id, tipo, descricao, valor, categoria, diaVencimento, ativa } = await request.json();

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

    const updatedTransaction = await prisma.recurringTransaction.update({
      where: { id },
      data: {
        type: tipo,
        description: descricao,
        value: valor,
        category: categoria,
        dueDay: diaVencimento,
        isActive: ativa
      }
    });

    return NextResponse.json({
      message: 'Transação recorrente atualizada com sucesso',
      transaction: {
        id: updatedTransaction.id,
        tipo: updatedTransaction.type,
        descricao: updatedTransaction.description,
        valor: updatedTransaction.value,
        categoria: updatedTransaction.category,
        diaVencimento: updatedTransaction.dueDay,
        ativa: updatedTransaction.isActive
      }
    });

  } catch (error: any) {
    console.error('Erro ao atualizar transação recorrente:', error);
    return NextResponse.json(
      { message: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Token não fornecido' || error.message === 'Token inválido' ? 401 : 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}