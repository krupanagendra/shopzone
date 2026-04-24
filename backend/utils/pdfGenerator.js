const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Enhanced PDF Generator for Business Intelligence reports
 * Supports: Tables, Images (Charts), Professional layout, ₹ Currency
 */
const generateReport = async (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: "A4",
        info: { Title: "OmniKart AI Business Report", Author: "OmniKart AI Agent" }
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // ── Header ─────────────────────────────────────────────────────────────
      doc.rect(0, 0, 612, 120).fill("#131921");
      doc.fillColor("#febd69").fontSize(26).font("Helvetica-Bold").text("OmniKart AI Business Intelligence", 50, 45);
      doc.fillColor("#ffffff").fontSize(10).font("Helvetica").text("Powered by Autonomous E-Commerce Agents", 50, 75);
      doc.fillColor("#ffffff").fontSize(10).text(`Report ID: ${String(Date.now()).substring(7)}`, 450, 45, { align: "right" });
      doc.text(`Generated: ${new Date().toLocaleString()}`, 450, 60, { align: "right" });
      
      doc.moveDown(5);
      doc.fillColor("#000000");

      // ── Executive Summary ──────────────────────────────────────────────────
      doc.fontSize(18).font("Helvetica-Bold").text("Executive Summary", { underline: true });
      doc.moveDown(0.5);
      
      const colWidthBox = 160;
      const startX = 50;
      const startY = isNaN(doc.y) ? 150 : doc.y;

      // Metric Boxes
      const drawMetric = (label, value, x, y, color) => {
        if (isNaN(x) || isNaN(y)) return;
        doc.rect(x, y, colWidthBox - 10, 60).fill("#f9fafb");
        doc.fillColor(color).fontSize(10).font("Helvetica-Bold").text(label.toUpperCase(), x + 10, y + 15);
        doc.fillColor("#111827").fontSize(16).text(String(value), x + 10, y + 30);
      };

      drawMetric("Total Revenue", `₹${reportData.revenue || 0}`, startX, startY, "#059669");
      drawMetric("Total Sales", `${reportData.totalSales || 0} Units`, startX + colWidthBox, startY, "#2563eb");
      drawMetric("Total Users", `${reportData.totalUsers || 0} Members`, startX + colWidthBox * 2, startY, "#d97706");

      doc.fillColor("#000000");
      doc.y = startY + 80; // Safe advance
      doc.moveDown(2);

      // ── Charts Section ─────────────────────────────────────────────────────
      if (reportData.charts && reportData.charts.length > 0) {
        doc.fontSize(16).font("Helvetica-Bold").text("Performance Trends", { underline: true });
        doc.moveDown();
        
        for (const chart of reportData.charts) {
          if (chart.buffer) {
            doc.fontSize(12).text(chart.title || "Trend", { align: "center" });
            try {
              doc.image(chart.buffer, { fit: [500, 250], align: "center" });
            } catch (imgErr) {
              doc.text("[Chart Image Render Failed]", { align: "center" });
            }
            doc.moveDown(2);
          }
        }
      }

      // ── Tables Section (Best/Slow Sellers) ──────────────────────────────────
      if (reportData.tables && reportData.tables.length > 0) {
        for (const table of reportData.tables) {
          doc.fontSize(16).font("Helvetica-Bold").text(table.title || "Data Table", { underline: true });
          doc.moveDown();
          
          if (table.headers && table.headers.length > 0) {
            drawTable(doc, table.headers, table.rows || []);
          } else {
            doc.text("No data available for this section.");
          }
          doc.moveDown(2);
        }
      }

      // ── AI Business Insights ────────────────────────────────────────────────
      doc.addPage();
      doc.rect(0, 0, 612, 100).fill("#eff6ff");
      doc.fillColor("#1e40af").fontSize(20).font("Helvetica-Bold").text("🤖 AI Business Insights", 50, 40);
      
      doc.moveDown(4);
      doc.fillColor("#374151");

      if (reportData.suggestions && reportData.suggestions.length > 0) {
        reportData.suggestions.forEach((suggestion, index) => {
          doc.fontSize(13).font("Helvetica-Bold").text(`Actionable Insight #${index + 1}:`);
          doc.fontSize(11).font("Helvetica").text(suggestion, { indent: 20 });
          doc.moveDown();
        });
      } else {
        doc.fontSize(12).text("The AI hasn't detected any critical required actions at this time.");
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Helper to draw a simple table in PDFKit
 */
const drawTable = (doc, headers, rows) => {
  if (!headers || headers.length === 0) return;
  
  const startX = isNaN(doc.x) ? 50 : doc.x;
  const colWidth = 512 / headers.length;
  let currentY = isNaN(doc.y) ? 100 : doc.y;

  // Header Row
  doc.font("Helvetica-Bold").fontSize(10);
  doc.rect(startX, currentY, 512, 20).fill("#f3f4f6");
  doc.fillColor("#374151");
  
  headers.forEach((header, i) => {
    const xPos = startX + (i * colWidth) + 5;
    if (!isNaN(xPos) && !isNaN(currentY)) {
      doc.text(String(header).toUpperCase(), xPos, currentY + 5, { width: colWidth - 10 });
    }
  });

  currentY += 20;

  // Data Rows
  doc.font("Helvetica").fontSize(9);
  rows.forEach((row, rowIndex) => {
    if (currentY > 750) { doc.addPage(); currentY = 50; }
    
    if (rowIndex % 2 === 0) doc.rect(startX, currentY, 512, 20).fill("#ffffff");
    else doc.rect(startX, currentY, 512, 20).fill("#f9fafb");
    
    doc.fillColor("#4b5563");
    (row || []).forEach((cell, i) => {
      const xPos = startX + (i * colWidth) + 5;
      if (!isNaN(xPos) && !isNaN(currentY)) {
        doc.text(String(cell || ""), xPos, currentY + 5, { width: colWidth - 10 });
      }
    });
    currentY += 20;
  });

  doc.y = currentY;
};

/**
 * Generate PDF Receipt for an Order
 */
const generateReceipt = async (order, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4", info: { Title: "OmniKart Order Receipt" } });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Header
      doc.rect(0, 0, 612, 100).fill("#131921");
      doc.fillColor("#febd69").fontSize(26).font("Helvetica-Bold").text("OmniKart", 50, 35);
      doc.fillColor("#ffffff").fontSize(10).font("Helvetica").text("Your one-stop shopping destination", 50, 65);
      doc.fillColor("#ffffff").fontSize(20).text("RECEIPT", 450, 45, { align: "right" });

      doc.moveDown(4);
      doc.fillColor("#000000");

      // Order Info & Customer Details
      doc.fontSize(10).font("Helvetica-Bold").text("Order ID: ", 50, 130).font("Helvetica").text(String(order._id).slice(-8).toUpperCase(), 120, 130);
      doc.font("Helvetica-Bold").text("Date: ", 50, 145).font("Helvetica").text(new Date(order.createdAt).toLocaleDateString("en-IN"), 120, 145);
      doc.font("Helvetica-Bold").text("Payment: ", 50, 160).font("Helvetica").text(order.paymentMethod.toUpperCase() + (order.isPaid ? " (Paid)" : " (Pending)"), 120, 160);

      doc.font("Helvetica-Bold").text("Billed To:", 350, 130);
      doc.font("Helvetica").text(user.name, 350, 145);
      doc.text(user.email, 350, 160);
      if (order.shippingAddress) {
        doc.text(order.shippingAddress.address, 350, 175);
        doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.postalCode}`, 350, 190);
      }

      // Table Header
      const startY = 230;
      doc.rect(50, startY, 512, 25).fill("#f3f4f6");
      doc.fillColor("#374151").font("Helvetica-Bold").fontSize(10);
      doc.text("Item", 60, startY + 8);
      doc.text("Qty", 350, startY + 8, { width: 50, align: "center" });
      doc.text("Price", 410, startY + 8, { width: 100, align: "right" });

      // Table Rows
      let currentY = startY + 25;
      doc.font("Helvetica").fontSize(10);
      
      order.items.forEach((item, i) => {
        if (i % 2 === 0) doc.rect(50, currentY, 512, 25).fill("#ffffff");
        else doc.rect(50, currentY, 512, 25).fill("#f9fafb");
        
        doc.fillColor("#111827");
        doc.text(item.name.substring(0, 45) + (item.name.length > 45 ? "..." : ""), 60, currentY + 8);
        doc.text(String(item.quantity), 350, currentY + 8, { width: 50, align: "center" });
        doc.text(`Rs ${item.price.toFixed(2)}`, 410, currentY + 8, { width: 100, align: "right" });
        
        currentY += 25;
      });

      // Totals
      doc.moveDown(2);
      currentY += 20;
      doc.rect(350, currentY, 212, 85).fill("#f9fafb");
      doc.fillColor("#374151").font("Helvetica").fontSize(10);
      
      doc.text("Subtotal:", 360, currentY + 10);
      doc.text(`Rs ${order.itemsPrice.toFixed(2)}`, 450, currentY + 10, { width: 100, align: "right" });
      
      doc.text("Shipping:", 360, currentY + 30);
      doc.text(order.shippingPrice === 0 ? "FREE" : `Rs ${order.shippingPrice.toFixed(2)}`, 450, currentY + 30, { width: 100, align: "right" });
      
      doc.text("Tax (15%):", 360, currentY + 50);
      doc.text(`Rs ${order.taxPrice.toFixed(2)}`, 450, currentY + 50, { width: 100, align: "right" });

      doc.font("Helvetica-Bold").fontSize(12).fillColor("#111827");
      doc.text("Total:", 360, currentY + 70);
      doc.text(`Rs ${order.totalPrice.toFixed(2)}`, 450, currentY + 70, { width: 100, align: "right" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateReport, generateReceipt };
