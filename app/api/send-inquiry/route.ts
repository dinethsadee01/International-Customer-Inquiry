import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateInquiryPDFFromHTML } from "@/lib/html-pdf-generator";

export async function POST(request: NextRequest) {
  try {
    const { formData, dates, customerEmail, agencyEmail } =
      await request.json();

    // Create transporter (configure with your email service)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: parseInt(process.env.SMTP_PORT || "587") === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // Don't fail on invalid certs
        rejectUnauthorized: false,
        // Minimum TLS version
        minVersion: "TLSv1.2",
      },
      // Additional options for connection stability
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
      // Ignore certificate errors
      ignoreTLS: false,
      requireTLS: true,
    });

    console.log("📧 Starting email process...");
    console.log("SMTP Configuration:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? "***configured***" : "missing",
      pass: process.env.SMTP_PASS ? "***configured***" : "missing",
    });

    // Test the connection
    console.log("🔗 Testing SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully");

    // Generate PDF using HTML-based method
    console.log("📄 Generating PDF with HTML template...");
    const pdfBuffer = await generateInquiryPDFFromHTML(formData, dates);
    console.log("✅ PDF generated successfully");

    // Email to travel agency
    const agencyMailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: agencyEmail || process.env.AGENCY_EMAIL,
      subject: `New Travel Inquiry from ${formData["Customer Name"]}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h1>New Travel Inquiry Received</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <h2 style="color: #1f2937;">Customer Information</h2>
            <p><strong>Name:</strong> ${formData["Customer Name"]}</p>
            <p><strong>Email:</strong> ${formData["Customer Email"]}</p>
            <p><strong>Contact:</strong> ${formData["Customer Contact"]}</p>
            <p><strong>Nationality:</strong> ${
              formData["Customer Nationality"]
            }</p>
            <p><strong>Country:</strong> ${formData["Customer Country"]}</p>
            
            <h3 style="color: #1f2937; margin-top: 30px;">Travel Details</h3>
            <p><strong>Arrival Date:</strong> ${
              dates["Arrival Date"]
                ? new Date(dates["Arrival Date"]).toLocaleDateString()
                : "Not specified"
            }</p>
            <p><strong>Departure Date:</strong> ${
              dates["Departure Date"]
                ? new Date(dates["Departure Date"]).toLocaleDateString()
                : "Not specified"
            }</p>
            <p><strong>Number of Nights:</strong> ${
              formData["No. of Nights"] || "Not specified"
            }</p>
            <p><strong>Number of Travelers:</strong> ${
              formData["No of pax"] || "Not specified"
            }</p>
            
            <h3 style="color: #1f2937; margin-top: 30px;">Accommodation</h3>
            <p><strong>Hotel Category:</strong> ${
              formData["Hotel Category"] === "Other"
                ? `Other: ${formData["Other Hotel Category"]}`
                : formData["Hotel Category"]
            }</p>
            <p><strong>Basis:</strong> ${formData["Basis"]}</p>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #dbeafe; border-left: 4px solid #3b82f6;">
              <p style="margin: 0;"><strong>Note:</strong> Please find the complete detailed inquiry report attached as PDF.</p>
            </div>
          </div>
          
          <div style="background-color: #1f2937; color: white; padding: 15px; text-align: center;">
            <p style="margin: 0;">Travel Agency Management System</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `travel-inquiry-${
            formData["Customer Name"]?.replace(/\s+/g, "-") || "customer"
          }-${new Date().getTime()}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    // Email confirmation to customer
    const customerMailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: customerEmail || formData["Customer Email"],
      subject: "Travel Inquiry Confirmation - We've Received Your Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
            <h1>Thank You for Your Travel Inquiry!</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <p>Dear ${formData["Customer Name"]},</p>
            
            <p>Thank you for submitting your travel inquiry. We have received your request and our travel consultants will review it shortly.</p>
            
            <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #065f46; margin-top: 0;">Your Inquiry Summary:</h3>
              <p><strong>Travel Dates:</strong> ${
                dates["Arrival Date"]
                  ? new Date(dates["Arrival Date"]).toLocaleDateString()
                  : "Not specified"
              } to ${
        dates["Departure Date"]
          ? new Date(dates["Departure Date"]).toLocaleDateString()
          : "Not specified"
      }</p>
              <p><strong>Duration:</strong> ${
                formData["No. of Nights"] || "0"
              } nights</p>
              <p><strong>Travelers:</strong> ${
                formData["No of pax"] || "Not specified"
              }</p>
              <p><strong>Tour Type:</strong> ${
                formData["Tour type"] || "Not specified"
              }</p>
            </div>
            
            <p>We will contact you within 24-48 hours with a customized travel proposal based on your requirements.</p>
            
            <p>Please find your complete inquiry details attached as a PDF for your records.</p>
            
            <p>If you have any immediate questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>Your Travel Planning Team</p>
          </div>
          
          <div style="background-color: #1f2937; color: white; padding: 15px; text-align: center;">
            <p style="margin: 0;">We look forward to helping you plan your perfect trip!</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `your-travel-inquiry-${new Date().getTime()}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    // Send emails
    console.log("📤 Sending email to travel agency...");
    const agencyResult = await transporter.sendMail(agencyMailOptions);
    console.log("✅ Agency email sent successfully:", agencyResult.messageId);

    console.log("📤 Sending confirmation email to customer...");
    const customerResult = await transporter.sendMail(customerMailOptions);
    console.log(
      "✅ Customer email sent successfully:",
      customerResult.messageId
    );

    return NextResponse.json({
      success: true,
      message: "Inquiry sent successfully",
      details: {
        agencyMessageId: agencyResult.messageId,
        customerMessageId: customerResult.messageId,
      },
    });
  } catch (error) {
    console.error("Error sending inquiry:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send inquiry",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
