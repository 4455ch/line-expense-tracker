import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lineUserId = searchParams.get('lineUserId');
    const monthQuery = searchParams.get('month'); // Format: YYYY-MM
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '20', 10)));

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'Missing lineUserId parameter' },
        { status: 400 }
      );
    }

    // 1. Find user by lineUserId
    const user = await prisma.user.findUnique({
      where: { lineUserId },
    });

    if (!user) {
      return NextResponse.json(
        {
          user: null,
          summary: { totalIncome: 0, totalExpense: 0, netBalance: 0 },
          categoryBreakdown: [],
          dailyTrend: [],
          transactions: [],
          pagination: { page, limit, totalPages: 0, totalItems: 0 },
        },
        { status: 200 }
      );
    }

    // 2. Compute date range for month
    let startDate: Date;
    let endDate: Date;

    if (monthQuery && /^\d{4}-\d{2}$/.test(monthQuery)) {
      const parsedDate = parseISO(`${monthQuery}-01`);
      if (isValid(parsedDate)) {
        startDate = startOfMonth(parsedDate);
        endDate = endOfMonth(parsedDate);
      } else {
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
      }
    } else {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    }

    // 3. Query monthly transactions for summary & charts
    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        transactionDate: 'desc',
      },
    });

    // 4. Calculate aggregates
    let totalIncome = 0;
    let totalExpense = 0;
    const expenseByCategory: Record<string, number> = {};
    const incomeByCategory: Record<string, number> = {};
    const dailyMap: Record<string, { date: string; income: number; expense: number }> = {};

    monthlyTransactions.forEach((tx) => {
      const amt = Number(tx.amount);
      const dateKey = tx.transactionDate.toISOString().slice(0, 10);

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, income: 0, expense: 0 };
      }

      if (tx.type === 'INCOME') {
        totalIncome += amt;
        incomeByCategory[tx.categoryName] =
          (incomeByCategory[tx.categoryName] || 0) + amt;
        dailyMap[dateKey].income += amt;
      } else {
        totalExpense += amt;
        expenseByCategory[tx.categoryName] =
          (expenseByCategory[tx.categoryName] || 0) + amt;
        dailyMap[dateKey].expense += amt;
      }
    });

    const netBalance = totalIncome - totalExpense;

    // Format category breakdown for Pie Chart
    const categoryColors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
      '#EC4899', '#14B8A6', '#6366F1', '#84CC16', '#F97316'
    ];

    const categoryBreakdown = Object.entries(expenseByCategory).map(([name, value], idx) => ({
      name,
      value: Math.round(value * 100) / 100,
      percentage: totalExpense > 0 ? Math.round((value / totalExpense) * 100) : 0,
      color: categoryColors[idx % categoryColors.length],
    }));

    // Format daily trend for Bar Chart (sorted chronologically)
    const dailyTrend = Object.values(dailyMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // 5. Query paginated transactions
    const totalItems = await prisma.transaction.count({
      where: {
        userId: user.id,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginatedTransactions = monthlyTransactions.slice(
      (page - 1) * limit,
      page * limit
    );

    return NextResponse.json({
      user: {
        id: user.id,
        lineUserId: user.lineUserId,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
      },
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netBalance: Math.round(netBalance * 100) / 100,
      },
      categoryBreakdown,
      dailyTrend,
      transactions: paginatedTransactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        categoryName: tx.categoryName,
        note: tx.note,
        transactionDate: tx.transactionDate.toISOString(),
        createdAt: tx.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
      },
    });
  } catch (error) {
    console.error('[API /transactions GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lineUserId, type, amount, categoryName, note, transactionDate } = body;

    if (!lineUserId || !type || !amount || !categoryName) {
      return NextResponse.json(
        { error: 'Missing required transaction fields' },
        { status: 400 }
      );
    }

    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return NextResponse.json(
        { error: 'Type must be INCOME or EXPENSE' },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { lineUserId },
      update: {},
      create: {
        lineUserId,
        displayName: 'User',
      },
    });

    const newTx = await prisma.transaction.create({
      data: {
        userId: user.id,
        type,
        amount: numAmount,
        categoryName: categoryName.trim(),
        note: note ? note.trim() : null,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      },
    });

    return NextResponse.json(
      {
        message: 'Transaction created successfully',
        transaction: {
          ...newTx,
          amount: Number(newTx.amount),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /transactions POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const lineUserId = searchParams.get('lineUserId');

    if (!id || !lineUserId) {
      return NextResponse.json(
        { error: 'Missing id or lineUserId' },
        { status: 400 }
      );
    }

    // Verify ownership
    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!tx || tx.user.lineUserId !== lineUserId) {
      return NextResponse.json(
        { error: 'Transaction not found or unauthorized' },
        { status: 404 }
      );
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[API /transactions DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
