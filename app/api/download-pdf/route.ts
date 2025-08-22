import { NextRequest, NextResponse } from "next/server";
import { generateInquiryPDFFromHTML } from "@/lib/html-pdf-generator";

export async function POST(request: NextRequest) {
  try {
    const { formData, dates } = await request.json();

    // Generate PDF using the same function used for emails
    const pdfBuffer = await generateInquiryPDFFromHTML(formData, dates);

    // Generate filename
    const customerName = formData["Customer Name"] || "customer";
    const fileName = `Serendia-Travel-Inquiry-${customerName.replace(
      /\s+/g,
      "-"
    )}.pdf`;

    // Return PDF as download
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "PDF generation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
