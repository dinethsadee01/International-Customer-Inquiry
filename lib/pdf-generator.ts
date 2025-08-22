interface FormData {
  [key: string]: any;
}

interface Dates {
  [key: string]: Date | string | null;
}

/**
 * Downloads a PDF file using HTML-based generation via API call
 */
export const downloadHTMLPDF = async (
  formData: FormData,
  dates: Dates,
  fileName: string = "serendia-travel-inquiry.pdf"
): Promise<void> => {
  try {
    // Call the server-side API to generate PDF
    const response = await fetch("/api/download-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ formData, dates }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate PDF: ${response.statusText}`);
    }

    // Get the PDF blob from the response
    const blob = await response.blob();

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
