// Server-side only HTML to PDF generator using Puppeteer
// This file should only be imported in server-side code (API routes)

import { readFileSync } from "fs";
import { join } from "path";

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
  // Read the HTML template file
  const templatePath = join(
    process.cwd(),
    "public",
    "travel-inquiry-template.html"
  );
  let htmlTemplate = readFileSync(templatePath, "utf-8");

  // Prepare all the data for replacement
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
      : '<span class="not-specified">Not specified</span>';

  const siteInterests =
    formData["Site / Interests"] && Array.isArray(formData["Site / Interests"])
      ? formData["Site / Interests"].join(", ")
      : '<span class="not-specified">Not specified</span>';

  const otherServices =
    formData["Other service"] && Array.isArray(formData["Other service"])
      ? formData["Other service"].join(", ")
      : '<span class="not-specified">Not specified</span>';

  // Define all template replacements
  const replacements = {
    "{{INQUIRY_DATE}}":
      formData["Inquiry Date"] || new Date().toLocaleDateString("en-CA"),
    "{{CUSTOMER_NAME}}": formData["Customer Name"] || "N/A",
    "{{STATUS}}": formData["Status"] || "New Inquiry",
    "{{GENERATED_DATE}}": new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    "{{CUSTOMER_NAME_FULL}}":
      formData["Customer Name"] ||
      '<span class="not-specified">Not provided</span>',
    "{{CUSTOMER_NATIONALITY}}":
      formData["Customer Nationality"] ||
      '<span class="not-specified">Not provided</span>',
    "{{CUSTOMER_EMAIL}}":
      formData["Customer Email"] ||
      '<span class="not-specified">Not provided</span>',
    "{{CUSTOMER_COUNTRY}}":
      formData["Customer Country"] ||
      '<span class="not-specified">Not provided</span>',
    "{{CUSTOMER_CONTACT}}":
      formData["Customer Contact"] ||
      '<span class="not-specified">Not provided</span>',
    "{{ARRIVAL_DATE}}": formatDate(dates["Arrival Date"]),
    "{{ARRIVAL_FLIGHT}}":
      formData["Arrival Flight"] ||
      '<span class="not-specified">Not specified</span>',
    "{{DEPARTURE_DATE}}": formatDate(dates["Departure Date"]),
    "{{DEPARTURE_FLIGHT}}":
      formData["Departure Flight"] ||
      '<span class="not-specified">Not specified</span>',
    "{{NO_OF_NIGHTS}}":
      formData["No. of Nights"] ||
      '<span class="not-specified">Not specified</span>',
    "{{NO_OF_PAX}}":
      formData["No of pax"] ||
      '<span class="not-specified">Not specified</span>',
    "{{CHILDREN}}":
      formData["Children"] ||
      '<span class="not-specified">Not specified</span>',
    "{{HOTEL_CATEGORY}}":
      formData["Hotel Category"] === "Other"
        ? formData["Other Hotel Category"] ||
          '<span class="not-specified">Other (not specified)</span>'
        : formData["Hotel Category"] ||
          '<span class="not-specified">Not specified</span>',
    "{{MEAL_BASIS}}":
      formData["Basis"] || '<span class="not-specified">Not specified</span>',
    "{{ROOM_SELECTION}}": roomSelectionHTML,
    "{{TOUR_TYPE}}":
      formData["Tour type"] ||
      '<span class="not-specified">Not specified</span>',
    "{{TRANSPORT}}":
      formData["Transport"] ||
      '<span class="not-specified">Not specified</span>',
    "{{SITE_INTERESTS}}": siteInterests,
    "{{OTHER_SERVICES}}": otherServices,
    "{{SPECIAL_ARRANGEMENTS}}":
      formData["Special Arrangements"] ||
      '<span class="not-specified">None</span>',
    "{{SPECIAL_ARRANGEMENTS_DATE}}": formatDate(
      dates["Special Arrangements Date"]
    ),
  };

  // Replace all placeholders in the template
  Object.entries(replacements).forEach(([placeholder, value]) => {
    htmlTemplate = htmlTemplate.replace(new RegExp(placeholder, "g"), value);
  });

  return htmlTemplate;
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
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    return pdfBuffer as Buffer;
  } finally {
    await browser.close();
  }
};

// Export the HTML generator function for preview purposes
export { generateInquiryHTML };
