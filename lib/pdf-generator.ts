import jsPDF from "jspdf";

interface FormData {
  [key: string]: any;
}

interface Dates {
  [key: string]: Date | string | null;
}

export const generateInquiryPDF = (formData: FormData, dates: Dates): jsPDF => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  let yPosition = 20;

  // Helper function to add text with auto-wrap
  const addText = (
    text: string,
    x: number,
    fontSize: number = 12,
    isBold: boolean = false
  ) => {
    pdf.setFontSize(fontSize);
    pdf.setFont("helvetica", isBold ? "bold" : "normal");

    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
    }

    const lines = pdf.splitTextToSize(text, pageWidth - 40);
    pdf.text(lines, x, yPosition);
    yPosition += lines.length * fontSize * 0.4 + 5;
  };

  const addSection = (title: string, icon: string = "") => {
    yPosition += 8;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(10, yPosition - 6, pageWidth - 20, 14, "F");
    pdf.setDrawColor(228, 69, 70);
    pdf.setLineWidth(0.5);
    pdf.line(10, yPosition - 6, pageWidth - 10, yPosition - 6);
    pdf.setTextColor(228, 69, 70);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${icon} ${title}`, 15, yPosition + 2);
    pdf.setTextColor(0, 0, 0);
    yPosition += 8;
  };

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

  // Header with Serendia branding
  pdf.setFillColor(228, 69, 70); // Serendia red color
  pdf.rect(0, 0, pageWidth, 35, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text("SERENDIA", 20, 18);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text("Travel & Tours", 20, 28);

  // Document title on the right
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("TRAVEL INQUIRY", pageWidth - 20, 18, { align: "right" });
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Detailed Travel Proposal", pageWidth - 20, 28, { align: "right" });

  pdf.setTextColor(0, 0, 0);
  yPosition = 55;

  // Document info box
  pdf.setFillColor(250, 250, 250);
  pdf.rect(pageWidth - 80, 40, 70, 20, "F");
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(pageWidth - 80, 40, 70, 20, "S");

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("Inquiry Date:", pageWidth - 75, 47);
  pdf.setFont("helvetica", "normal");
  pdf.text(new Date().toLocaleDateString(), pageWidth - 75, 52);
  pdf.setFont("helvetica", "bold");
  pdf.text("Reference ID:", pageWidth - 75, 57);
  pdf.setFont("helvetica", "normal");
  pdf.text(`INQ-${Date.now().toString().slice(-6)}`, pageWidth - 75, 62);

  // Generated date
  addText(
    `Generated on: ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    15,
    9
  );

  // Customer Information Section
  addSection("CUSTOMER INFORMATION", "👤");
  addText(`Name: ${formData["Customer Name"] || "Not provided"}`, 15);
  addText(`Email: ${formData["Customer Email"] || "Not provided"}`, 15);
  addText(`Contact: ${formData["Customer Contact"] || "Not provided"}`, 15);
  addText(
    `Nationality: ${formData["Customer Nationality"] || "Not provided"}`,
    15
  );
  addText(`Country: ${formData["Customer Country"] || "Not provided"}`, 15);

  // Flight Information Section
  addSection("FLIGHT INFORMATION", "✈️");
  addText(
    `Arrival Flight: ${formData["Arrival Flight"] || "Not specified"}`,
    15
  );
  addText(
    `Departure Flight: ${formData["Departure Flight"] || "Not specified"}`,
    15
  );

  // Travel Dates Section
  addSection("TRAVEL DETAILS", "📅");
  addText(`Arrival Date: ${formatDate(dates["Arrival Date"])}`, 15);
  addText(`Departure Date: ${formatDate(dates["Departure Date"])}`, 15);
  addText(`Number of Nights: ${formData["No. of Nights"] || "0"}`, 15);

  // Accommodation Section
  addSection("ACCOMMODATION PREFERENCES", "🏨");
  const hotelCategory =
    formData["Hotel Category"] === "Other"
      ? `Other: ${formData["Other Hotel Category"] || "Not specified"}`
      : formData["Hotel Category"] || "Not specified";
  addText(`Hotel Category: ${hotelCategory}`, 15);

  // Room Selection
  if (formData["Room Selection"] && Array.isArray(formData["Room Selection"])) {
    addText("Room Selection:", 15, 12, true);
    formData["Room Selection"].forEach((room: any, index: number) => {
      addText(
        `  ${index + 1}. ${room.category || "N/A"} - ${
          room.type || "N/A"
        } (Quantity: ${room.quantity || 0})`,
        20
      );
    });
  } else {
    addText("Room Selection: Not specified", 15);
  }

  addText(`Basis: ${formData["Basis"] || "Not specified"}`, 15);

  // Group Details Section
  addSection("GROUP INFORMATION", "👥");
  addText(
    `Number of Travelers: ${formData["No of pax"] || "Not specified"}`,
    15
  );
  addText(`Children: ${formData["Children"] || "Not specified"}`, 15);

  // Experience & Services Section
  addSection("TOUR PREFERENCES", "🗺️");
  addText(`Tour Type: ${formData["Tour type"] || "Not specified"}`, 15);
  addText(`Transport: ${formData["Transport"] || "Not specified"}`, 15);

  // Site Interests
  if (
    formData["Site / Interests"] &&
    Array.isArray(formData["Site / Interests"])
  ) {
    addText(`Interests: ${formData["Site / Interests"].join(", ")}`, 15);
  } else {
    addText("Interests: Not specified", 15);
  }

  // Other Services
  if (formData["Other service"] && Array.isArray(formData["Other service"])) {
    addText(`Additional Services: ${formData["Other service"].join(", ")}`, 15);
  } else {
    addText("Additional Services: Not specified", 15);
  }

  // Special Arrangements Section
  addSection("SPECIAL ARRANGEMENTS", "🎉");
  addText(
    `Special Arrangements: ${formData["Special Arrangements"] || "None"}`,
    15
  );
  if (
    formData["Special Arrangements"] &&
    formData["Special Arrangements"] !== "None"
  ) {
    addText(`Date: ${formatDate(dates["Special Arrangements Date"])}`, 15);
  }

  // Footer
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = 30;
  }

  yPosition = Math.max(yPosition + 20, pageHeight - 50);
  pdf.setFillColor(245, 245, 245);
  pdf.rect(0, pageHeight - 50, pageWidth, 50, "F");

  // Company name and tagline
  pdf.setTextColor(228, 69, 70);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("SERENDIA TRAVEL & TOURS", pageWidth / 2, pageHeight - 35, {
    align: "center",
  });

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    "Professional Travel Planning Services",
    pageWidth / 2,
    pageHeight - 25,
    { align: "center" }
  );

  pdf.setFontSize(9);
  pdf.text(
    "📧 info@serendia.com | 📞 +1 (555) 123-4567 | 🌐 www.serendia.com",
    pageWidth / 2,
    pageHeight - 15,
    { align: "center" }
  );

  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(8);
  pdf.text(
    "This inquiry was generated automatically. Please contact us for any modifications or additional requirements.",
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" }
  );

  return pdf;
};

export const downloadPDF = (
  formData: FormData,
  dates: Dates,
  filename: string = "serendia-travel-inquiry.pdf"
) => {
  const pdf = generateInquiryPDF(formData, dates);
  pdf.save(filename);
};

export const getPDFBlob = (formData: FormData, dates: Dates): Blob => {
  const pdf = generateInquiryPDF(formData, dates);
  return pdf.output("blob");
};
