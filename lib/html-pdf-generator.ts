// Server-side only HTML to PDF generator using Puppeteer
// This file should only be imported in server-side code (API routes)

interface FormData {
  [key: string]: any;
}

interface Dates {
  [key: string]: Date | string | null;
}

const formatDate = (date: Date | string | null): string => {
  if (!date) return "Not specified";

  // Handle both Date objects and date strings
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return "Invalid date";

  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const generateInquiryHTML = (formData: FormData, dates: Dates): string => {
  const currentDate = new Date();
  const referenceId = `INQ-${Date.now().toString().slice(-6)}`;

  const hotelCategory =
    formData["Hotel Category"] === "Other"
      ? `Other: ${formData["Other Hotel Category"] || "Not specified"}`
      : formData["Hotel Category"] || "Not specified";

  const roomSelectionHTML =
    formData["Room Selection"] && Array.isArray(formData["Room Selection"])
      ? formData["Room Selection"]
          .map(
            (room: any, index: number) =>
              `<div class="room-item">
          ${index + 1}. ${room.category || "N/A"} - ${
                room.type || "N/A"
              } (Quantity: ${room.quantity || 0})
        </div>`
          )
          .join("")
      : '<div class="not-specified">Not specified</div>';

  const siteInterests =
    formData["Site / Interests"] && Array.isArray(formData["Site / Interests"])
      ? formData["Site / Interests"].join(", ")
      : "Not specified";

  const otherServices =
    formData["Other service"] && Array.isArray(formData["Other service"])
      ? formData["Other service"].join(", ")
      : "Not specified";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Serendia Travel Inquiry</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* --- Base & Reset Styles --- */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #374151; /* Darker gray for better readability */
      background-color: #F3F4F6; /* Light gray background */
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* --- Main Container --- */
    .container {
      max-width: 210mm; /* A4 width */
      min-height: 297mm; /* A4 height */
      margin: 20px auto;
      padding: 0;
      background: #FFFFFF;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* --- Header Section --- */
    .header {
      background-color: #DC2626; /* A strong, professional red */
      color: white;
      padding: 25px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 5px solid #B91C1C;
    }
    
    .header-logo img {
      max-height: 50px;
      /* Using a placeholder for the logo */
    }

    .header-title {
      text-align: right;
    }

    .header-title h1 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 1px;
      margin: 0;
    }

    .header-title p {
      font-size: 14px;
      opacity: 0.9;
      margin: 0;
    }

    /* --- Document Info Bar --- */
    .info-bar {
      background-color: #F9FAFB;
      border-bottom: 1px solid #E5E7EB;
      padding: 15px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-label {
      font-weight: 600;
      color: #4B5563;
    }

    .info-value {
      color: #1F2937;
      background-color: #E5E7EB;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 500;
    }
    
     .info-value.status-new {
      background-color: #DBEAFE;
      color: #1E40AF;
    }


    /* --- Main Content Area --- */
    .content {
      padding: 30px 40px;
      flex-grow: 1; /* Allows content to fill available space */
    }

    .generated-date {
      text-align: right;
      font-size: 12px;
      color: #6B7280;
      margin-bottom: 25px;
    }

    /* --- Content Sections --- */
    .section {
      margin-bottom: 30px;
    }

    .section-header {
      border-left: 4px solid #DC2626;
      padding: 8px 15px;
      margin-bottom: 20px;
      background-color: #F9FAFB;
      border-radius: 0 6px 6px 0;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1F2937;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-content {
      padding-left: 19px; /* Aligns with the title */
      font-size: 14px;
    }

    /* --- Field Styling (Label-Value Pairs) --- */
    .field {
      display: flex;
      margin-bottom: 12px;
      align-items: flex-start;
    }

    .field-label {
      font-weight: 500;
      width: 160px; /* Consistent width for alignment */
      color: #4B5563;
      flex-shrink: 0; /* Prevents label from shrinking */
    }

    .field-value {
      flex: 1;
      color: #111827;
    }

    .not-specified {
      color: #9CA3AF;
      font-style: italic;
    }
    
    .room-list {
        list-style: none;
        padding-left: 0;
    }
    
    .room-item {
        margin-bottom: 5px;
    }

    /* --- Grid Layouts --- */
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0 30px; /* Column gap only */
    }

    /* --- Footer Section --- */
    .footer {
      background-color: #111827; /* Dark footer */
      color: #D1D5DB;
      padding: 25px 40px;
      text-align: center;
      margin-top: auto; /* Pushes footer to the bottom */
      font-size: 12px;
    }

    .footer-company {
      font-size: 16px;
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 5px;
    }

    .footer-contact {
      color: #9CA3AF;
      margin-bottom: 15px;
    }
    
    .footer-contact a {
        color: #9CA3AF;
        text-decoration: none;
    }
    
    .footer-contact a:hover {
        color: #FFFFFF;
    }

    .footer-disclaimer {
      font-size: 11px;
      color: #6B7280;
    }

    /* --- Print Styles --- */
    @media print {
      body {
        background-color: #FFFFFF;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      .container {
        max-width: none;
        margin: 0;
        box-shadow: none;
        border-radius: 0;
      }
      .section {
        page-break-inside: avoid;
      }
    }

    /* --- Responsive Adjustments --- */
    @media (max-width: 768px) {
      body {
        background-color: #FFFFFF;
      }
      .container {
        margin: 0;
        box-shadow: none;
        border-radius: 0;
      }
      .header, .info-bar, .content, .footer {
        padding-left: 20px;
        padding-right: 20px;
      }
      .header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }
      .header-title {
        text-align: center;
      }
      .info-bar {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
      }
      .grid-2 {
        grid-template-columns: 1fr;
        gap: 15px 0;
      }
      .field {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }
      .field-label {
        width: auto;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="header-logo">
        <img src="./public/serendia.svg" alt="Serendia Logo" onerror="this.onerror=null;this.src='https://placehold.co/200x60?text=Logo';">
      </div>
      <div class="header-title">
        <h1>TRAVEL INQUIRY</h1>
        <p>Detailed Travel Proposal</p>
      </div>
    </header>

    <!-- Document Info Bar -->
    <div class="info-bar">
      <div class="info-item">
        <span class="info-label">Inquiry Date:</span>
        <span class="info-value">${
          formData["Inquiry Date"] || new Date().toLocaleDateString("en-CA")
        }</span>
      </div>
      <div class="info-item">
        <span class="info-label">Customer Name:</span>
        <span class="info-value">${formData["Customer Name"] || "N/A"}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Status:</span>
        <span class="info-value status-new">${
          formData["Status"] || "New Inquiry"
        }</span>
      </div>
    </div>

    <!-- Main Content -->
    <main class="content">
      <div class="generated-date">
        Generated on: ${new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>

      <!-- Customer Information Section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">👤 Customer Information</h2>
        </div>
        <div class="section-content grid-2">
          <div class="field">
            <div class="field-label">Full Name:</div>
            <div class="field-value">${
              formData["Customer Name"] ||
              '<span class="not-specified">Not provided</span>'
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Nationality:</div>
            <div class="field-value">${
              formData["Customer Nationality"] ||
              '<span class="not-specified">Not provided</span>'
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Email Address:</div>
            <div class="field-value">${
              formData["Customer Email"] ||
              '<span class="not-specified">Not provided</span>'
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Country:</div>
            <div class="field-value">${
              formData["Customer Country"] ||
              '<span class="not-specified">Not provided</span>'
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Contact Number:</div>
            <div class="field-value">${
              formData["Customer Contact"] ||
              '<span class="not-specified">Not provided</span>'
            }</div>
          </div>
        </div>
      </section>

      <!-- Travel Details Section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">📅 Travel Details</h2>
        </div>
        <div class="section-content grid-2">
          <div class="field">
            <div class="field-label">Arrival Date:</div>
            <div class="field-value">${formatDate(dates["Arrival Date"])}</div>
          </div>
          <div class="field">
            <div class="field-label">Arrival Flight:</div>
            <div class="field-value">${
              formData["Arrival Flight"] ||
              '<span class="not-specified">Not specified</span>'
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Departure Date:</div>
            <div class="field-value">${formatDate(
              dates["Departure Date"]
            )}</div>
          </div>
          <div class="field">
            <div class="field-label">Departure Flight:</div>
            <div class="field-value">${
              formData["Departure Flight"] ||
              '<span class="not-specified">Not specified</span>'
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Number of Nights:</div>
            <div class="field-value">${
              formData["No. of Nights"] ||
              '<span class="not-specified">Not specified</span>'
            }</div>
          </div>
        </div>
      </section>
      
      <!-- Group Information Section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">👥 Group Information</h2>
        </div>
        <div class="section-content grid-2">
          <div class="field">
            <div class="field-label">Total Travelers:</div>
            <div class="field-value">${
              formData["No of pax"] ||
              '<span class="not-specified">Not specified</span>'
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Children (0-12):</div>
            <div class="field-value">${
              formData["Children"] ||
              '<span class="not-specified">Not specified</span>'
            }</div>
          </div>
        </div>
      </section>

      <!-- Accommodation Preferences Section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">🏨 Accommodation Preferences</h2>
        </div>
        <div class="section-content grid-2">
          <div class="field">
            <div class="field-label">Hotel Category:</div>
            <div class="field-value">${
              formData["Hotel Category"] ||
              '<span class="not-specified">Not specified</span>'
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Meal Basis:</div>
            <div class="field-value">${
              formData["Basis"] ||
              '<span class="not-specified">Not specified</span>'
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Room Selection:</div>
            <div class="field-value">
                ${roomSelectionHTML}
            </div>
          </div>
        </div>
      </section>

      <!-- Tour Preferences Section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">🗺️ Tour Preferences</h2>
        </div>
        <div class="section-content">
          <div class="field">
            <div class="field-label">Tour Type:</div>
            <div class="field-value">${
              formData["Tour type"] ||
              '<span class="not-specified">Not specified</span>'
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Transport:</div>
            <div class="field-value">${
              formData["Transport"] ||
              '<span class="not-specified">Not specified</span>'
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Interests:</div>
            <div class="field-value">${siteInterests}</div>
          </div>
          <div class="field">
            <div class="field-label">Additional Services:</div>
            <div class="field-value">${otherServices}</div>
          </div>
        </div>
      </section>

      <!-- Special Arrangements Section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">🎉 Special Arrangements</h2>
        </div>
        <div class="section-content grid-2">
          <div class="field">
            <div class="field-label">Notes:</div>
            <div class="field-value">${
              formData["Special Arrangements"] ||
              '<span class="not-specified">None</span>'
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Date:</div>
            <div class="field-value">${formatDate(
              dates["Special Arrangements Date"]
            )}</div>
          </div>
        </div>
      </section>

    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-company">SERENDIA HOLIDAYS</div>
      <div class="footer-contact">
        <a href="mailto:info@serendia.com">info@serendia.com</a> | 
        <a href="tel:+15551234567">+1 (555) 123-4567</a> | 
        <a href="http://www.serendia.com" target="_blank">www.serendia.com</a>
      </div>
      <div class="footer-disclaimer">
        This is an auto-generated inquiry document. All details are subject to confirmation and availability.
      </div>
    </footer>
  </div>
</body>
</html>
`;
};

export const generateInquiryPDFFromHTML = async (
  formData: FormData,
  dates: Dates
): Promise<Buffer> => {
  // Dynamic import to ensure this runs only on server
  const puppeteer = (await import("puppeteer")).default;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    const html = generateInquiryHTML(formData, dates);

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
    });

    return pdfBuffer as Buffer;
  } finally {
    await browser.close();
  }
};

// Export the HTML generator function for preview purposes
export { generateInquiryHTML };
