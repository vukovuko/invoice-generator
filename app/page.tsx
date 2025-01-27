"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import jsPDF from "jspdf";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  id: string;
  from: string;
  billTo: string;
  date: string;
  currency: string;
  items: InvoiceItem[];
}

const InvoicePreview = ({ data }: { data: InvoiceData }) => {
  return (
    <div
      className="w-full bg-white shadow-lg p-8 mb-6 border rounded"
      style={{ minHeight: "842px", maxWidth: "595px" }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#2c3e50]">INVOICE</h1>
      </div>

      {/* Invoice Info */}
      <div className="text-sm text-[#2c3e50] mb-6">
        <p>Broj fakture #: {data.id}</p>
        <p>Datum: {data.date}</p>
      </div>

      {/* From and To Sections */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-sm font-semibold text-[#34495e] mb-2">Pošaljilac:</h2>
          <div className="text-sm whitespace-pre-line text-[#2c3e50]">
            {data.from}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#34495e] mb-2">
            Primalac:
          </h2>
          <div className="text-sm whitespace-pre-line text-[#2c3e50]">
            {data.billTo}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <div className="bg-[#34495e] text-white grid grid-cols-12 gap-2 p-2 rounded-t">
          <div className="col-span-5">Opis</div>
          <div className="col-span-2 text-center">Količina</div>
          <div className="col-span-2 text-right">Cena</div>
          <div className="col-span-3 text-right">Iznos</div>
        </div>

        <div className="border-x border-b rounded-b">
          {data.items.map((item, index) => (
            <div
              key={index}
              className={`grid grid-cols-12 gap-2 p-2 text-sm ${
                index % 2 === 0 ? "bg-[#f5f7fa]" : "bg-white"
              }`}
            >
              <div className="col-span-5">{item.description}</div>
              <div className="col-span-2 text-center">{item.quantity}</div>
              <div className="col-span-2 text-right">
                {parseFloat(item.rate.toString()).toFixed(2)} {data.currency}
              </div>
              <div className="col-span-3 text-right">
                {parseFloat(item.amount.toString()).toFixed(2)} {data.currency}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-end mb-8">
        <div className="bg-[#34495e] text-white px-4 py-2 rounded">
          Ukupno:{" "}
          {data.items
            .reduce(
              (sum, item) => sum + (parseFloat(item.amount.toString()) || 0),
              0
            )
            .toFixed(2)}{" "}
          {data.currency}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 mt-16">
        Hvala vam na poslovanju!
      </div>
    </div>
  );
};

export default function InvoiceGenerator() {
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    id: "",
    from: "",
    billTo: "",
    date: "",
    currency: "RSD",
    items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
  });

  const [isDownloadable, setIsDownloadable] = useState<boolean>(false);

  useEffect(() => {
    if (isLoading) {
      const savedFrom = localStorage.getItem("invoiceFrom");
      setInvoiceData((prev) => ({
        ...prev,
        id: uuidv4(),
        date: new Date().toISOString().split("T")[0],
        from: savedFrom || "",
      }));
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    const savedFrom = localStorage.getItem("invoiceFrom");
    if (savedFrom) {
      setInvoiceData((prev) => ({ ...prev, from: savedFrom }));
    }
  }, []);

  useEffect(() => {
    if (invoiceData.from) {
      localStorage.setItem("invoiceFrom", invoiceData.from);
    }
  }, [invoiceData.from]);

  useEffect(() => {
    setIsDownloadable(
      invoiceData.from !== "" &&
        invoiceData.billTo !== "" &&
        invoiceData.items.some((item) => item.description && item.amount > 0)
    );
  }, [invoiceData]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInvoiceData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...invoiceData.items];

    // Properly handle numeric conversions
    let processedValue: string | number = value;
    if (field === "quantity" || field === "rate") {
      processedValue = parseFloat(value.toString()) || 0;
    }

    newItems[index] = {
      ...newItems[index],
      [field]: processedValue,
    };

    // Recalculate amount using parsed numbers
    if (field === "quantity" || field === "rate") {
      const quantity = parseFloat(newItems[index].quantity.toString()) || 0;
      const rate = parseFloat(newItems[index].rate.toString()) || 0;
      newItems[index].amount = Number((quantity * rate).toFixed(2));
    }

    setInvoiceData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { description: "", quantity: 1, rate: 0, amount: 0 },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateTotal = (): number => {
    return Number(
      invoiceData.items
        .reduce(
          (sum, item) => sum + (parseFloat(item.amount.toString()) || 0),
          0
        )
        .toFixed(2)
    );
  };

  const downloadInvoice = () => {
    const doc = new jsPDF();

    // Add some styling
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text("FAKTURA", 105, 20, { align: "center" });

    // Add invoice number and date
    doc.setFontSize(10);
    doc.text(`Broj fakture: ${invoiceData.id}`, 20, 40);
    doc.text(`Datum: ${invoiceData.date}`, 20, 45);

    // Add From section
    doc.setFontSize(12);
    doc.setTextColor(52, 73, 94);
    doc.text("Od:", 20, 60);
    doc.setFontSize(10);
    doc.setTextColor(44, 62, 80);
    const fromLines = doc.splitTextToSize(invoiceData.from, 80);
    doc.text(fromLines, 20, 65);

    // Add Bill To section
    doc.setFontSize(12);
    doc.setTextColor(52, 73, 94);
    doc.text("Primalac:", 120, 60);
    doc.setFontSize(10);
    doc.setTextColor(44, 62, 80);
    const billToLines = doc.splitTextToSize(invoiceData.billTo, 80);
    doc.text(billToLines, 120, 65);

    // Add table header
    const startY = 90;
    doc.setFillColor(52, 73, 94);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, startY, 170, 8, "F");
    doc.text("Opis", 25, startY + 5.5);
    doc.text("Količina", 100, startY + 5.5);
    doc.text("Cena", 120, startY + 5.5);
    doc.text("Iznos", 160, startY + 5.5);

    // Add table content
    let currentY = startY + 15;
    doc.setTextColor(44, 62, 80);

    invoiceData.items.forEach((item, index) => {
      // Draw background for alternate rows first
      if (index % 2 === 0) {
        doc.setFillColor(245, 247, 250);
        doc.rect(20, currentY - 5, 170, 10, "F");
      }

      const descriptionLines = doc.splitTextToSize(item.description, 70);
      doc.text(descriptionLines, 25, currentY);
      doc.text(parseFloat(item.quantity.toString()).toString(), 100, currentY);
      doc.text(
        `${parseFloat(item.rate.toString()).toFixed(2)} ${
          invoiceData.currency
        }`,
        120,
        currentY
      );
      doc.text(
        `${parseFloat(item.amount.toString()).toFixed(2)} ${
          invoiceData.currency
        }`,
        160,
        currentY
      );

      currentY += 10;
    });

    // Add total
    const total = calculateTotal();
    currentY += 10;
    doc.setFillColor(52, 73, 94);
    doc.rect(120, currentY - 5, 70, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(
      `Ukupno: ${total.toFixed(2)} ${invoiceData.currency}`,
      160,
      currentY,
      { align: "right" }
    );

    // Add footer
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(8);
    doc.text("Thank you for your business!", 105, 280, { align: "center" });

    // Save the PDF
    doc.save(`invoice-${invoiceData.id}.pdf`);
  };

  if (isLoading) {
    return <div>Sacekajte...</div>;
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Invoice Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Column */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Broj fakture
              </label>
              <input
                type="text"
                value={invoiceData.id}
                readOnly
                className="w-full p-2 border rounded bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Datum</label>
              <input
                type="date"
                name="date"
                value={invoiceData.date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Pošaljilac
              </label>
              <textarea
                name="from"
                value={invoiceData.from}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Primalac</label>
              <textarea
                name="billTo"
                value={invoiceData.billTo}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <select
              name="currency"
              value={invoiceData.currency}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="RSD">RSD</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Stavke</h2>

            {/* Column Headers */}
            <div className="grid grid-cols-12 gap-2 mb-2">
              <div className="col-span-5">
                <label className="text-sm font-medium text-gray-600">
                  Opis
                </label>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600">
                  Količina
                </label>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600">
                  Cena
                </label>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600">
                  Iznos
                </label>
              </div>
            </div>

            {/* Items */}
            {invoiceData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Opis stavke"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(index, "description", e.target.value)
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) =>
                      handleItemChange(index, "rate", e.target.value)
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    readOnly
                    value={item.amount}
                    className="w-full p-2 border rounded bg-gray-100"
                  />
                </div>
                <div className="col-span-1">
                  {invoiceData.items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={addItem}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Dodaj stavku
            </button>
          </div>

          <div className="text-right text-xl font-bold">
            Total: {calculateTotal()} {invoiceData.currency}
          </div>

          <div className="text-center">
            <button
              onClick={downloadInvoice}
              disabled={!isDownloadable}
              className={`px-6 py-3 rounded text-white ${
                isDownloadable
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-400"
              }`}
            >
              Download Invoice
            </button>
          </div>
        </div>

        {/* Preview Column */}
        <div className="hidden lg:block sticky top-6">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <div className="overflow-auto max-h-[calc(100vh-100px)]">
            <InvoicePreview data={invoiceData} />
          </div>
        </div>
      </div>
    </div>
  );
}
