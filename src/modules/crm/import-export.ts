// src/modules/crm/import-export.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../core/middleware';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import * as XLSX from 'xlsx';

export function setupImportExportRoutes(router: Router, prisma: PrismaClient) {
  
  // Import contacts from CSV
  router.post('/contacts/import/csv',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req, res, next) => {
      try {
        const { csvData, mapping, options } = req.body;
        
        // Parse CSV
        const records = parse(csvData, {
          columns: true,
          skip_empty_lines: true,
        });

        const results = {
          success: 0,
          failed: 0,
          duplicates: 0,
          errors: [] as any[],
        };

        for (const record of records) {
          try {
            // Map CSV columns to contact fields
            const contactData: any = {
              companyId: req.companyId!,
            };

            for (const [csvField, dbField] of Object.entries(mapping)) {
              if (record[csvField]) {
                contactData[dbField] = record[csvField];
              }
            }

            // Check for duplicates
            if (options?.skipDuplicates && contactData.email) {
              const existing = await prisma.contact.findFirst({
                where: {
                  companyId: req.companyId!,
                  email: contactData.email,
                },
              });

              if (existing) {
                results.duplicates++;
                continue;
              }
            }

            // Create contact
            await prisma.contact.create({ data: contactData });
            results.success++;

          } catch (error: any) {
            results.failed++;
            results.errors.push({
              record,
              error: error.message,
            });
          }
        }

        res.json({ success: true, data: results });
      } catch (error) {
        next(error);
      }
    }
  );

  // Import from Excel
  router.post('/contacts/import/excel',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req, res, next) => {
      try {
        const { base64Data, mapping, sheetName, options } = req.body;
        
        // Parse Excel
        const buffer = Buffer.from(base64Data, 'base64');
        const workbook = XLSX.read(buffer);
        const sheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];
        const records = XLSX.utils.sheet_to_json(sheet);

        const results = {
          success: 0,
          failed: 0,
          duplicates: 0,
          errors: [] as any[],
        };

        for (const record of records) {
          try {
            const contactData: any = {
              companyId: req.companyId!,
            };

            for (const [excelField, dbField] of Object.entries(mapping)) {
              if ((record as any)[excelField]) {
                contactData[dbField] = (record as any)[excelField];
              }
            }

            // Check duplicates
            if (options?.skipDuplicates && contactData.email) {
              const existing = await prisma.contact.findFirst({
                where: {
                  companyId: req.companyId!,
                  email: contactData.email,
                },
              });

              if (existing) {
                results.duplicates++;
                continue;
              }
            }

            await prisma.contact.create({ data: contactData });
            results.success++;

          } catch (error: any) {
            results.failed++;
            results.errors.push({
              record,
              error: error.message,
            });
          }
        }

        res.json({ success: true, data: results });
      } catch (error) {
        next(error);
      }
    }
  );

  // Export contacts to CSV
  router.get('/contacts/export/csv',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const { fields, filters } = req.query;
        
        const where: any = { companyId: req.companyId! };
        
        if (filters) {
          const parsedFilters = JSON.parse(filters as string);
          Object.assign(where, parsedFilters);
        }

        const contacts = await prisma.contact.findMany({ where });

        // Select fields to export
        const exportFields = fields ? (fields as string).split(',') : [
          'name', 'email', 'phone', 'companyName', 'position', 
          'leadStatus', 'leadScore', 'createdAt'
        ];

        const csvData = stringify(
          contacts.map(contact => {
            const row: any = {};
            exportFields.forEach(field => {
              row[field] = (contact as any)[field] || '';
            });
            return row;
          }),
          {
            header: true,
            columns: exportFields,
          }
        );

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename=contacts.csv');
        res.send(csvData);
      } catch (error) {
        next(error);
      }
    }
  );

  // Export to Excel
  router.get('/contacts/export/excel',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const { fields, filters } = req.query;
        
        const where: any = { companyId: req.companyId! };
        
        if (filters) {
          const parsedFilters = JSON.parse(filters as string);
          Object.assign(where, parsedFilters);
        }

        const contacts = await prisma.contact.findMany({ where });

        const exportFields = fields ? (fields as string).split(',') : [
          'name', 'email', 'phone', 'companyName', 'position', 
          'leadStatus', 'leadScore', 'createdAt'
        ];

        const data = contacts.map(contact => {
          const row: any = {};
          exportFields.forEach(field => {
            row[field] = (contact as any)[field] || '';
          });
          return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.header('Content-Disposition', 'attachment; filename=contacts.xlsx');
        res.send(buffer);
      } catch (error) {
        next(error);
      }
    }
  );

  // Export to vCard
  router.get('/contacts/export/vcard',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const contacts = await prisma.contact.findMany({
          where: { companyId: req.companyId! },
        });

        const vCards = contacts.map(contact => {
          return [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${contact.name}`,
            contact.email ? `EMAIL:${contact.email}` : '',
            contact.phone ? `TEL:${contact.phone}` : '',
            contact.companyName ? `ORG:${contact.companyName}` : '',
            contact.position ? `TITLE:${contact.position}` : '',
            'END:VCARD',
          ].filter(Boolean).join('\n');
        }).join('\n\n');

        res.header('Content-Type', 'text/vcard');
        res.header('Content-Disposition', 'attachment; filename=contacts.vcf');
        res.send(vCards);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get import template
  router.get('/contacts/import/template',
    authenticate,
    tenantIsolation,
    async (req, res, next) => {
      try {
        const { format = 'csv' } = req.query;

        const headers = [
          'name',
          'email',
          'phone',
          'companyName',
          'position',
          'website',
          'leadStatus',
          'tags',
        ];

        if (format === 'csv') {
          const csvData = stringify([headers], { header: false });
          res.header('Content-Type', 'text/csv');
          res.header('Content-Disposition', 'attachment; filename=contacts_template.csv');
          res.send(csvData);
        } else if (format === 'excel') {
          const worksheet = XLSX.utils.aoa_to_sheet([headers]);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
          const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
          
          res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.header('Content-Disposition', 'attachment; filename=contacts_template.xlsx');
          res.send(buffer);
        }
      } catch (error) {
        next(error);
      }
    }
  );
}
