// src/modules/erp/financial-reports.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../core/middleware';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';

export function setupFinancialReportsRoutes(router: Router, prisma: PrismaClient) {
  
  // ===== PROFIT & LOSS STATEMENT =====

  // Get P&L report
  router.get('/financial/profit-loss',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_READ),
    async (req, res, next) => {
      try {
        const { startDate, endDate, format = 'json' } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate as string) : new Date();

        // Revenue (paid invoices)
        const invoices = await prisma.invoice.findMany({
          where: {
            companyId: req.companyId!,
            status: 'paid',
            paidDate: {
              gte: start,
              lte: end,
            },
          },
        });

        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

        // Cost of Goods Sold (expenses)
        const expenses = await prisma.expense.findMany({
          where: {
            companyId: req.companyId!,
            date: {
              gte: start,
              lte: end,
            },
          },
        });

        const expensesByCategory = expenses.reduce((acc, exp) => {
          if (!acc[exp.category]) acc[exp.category] = 0;
          acc[exp.category] += exp.amount;
          return acc;
        }, {} as Record<string, number>);

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Calculate metrics
        const grossProfit = totalRevenue - totalExpenses;
        const netProfit = grossProfit; // Simplified (add taxes, interest, etc)
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        const report = {
          period: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
          revenue: {
            total: totalRevenue,
            invoices: invoices.length,
          },
          expenses: {
            total: totalExpenses,
            byCategory: expensesByCategory,
            count: expenses.length,
          },
          profit: {
            gross: grossProfit,
            net: netProfit,
            margin: profitMargin,
          },
        };

        if (format === 'pdf') {
          return generatePLPDF(res, report);
        }

        if (format === 'excel') {
          return generatePLExcel(res, report);
        }

        res.json({ success: true, data: report });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== BALANCE SHEET =====

  // Get balance sheet
  router.get('/financial/balance-sheet',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_READ),
    async (req, res, next) => {
      try {
        const { date = new Date().toISOString(), format = 'json' } = req.query;
        const asOfDate = new Date(date as string);

        // Assets
        const unpaidInvoices = await prisma.invoice.findMany({
          where: {
            companyId: req.companyId!,
            status: { not: 'paid' },
            createdAt: { lte: asOfDate },
          },
        });

        const accountsReceivable = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);

        const stockValue = await prisma.product.aggregate({
          where: { companyId: req.companyId! },
          _sum: { price: true, stock: true },
        });

        const inventory = (stockValue._sum.price || 0) * (stockValue._sum.stock || 0);

        const totalAssets = accountsReceivable + inventory;

        // Liabilities
        const unpaidExpenses = await prisma.expense.findMany({
          where: {
            companyId: req.companyId!,
            status: 'pending',
            date: { lte: asOfDate },
          },
        });

        const accountsPayable = unpaidExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        const totalLiabilities = accountsPayable;

        // Equity
        const allInvoices = await prisma.invoice.findMany({
          where: {
            companyId: req.companyId!,
            status: 'paid',
            paidDate: { lte: asOfDate },
          },
        });

        const allExpenses = await prisma.expense.findMany({
          where: {
            companyId: req.companyId!,
            date: { lte: asOfDate },
          },
        });

        const retainedEarnings = 
          allInvoices.reduce((sum, inv) => sum + inv.total, 0) -
          allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        const totalEquity = retainedEarnings;

        const report = {
          asOfDate: asOfDate.toISOString(),
          assets: {
            current: {
              accountsReceivable,
              inventory,
            },
            total: totalAssets,
          },
          liabilities: {
            current: {
              accountsPayable,
            },
            total: totalLiabilities,
          },
          equity: {
            retainedEarnings,
            total: totalEquity,
          },
          balanceCheck: totalAssets === (totalLiabilities + totalEquity),
        };

        if (format === 'pdf') {
          return generateBalanceSheetPDF(res, report);
        }

        if (format === 'excel') {
          return generateBalanceSheetExcel(res, report);
        }

        res.json({ success: true, data: report });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== CASH FLOW STATEMENT =====

  // Get cash flow report
  router.get('/financial/cash-flow',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_READ),
    async (req, res, next) => {
      try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate as string) : new Date();

        // Operating activities
        const paidInvoices = await prisma.invoice.findMany({
          where: {
            companyId: req.companyId!,
            status: 'paid',
            paidDate: {
              gte: start,
              lte: end,
            },
          },
        });

        const cashFromOperations = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

        const paidExpenses = await prisma.expense.findMany({
          where: {
            companyId: req.companyId!,
            status: 'paid',
            date: {
              gte: start,
              lte: end,
            },
          },
        });

        const cashOutOperations = paidExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        const netOperatingCash = cashFromOperations - cashOutOperations;

        const report = {
          period: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
          operating: {
            cashIn: cashFromOperations,
            cashOut: cashOutOperations,
            net: netOperatingCash,
          },
          investing: {
            cashIn: 0, // Add investment tracking
            cashOut: 0,
            net: 0,
          },
          financing: {
            cashIn: 0, // Add financing tracking
            cashOut: 0,
            net: 0,
          },
          netCashFlow: netOperatingCash,
        };

        res.json({ success: true, data: report });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== TAX REPORT =====

  // Get tax report
  router.get('/financial/tax-report',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_READ),
    async (req, res, next) => {
      try {
        const { year, quarter } = req.query;

        let startDate: Date;
        let endDate: Date;

        if (quarter) {
          const y = parseInt(year as string);
          const q = parseInt(quarter as string);
          startDate = new Date(y, (q - 1) * 3, 1);
          endDate = new Date(y, q * 3, 0, 23, 59, 59);
        } else {
          const y = year ? parseInt(year as string) : new Date().getFullYear();
          startDate = new Date(y, 0, 1);
          endDate = new Date(y, 11, 31, 23, 59, 59);
        }

        // Get all invoices
        const invoices = await prisma.invoice.findMany({
          where: {
            companyId: req.companyId!,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        const totalRevenue = invoices
          .filter(i => i.status === 'paid')
          .reduce((sum, inv) => sum + inv.total, 0);

        const totalTaxCollected = invoices
          .filter(i => i.status === 'paid')
          .reduce((sum, inv) => sum + (inv.total - inv.subtotal), 0); // Tax is difference

        // Get expenses
        const expenses = await prisma.expense.findMany({
          where: {
            companyId: req.companyId!,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        const deductibleExpenses = expenses
          .filter(e => e.category !== 'personal') // Filter non-deductible
          .reduce((sum, exp) => sum + exp.amount, 0);

        const taxableIncome = totalRevenue - deductibleExpenses;
        const estimatedTax = taxableIncome * 0.21; // 21% corporate tax rate (example)

        const report = {
          period: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            year: startDate.getFullYear(),
            quarter: quarter ? parseInt(quarter as string) : undefined,
          },
          revenue: totalRevenue,
          deductions: deductibleExpenses,
          taxableIncome,
          taxCollected: totalTaxCollected,
          estimatedTaxLiability: estimatedTax,
          taxOwed: Math.max(0, estimatedTax - totalTaxCollected),
        };

        res.json({ success: true, data: report });
      } catch (error) {
        next(error);
      }
    }
  );
}

// PDF generation helpers
function generatePLPDF(res: any, report: any) {
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=profit-loss.pdf');
  doc.pipe(res);

  doc.fontSize(20).text('Profit & Loss Statement', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Revenue');
  doc.fontSize(12).text(`Total Revenue: $${report.revenue.total.toFixed(2)}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Expenses');
  doc.fontSize(12).text(`Total Expenses: $${report.expenses.total.toFixed(2)}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Profit');
  doc.fontSize(12).text(`Net Profit: $${report.profit.net.toFixed(2)}`);
  doc.text(`Profit Margin: ${report.profit.margin.toFixed(2)}%`);

  doc.end();
}

function generateBalanceSheetPDF(res: any, report: any) {
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=balance-sheet.pdf');
  doc.pipe(res);

  doc.fontSize(20).text('Balance Sheet', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`As of: ${new Date(report.asOfDate).toLocaleDateString()}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Assets');
  doc.fontSize(12).text(`Total: $${report.assets.total.toFixed(2)}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Liabilities');
  doc.fontSize(12).text(`Total: $${report.liabilities.total.toFixed(2)}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Equity');
  doc.fontSize(12).text(`Total: $${report.equity.total.toFixed(2)}`);

  doc.end();
}

function generatePLExcel(res: any, report: any) {
  const data = [
    ['Profit & Loss Statement'],
    ['Period', `${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}`],
    [],
    ['Revenue', report.revenue.total],
    ['Expenses', report.expenses.total],
    ['Net Profit', report.profit.net],
    ['Profit Margin %', report.profit.margin],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'P&L');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=profit-loss.xlsx');
  res.send(buffer);
}

function generateBalanceSheetExcel(res: any, report: any) {
  const data = [
    ['Balance Sheet'],
    ['As of', new Date(report.asOfDate).toLocaleDateString()],
    [],
    ['ASSETS'],
    ['Accounts Receivable', report.assets.current.accountsReceivable],
    ['Inventory', report.assets.current.inventory],
    ['Total Assets', report.assets.total],
    [],
    ['LIABILITIES'],
    ['Accounts Payable', report.liabilities.current.accountsPayable],
    ['Total Liabilities', report.liabilities.total],
    [],
    ['EQUITY'],
    ['Retained Earnings', report.equity.retainedEarnings],
    ['Total Equity', report.equity.total],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Balance Sheet');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=balance-sheet.xlsx');
  res.send(buffer);
}
