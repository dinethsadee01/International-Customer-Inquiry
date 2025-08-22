import { generateInquiryPDFFromHTML } from "./html-pdf-generator";

interface FormData {
  [key: string]: any;
}

interface Dates {
  [key: string]: Date | string | null;
}

/**
 * Downloads a PDF file using HTML-based generation
 */
export const downloadHTMLPDF = async (
  formData: FormData,
  dates: Dates,
  fileName: string = "serendia-travel-inquiry.pdf"
): Promise<void> => {
  try {
    // Generate PDF directly using the HTML generator
    const pdfBuffer = await generateInquiryPDFFromHTML(formData, dates);
    
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(pdfBuffer);
    const blob = new Blob([uint8Array], { type: "application/pdf" });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading HTML PDF:", error);
    throw error;
  }
};
