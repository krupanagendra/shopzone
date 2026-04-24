const brandColor = "#febd69";
const brandName = "OmniKart";
const brandTagline = "Powered by Autonomous AI Agents";

// ── Shared HTML Components ──────────────────────────────────────────────────

const generateHeader = (title) => `
  <div style="background: linear-gradient(135deg, #131921 0%, #232f3e 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #febd69; letter-spacing: -0.5px;">🏠 ${brandName}</h1>
    <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.7;">${brandTagline}</p>
    <p style="margin: 12px 0 0; font-size: 18px; font-weight: 600; opacity: 0.95;">${title}</p>
  </div>
`;

const generateFooter = () => `
  <div style="background: #131921; padding: 24px; text-align: center; border-radius: 0 0 8px 8px;">
    <p style="color: #febd69; font-size: 14px; font-weight: 600; margin: 0 0 6px;">Thank you for choosing ${brandName}! 🙏</p>
    <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ${brandName} · Autonomous E-Commerce System</p>
  </div>
`;

// ── Order Status Email (Shipped / Delivered) ────────────────────────────────

const generateOrderEmailHtml = (order, type) => {
  const isShipped = type === "shipped";
  const title = isShipped ? "Your Order is on the Way! 🚚" : "Your Order has been Delivered! ✅";
  const trackingLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/order/${order._id}`;

  const userName = order.user?.name || "Customer";
  
  // Logic for expected times
  const expectedDate = new Date();
  if (isShipped) expectedDate.setDate(expectedDate.getDate() + 3); // 3 days for delivery
  else expectedDate.setDate(expectedDate.getDate()); // delivered today

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding: 12px 10px; border-bottom: 1px solid #eaeaea; color: #333;">${item.name || 'Product'}</td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #eaeaea; text-align: center; color: #555;">${item.quantity || 1}</td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #eaeaea; text-align: right; color: #333; font-weight: 600;">₹${(item.price || 0).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden;">
        ${generateHeader(title)}
        <div style="padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${userName},</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            ${isShipped ? "Great news! Your items have shipped and are heading your way. The AI Order Agent has automatically updated your order status." : "Your order has been successfully delivered! Our AI system has verified the delivery completion."}
          </p>
          
          <div style="background-color: #f0fdf4; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #bbf7d0;">
             <p style="margin: 0; color: #166534; font-size: 14px;">
               🕒 <strong>Expected ${isShipped ? "Delivery" : "Feedback Request"}:</strong> ${expectedDate.toDateString()}
             </p>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #111; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Order Summary (#${String(order._id).substring(18)})</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eaeaea; color: #888; font-size: 12px;">ITEM</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #eaeaea; color: #888; font-size: 12px;">QTY</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eaeaea; color: #888; font-size: 12px;">PRICE</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div style="text-align: right; font-size: 18px; font-weight: 700; color: #111; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #ccc;">
              Total: ₹${(order.totalPrice || 0).toLocaleString('en-IN')}
            </div>
          </div>

          ${isShipped ? `
          <div style="text-align: center; margin: 30px 0 20px;">
            <a href="${trackingLink}" style="background-color: #febd69; color: #000; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">
              📦 Track Your Order Live
            </a>
          </div>
          ` : `
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              ⭐ <strong>How was your experience?</strong> Please take a second to rate your items. Your feedback helps our AI system improve recommendations!
            </p>
          </div>
          `}
        </div>
        ${generateFooter()}
      </div>
    </div>
  `;
};

// ── Admin Query Email (Dynamic Tables) ──────────────────────────────────────

const generateAdminQueryEmailHtml = (query, resultData) => {
  let tableHtml = "";
  if (resultData.table) {
    const headers = resultData.table.headers.map(h => `<th style="padding: 10px; text-align: left; border-bottom: 2px solid #eaeaea; color: #888; font-size: 12px;">${h.toUpperCase()}</th>`).join('');
    const rows = resultData.table.rows.map(row => `
      <tr>
        ${row.map(cell => `<td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; color: #444;">${cell}</td>`).join('')}
      </tr>
    `).join('');
    
    tableHtml = `
      <div style="margin: 20px 0; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; min-width: 400px;">
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden;">
        ${generateHeader("AI Support Assistant 🤖")}
        <div style="padding: 35px;">
          <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #94a3b8; margin-bottom: 25px;">
            <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Your Query</p>
            <p style="margin: 5px 0 0; font-size: 16px; font-weight: 500; color: #1e293b;">"${query}"</p>
          </div>

          <div style="color: #334155; font-size: 15px; line-height: 1.6;">
            <p style="font-weight: 600; font-size: 18px; color: #1e40af; margin-bottom: 15px;">Automated Analysis:</p>
            <p>${resultData.summary || "Analysis complete. See data below."}</p>
            ${tableHtml}
            ${resultData.insights ? `
              <div style="background: #f0fdfa; border: 1px solid #5eead4; border-radius: 8px; padding: 15px; margin-top: 25px;">
                <h4 style="margin: 0 0 10px; color: #0f766e; font-size: 14px;">💡 AI Insights</h4>
                <ul style="margin: 0; padding-left: 20px; color: #134e4a; font-size: 13px;">
                  ${resultData.insights.map(i => `<li>${i}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
        ${generateFooter()}
      </div>
    </div>
  `;
};

// ── Generic Notification Email ──────────────────────────────────────────────

const generateGenericEmailHtml = (subject, details) => `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden;">
        ${generateHeader(subject)}
        <div style="padding: 30px; color: #444; font-size: 15px; line-height: 1.6;">
          <p>${details}</p>
          <div style="background: #eff6ff; border-left: 4px solid ${brandColor}; padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #1e40af;">
              🤖 <strong>Automated by ${brandName}</strong> — This notification was generated by our autonomous AI agent system.
            </p>
          </div>
        </div>
        ${generateFooter()}
      </div>
    </div>
`;

// ── Daily Report Email ──────────────────────────────────────────────────────

const generateDailyReportEmailHtml = (reportData = {}) => {
  const revenue    = (reportData.revenue    || 0).toLocaleString('en-IN');
  const orders     = reportData.totalSales  || 0;
  const users      = reportData.totalUsers  || 0;
  const aov        = orders > 0 ? Math.round((reportData.revenue || 0) / orders).toLocaleString('en-IN') : '0';
  const suggestions = reportData.suggestions || ['Monitor inventory.', 'Maintain current pacing.'];

  // Build chart URL with real daily order data (last 7 days labels)
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const chartData = reportData.dailySales || [0,0,0,0,0,0,0];
  const chartUrl = `https://quickchart.io/chart?w=540&h=220&c=${encodeURIComponent(JSON.stringify({
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: 'Orders',
        data: chartData,
        backgroundColor: 'rgba(254,189,105,0.85)',
        borderColor: '#febd69',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  }))}`;

  const insightsHtml = suggestions
    .map((s, i) => `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#374151;line-height:1.5;"><span style="font-weight:700;color:#1e40af;margin-right:8px;">${i + 1}.</span>${s}</td></tr>`)
    .join('');

  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Daily Report — OmniKart</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.09);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#131921 0%,#232f3e 100%);padding:30px 40px;text-align:center;">
            <p style="margin:0;font-size:30px;font-weight:900;color:#febd69;letter-spacing:-0.5px;">🏠 OmniKart</p>
            <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">Autonomous AI — Daily Business Intelligence</p>
          </td>
        </tr>

        <!-- DATE BANNER -->
        <tr>
          <td style="background:#1e40af;padding:12px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:14px;font-weight:700;">📊 Daily Report &mdash; ${today}</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:32px 40px 0;">
            <p style="margin:0 0 6px;font-size:21px;font-weight:700;color:#1e293b;">Hello, Admin! 👋</p>
            <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">Here's your automated daily business intelligence summary. The full PDF report with detailed analytics is attached below.</p>

            <!-- METRIC CARDS (table-based for email client compat) -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td width="31%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:1px;">Revenue (7d)</p>
                  <p style="margin:8px 0 0;font-size:22px;font-weight:900;color:#111827;">&#8377;${revenue}</p>
                </td>
                <td width="4%"></td>
                <td width="31%" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:1px;">Orders (7d)</p>
                  <p style="margin:8px 0 0;font-size:22px;font-weight:900;color:#111827;">${orders}</p>
                </td>
                <td width="4%"></td>
                <td width="31%" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:1px;">Total Users</p>
                  <p style="margin:8px 0 0;font-size:22px;font-weight:900;color:#111827;">${users}</p>
                </td>
              </tr>
            </table>

            <!-- CHART -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center;">
                  <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#1e293b;">📈 Weekly Orders Trend</p>
                  <img src="${chartUrl}" alt="Weekly Orders Chart" width="520" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:0 auto;" />
                </td>
              </tr>
            </table>

            <!-- AI INSIGHTS -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="background:#1e40af;padding:14px 18px;">
                  <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;">🧠 AI Strategic Insights</p>
                </td>
              </tr>
              ${insightsHtml}
            </table>

            <!-- NOTE -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
              <tr>
                <td style="background:#fffbeb;border-left:4px solid #febd69;border-radius:0 8px 8px 0;padding:14px 16px;">
                  <p style="margin:0;font-size:13px;color:#92400e;">🤖 <strong>Autonomous AI</strong> &mdash; This report was generated and dispatched automatically by the OmniKart AI agent pipeline.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#131921;padding:28px 40px;text-align:center;margin-top:32px;">
            <p style="margin:0 0 4px;color:#febd69;font-size:15px;font-weight:700;">OmniKart AI Reporting Engine 🤖</p>
            <p style="margin:0;color:#475569;font-size:12px;">&copy; 2026 OmniKart &middot; Final Year Academic Project &middot; Autonomous E-Commerce System</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// ── Pricing Agent Report Email ──────────────────────────────────────────────

const generatePricingReportEmailHtml = (priceChanges) => {
  const changesHtml = (priceChanges || []).map(c => `<li style="padding: 4px 0; color: #333;">${c}</li>`).join('');
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden;">
        ${generateHeader("AI Pricing Agent Report 📊")}
        <div style="padding: 30px;">
          <p style="color: #555; font-size: 15px;">The AI Pricing Agent has completed its analysis and made <strong>${priceChanges.length}</strong> price adjustments:</p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
              ${changesHtml}
            </ul>
          </div>
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; border-radius: 0 6px 6px 0;">
            <p style="margin: 0; font-size: 13px; color: #166534;">
              ✅ All changes are within configured min/max price bounds.
            </p>
          </div>
        </div>
        ${generateFooter()}
      </div>
    </div>
  `;
};

// ── Product Suggestion Email (Dynamic for Admin) ───────────────────────────

const generateSuggestionEmailHtml = (suggestion) => {
  const dateStr = new Date(suggestion.createdAt || Date.now()).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e2e8f0;">
        ${generateHeader("🚀 New Product Suggestion Received")}
        <div style="padding: 40px;">
          <h2 style="color: #1a202c; margin-top: 0; font-size: 22px; border-bottom: 2px solid #ebf4ff; padding-bottom: 12px;">Suggestion Details</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
            <tr>
              <td style="padding: 12px 15px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; color: #4a5568; width: 40%;">Product Name</td>
              <td style="padding: 12px 15px; border: 1px solid #e2e8f0; color: #2d3748;">${suggestion.productName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 15px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; color: #4a5568;">Category</td>
              <td style="padding: 12px 15px; border: 1px solid #e2e8f0; color: #2d3748;">${suggestion.category}</td>
            </tr>
            <tr>
              <td style="padding: 12px 15px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; color: #4a5568;">Expected Price</td>
              <td style="padding: 12px 15px; border: 1px solid #e2e8f0; color: #c53030; font-weight: 700; font-size: 18px;">₹${Number(suggestion.expectedPrice).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 12px 15px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; color: #4a5568;">Customer Email</td>
              <td style="padding: 12px 15px; border: 1px solid #e2e8f0; color: #3182ce;">${suggestion.customerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 12px 15px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; color: #4a5568;">Submission Date</td>
              <td style="padding: 12px 15px; border: 1px solid #e2e8f0; color: #718096; font-size: 13px;">${dateStr}</td>
            </tr>
          </table>

          <div style="background-color: #fffaf0; border-left: 5px solid #ed8936; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
            <p style="margin: 0 0 10px; font-weight: 700; color: #9c4221; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Product Description</p>
            <p style="margin: 0; color: #7b341e; font-size: 15px; line-height: 1.6;">${suggestion.description}</p>
          </div>

          ${suggestion.referenceLink ? `
            <div style="text-align: center; margin: 35px 0 10px;">
              <a href="${suggestion.referenceLink}" style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                🔗 View Reference Link
              </a>
            </div>
          ` : ''}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px dashed #cbd5e0; text-align: center;">
            <p style="color: #a0aec0; font-size: 12px;">This was submitted via the "Suggest Product" feature on your platform.</p>
          </div>
        </div>
        ${generateFooter()}
      </div>
    </div>
  `;
};

module.exports = {
  generateOrderEmailHtml,
  generateAdminQueryEmailHtml,
  generateGenericEmailHtml,
  generatePricingReportEmailHtml,
  generateDailyReportEmailHtml,
  generateSuggestionEmailHtml,
};
