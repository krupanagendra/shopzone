const brandColor = "#4F46E5";
const brandName = "ShopZone AI";
const brandTagline = "Powered by Autonomous Intelligence";

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

const generateDailyReportEmailHtml = (reportData) => `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden;">
        ${generateHeader("Daily Business Intelligence 📈")}
        <div style="padding: 30px;">
          <p style="color: #555; font-size: 15px; margin-bottom: 25px;">The AI Report Agent has compiled today's metrics. A full PDF version with detailed charts is attached.</p>
          
          <div style="display: flex; gap: 10px; margin-bottom: 30px;">
            <div style="flex: 1; background: #f0fdf4; border-radius: 8px; padding: 12px; text-align: center; border: 1px solid #bbf7d0;">
              <p style="margin: 0; font-size: 11px; color: #166534; text-transform: uppercase;">Revenue</p>
              <p style="margin: 5px 0 0; font-size: 18px; font-weight: 800; color: #111;">₹${reportData.revenue}</p>
            </div>
            <div style="flex: 1; background: #eff6ff; border-radius: 8px; padding: 12px; text-align: center; border: 1px solid #bfdbfe;">
              <p style="margin: 0; font-size: 11px; color: #1e40af; text-transform: uppercase;">Orders</p>
              <p style="margin: 5px 0 0; font-size: 18px; font-weight: 800; color: #111;">${reportData.totalSales}</p>
            </div>
            <div style="flex: 1; background: #fff7ed; border-radius: 8px; padding: 12px; text-align: center; border: 1px solid #fed7aa;">
              <p style="margin: 0; font-size: 11px; color: #9a3412; text-transform: uppercase;">AOV</p>
              <p style="margin: 5px 0 0; font-size: 18px; font-weight: 800; color: #111;">₹${reportData.aov || 0}</p>
            </div>
          </div>

          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 12px; font-size: 14px; color: #334155; display: flex; align-items: center;">
              🧠 AI Strategic Insights
            </h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.7; color: #475569;">
              ${(reportData.suggestions || []).map(s => `<li style="margin-bottom: 8px;">${s}</li>`).join('')}
            </ul>
          </div>
        </div>
        ${generateFooter()}
      </div>
    </div>
`;

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
