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
    const { searchParams } = new URL(request.url);
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());

    // Buscar todas as transações do usuário para o ano especificado
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: new Date(`${ano}-01-01`),
          lt: new Date(`${ano + 1}-01-01`)
        }
      },
      orderBy: { date: 'desc' }
    });

    // Organizar transações por mês
    const transactionsByMonth: any = {};
    
    for (let month = 1; month <= 12; month++) {
      transactionsByMonth[month] = {
        entradas: [],
        saidas: []
      };
    }

    transactions.forEach(transaction => {
      const month = new Date(transaction.date).getMonth() + 1;
      const transactionData = {
        id: transaction.id,
        descricao: transaction.description,
        valor: transaction.value,
        categoria: transaction.category,
        data: transaction.date.toISOString().split('T')[0],
        tipo: transaction.type,
        parcelado: transaction.isParcelled,
        parcelaAtual: transaction.parcelNumber,
        totalParcelas: transaction.totalParcels,
        grupoId: transaction.groupId
      };

      if (transaction.type === 'entrada') {
        transactionsByMonth[month].entradas.push(transactionData);
      } else {
        transactionsByMonth[month].saidas.push(transactionData);
      }
    });

    const result = { [ano]: transactionsByMonth };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Erro ao buscar transações:', error);
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
    const { tipo, descricao, valor, categoria, data, parcelado, totalParcelas } = await request.json();

    // Validação básica
    if (!tipo || !descricao || !valor || !categoria || !data) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    if (parcelado && totalParcelas > 1) {
      // Criar transações parceladas
      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const baseDate = new Date(data);
      
      const transactions = [];
      for (let i = 1; i <= totalParcelas; i++) {
        const parcelDate = new Date(baseDate);
        parcelDate.setMonth(parcelDate.getMonth() + (i - 1));
        
        const transaction = await prisma.transaction.create({
          data: {
            userId,
            type: tipo,
            description: `${descricao} (${i}/${totalParcelas})`,
            value: valor,
            category: categoria,
            date: parcelDate,
            isParcelled: true,
            parcelNumber: i,
            totalParcels: totalParcelas,
            groupId
          }
        });
        
        transactions.push(transaction);
      }
      
      return NextResponse.json({
        message: 'Transações parceladas criadas com sucesso',
        transactions
      }, { status: 201 });
    } else {
      // Criar transação simples
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          type: tipo,
          description: descricao,
          value: valor,
          category: categoria,
          date: new Date(data),
          isParcelled: false
        }
      });

      return NextResponse.json({
        message: 'Transação criada com sucesso',
        transaction
      }, { status: 201 });
    }

  } catch (error: any) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json(
      { message: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Token não fornecido' || error.message === 'Token inválido' ? 401 : 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

