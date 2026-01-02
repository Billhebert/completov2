import { useState } from "react";
import { AppLayout } from "../../shared/components/Layout/AppLayout";
import { Card } from "../../shared/components/UI/Card";
import { Button } from "../../shared/components/UI/Button";
import { Badge } from "../../shared/components/UI/Badge";
import * as dealService from "../services/deal.service";
import * as contactService from "../services/contact.service";
import * as companyService from "../services/company.service";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

type DataType = "contacts" | "companies" | "deals";

const ImportExportPage = () => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: number;
    messages: string[];
  } | null>(null);

  const handleExport = async (type: DataType, format: "csv" | "json") => {
    setExporting(true);
    try {
      let data: any[] = [];
      let filename = "";

      // Fetch data
      switch (type) {
        case "contacts":
          const contacts = await contactService.getContacts({ limit: 1000 });
          data = contacts.data || [];
          filename = `contacts_export_${Date.now()}.${format}`;
          break;
        case "companies":
          const companies = await companyService.getCompanies({ limit: 1000 });
          data = companies.data || [];
          filename = `companies_export_${Date.now()}.${format}`;
          break;
        case "deals":
          const deals = await dealService.getDeals({ limit: 1000 });
          data = deals.data || [];
          filename = `deals_export_${Date.now()}.${format}`;
          break;
      }

      if (format === "csv") {
        exportToCSV(data, filename);
      } else {
        exportToJSON(data, filename);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Erro ao exportar dados. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert("Nenhum dado para exportar");
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Handle nested objects and null values
            if (value === null || value === undefined) return "";
            if (typeof value === "object") return JSON.stringify(value).replace(/,/g, ";");
            // Escape quotes and wrap in quotes if contains comma
            const stringValue = String(value);
            if (stringValue.includes(",") || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(",")
      ),
    ].join("\n");

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const exportToJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleImport = async (type: DataType, file: File) => {
    setImporting(true);
    setImportResult(null);

    try {
      const content = await file.text();
      let data: any[] = [];

      // Parse file based on extension
      if (file.name.endsWith(".json")) {
        data = JSON.parse(content);
      } else if (file.name.endsWith(".csv")) {
        data = parseCSV(content);
      } else {
        throw new Error("Formato de arquivo não suportado. Use CSV ou JSON.");
      }

      // Import data
      const result = await importData(type, data);
      setImportResult(result);
    } catch (error: any) {
      setImportResult({
        success: 0,
        errors: 1,
        messages: [error.message || "Erro ao importar dados"],
      });
    } finally {
      setImporting(false);
    }
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const obj: any = {};

      headers.forEach((header, index) => {
        let value = values[index] || "";
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1).replace(/""/g, '"');
        }
        obj[header] = value;
      });

      data.push(obj);
    }

    return data;
  };

  const importData = async (
    type: DataType,
    data: any[]
  ): Promise<{ success: number; errors: number; messages: string[] }> => {
    let success = 0;
    let errors = 0;
    const messages: string[] = [];

    for (const item of data) {
      try {
        switch (type) {
          case "contacts":
            await contactService.createContact(item);
            break;
          case "companies":
            await companyService.createCompany(item);
            break;
          case "deals":
            await dealService.createDeal(item);
            break;
        }
        success++;
      } catch (error: any) {
        errors++;
        messages.push(
          `Erro ao importar ${item.name || item.title || "item"}: ${
            error.message || "Erro desconhecido"
          }`
        );
      }
    }

    return { success, errors, messages: messages.slice(0, 10) }; // Limit messages to 10
  };

  const triggerFileInput = (type: DataType) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.json";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        handleImport(type, file);
      }
    };
    input.click();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Importação & Exportação</h1>
          <p className="text-gray-600 mt-1">
            Importe e exporte dados do CRM em formato CSV ou JSON
          </p>
        </div>

        {/* Import Result */}
        {importResult && (
          <Card>
            <div className="flex items-start gap-4">
              {importResult.errors === 0 ? (
                <CheckCircleIcon className="h-8 w-8 text-green-600 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Resultado da Importação
                </h3>
                <div className="flex items-center gap-4 mb-3">
                  <Badge variant="success">
                    {importResult.success} importados com sucesso
                  </Badge>
                  {importResult.errors > 0 && (
                    <Badge variant="danger">{importResult.errors} erros</Badge>
                  )}
                </div>
                {importResult.messages.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-yellow-900 mb-2">Erros:</p>
                    <ul className="space-y-1">
                      {importResult.messages.map((msg, idx) => (
                        <li key={idx} className="text-sm text-yellow-800">
                          • {msg}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Export Section */}
        <Card title="Exportar Dados" subtitle="Baixe seus dados em CSV ou JSON">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contacts Export */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DocumentArrowDownIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Contatos</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Exporte todos os contatos com informações completas
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleExport("contacts", "csv")}
                  disabled={exporting}
                  className="flex-1"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleExport("contacts", "json")}
                  disabled={exporting}
                  className="flex-1"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>

            {/* Companies Export */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DocumentArrowDownIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Empresas</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Exporte todas as empresas cadastradas
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleExport("companies", "csv")}
                  disabled={exporting}
                  className="flex-1"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleExport("companies", "json")}
                  disabled={exporting}
                  className="flex-1"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>

            {/* Deals Export */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DocumentArrowDownIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Deals</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Exporte todos os deals do pipeline
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleExport("deals", "csv")}
                  disabled={exporting}
                  className="flex-1"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleExport("deals", "json")}
                  disabled={exporting}
                  className="flex-1"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Import Section */}
        <Card
          title="Importar Dados"
          subtitle="Carregue dados de arquivos CSV ou JSON"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contacts Import */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DocumentArrowUpIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Contatos</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Importe contatos de arquivo CSV ou JSON
              </p>
              <Button
                onClick={() => triggerFileInput("contacts")}
                disabled={importing}
                className="w-full"
              >
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                {importing ? "Importando..." : "Selecionar Arquivo"}
              </Button>
            </div>

            {/* Companies Import */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DocumentArrowUpIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Empresas</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Importe empresas de arquivo CSV ou JSON
              </p>
              <Button
                onClick={() => triggerFileInput("companies")}
                disabled={importing}
                className="w-full"
              >
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                {importing ? "Importando..." : "Selecionar Arquivo"}
              </Button>
            </div>

            {/* Deals Import */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DocumentArrowUpIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Deals</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Importe deals de arquivo CSV ou JSON
              </p>
              <Button
                onClick={() => triggerFileInput("deals")}
                disabled={importing}
                className="w-full"
              >
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                {importing ? "Importando..." : "Selecionar Arquivo"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card title="Instruções">
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Formato CSV:</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>A primeira linha deve conter os nomes das colunas</li>
                <li>
                  Separe os valores com vírgula (,) e use aspas duplas para valores que
                  contenham vírgulas
                </li>
                <li>Codificação UTF-8 recomendada</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Formato JSON:</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Deve ser um array de objetos válido</li>
                <li>Cada objeto representa um registro (contato, empresa ou deal)</li>
                <li>Use a mesma estrutura dos dados exportados</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-blue-900 mb-1">💡 Dica:</p>
              <p className="text-blue-800">
                Exporte primeiro para ver a estrutura esperada dos dados antes de
                importar novos registros.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ImportExportPage;
