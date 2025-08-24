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
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>New Travel Inquiry</title>
            <style>
                /* Basic Resets */
                body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
                body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f7f6; }
            </style>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                            
                            <tr>
                                <td style="background-color: #0d9488; padding: 20px 30px;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td width="160" valign="middle">
                                                <img src="https://vbroogzremdnrnjzyzbc.supabase.co/storage/v1/object/sign/images/serendia.svg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81YWI5ODY1Zi0yMWIzLTQ1YmQtYWQxNi05NWU2MmExOTAwZmEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvc2VyZW5kaWEuc3ZnIiwiaWF0IjoxNzU1ODgwMjU5LCJleHAiOjE3ODc0MTYyNTl9.H-n9n9--D-xCqgRw-EdKCqqN7ZVijRyyjI1Z-DazurQ" alt="Your Company Logo" width="150" style="display: block; border: 0;">
                                            </td>
                                            <td valign="right" style="color: #ffffff;">
                                                <h1 style="font-size: 28px; font-weight: 600; margin: 0; text-align: right;">New Travel Inquiry</h1>
                                                <p style="font-size: 16px; margin: 5px 0 0; text-align: right;">You've received a new request.</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 35px 30px;">
                                    <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin: 0 0 20px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                                        👤 Customer Information
                                    </h2>
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 16px; color: #475569; line-height: 1.6;">
                                        <tr>
                                            <td style="padding-bottom: 10px; font-weight: 500;">Full Name:</td>
                                            <td style="padding-bottom: 10px; text-align: right; font-weight: 600; color: #0d9488;">${
                                              formData["Customer Name"]
                                            }</td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 10px; font-weight: 500;">Email:</td>
                                            <td style="padding-bottom: 10px; text-align: right;">${
                                              formData["Customer Email"]
                                            }</td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 10px; font-weight: 500;">Contact:</td>
                                            <td style="padding-bottom: 10px; text-align: right;">${
                                              formData["Customer Contact"]
                                            }</td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 10px; font-weight: 500;">Nationality:</td>
                                            <td style="padding-bottom: 10px; text-align: right;">${
                                              formData["Customer Nationality"]
                                            }</td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 10px; font-weight: 500;">Country of Residence:</td>
                                            <td style="padding-bottom: 10px; text-align: right;">${
                                              formData["Customer Country"]
                                            }</td>
                                        </tr>
                                    </table>

                                    <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin: 35px 0 20px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                                        ✈️ Travel Details
                                    </h2>
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 16px; color: #475569; line-height: 1.6;">
                                        <tr>
                                            <td style="padding-bottom: 10px; font-weight: 500;">Arrival Date:</td>
                                            <td style="padding-bottom: 10px; text-align: right;">${
                                              dates["Arrival Date"]
                                                ? new Date(
                                                    dates["Arrival Date"]
                                                  ).toLocaleDateString()
                                                : "Not specified"
                                            }</td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 10px; font-weight: 500;">Departure Date:</td>
                                            <td style="padding-bottom: 10px; text-align: right;">${
                                              dates["Departure Date"]
                                                ? new Date(
                                                    dates["Departure Date"]
                                                  ).toLocaleDateString()
                                                : "Not specified"
                                            }</td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 10px; font-weight: 500;">No. of Nights:</td>
                                            <td style="padding-bottom: 10px; text-align: right;">${
                                              formData["No. of Nights"] ||
                                              "Not specified"
                                            }</td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 10px; font-weight: 500;">No. of Travelers:</td>
                                            <td style="padding-bottom: 10px; text-align: right;">${
                                              formData["No of pax"] ||
                                              "Not specified"
                                            }</td>
                                        </tr>
                                    </table>

                                    <div style="margin-top: 35px; padding: 20px; background-color: #f1f5f9; border-left: 5px solid #0d9488; border-radius: 0 8px 8px 0;">
                                        <p style="margin: 0; font-size: 15px; color: #334155;"><strong>Please Note:</strong> The complete detailed inquiry report is attached as a PDF document for your review.</p>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr>
                                <td align="center" style="background-color: #1e293b; color: #94a3b8; padding: 20px 30px; font-size: 13px;">
                                    <p style="margin: 0;">SERENDIA Travel Management System</p>
                                    <p style="margin: 5px 0 0;">Auto-generated at ${new Date().toLocaleString()}</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
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
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>Thank You for Your Travel Inquiry!</title>
            <style>
                /* Basic Resets */
                body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                img { -ms-interpolation-mode: bicubic; border: 0;  line-height: 100%; outline: none; text-decoration: none; }
                body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f7f6; }
            </style>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                            
                            <tr>
                                <td style="background-color: #0d9488; padding: 20px 30px;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td width="160" valign="middle">
                                                <img src="https://vbroogzremdnrnjzyzbc.supabase.co/storage/v1/object/sign/images/serendia.svg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81YWI5ODY1Zi0yMWIzLTQ1YmQtYWQxNi05NWU2MmExOTAwZmEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvc2VyZW5kaWEuc3ZnIiwiaWF0IjoxNzU1ODgwMjU5LCJleHAiOjE3ODc0MTYyNTl9.H-n9n9--D-xCqgRw-EdKCqqN7ZVijRyyjI1Z-DazurQ" alt="Your Company Logo" width="150" style="display: block; border: 0;">
                                            </td>
                                            <td valign="middle" style="color: #ffffff;">
                                                <h1 style="font-size: 28px; font-weight: 600; margin: 0; text-align: right;">Thank You!</h1>
                                                <p style="font-size: 16px; margin: 5px 0 0; text-align: right;">We've received your inquiry.</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 35px 30px; font-size: 16px; color: #475569; line-height: 1.6;">
                                    <p style="margin: 0 0 15px 0;">Dear ${
                                      formData["Customer Name"]
                                    },</p>
                                    <p style="margin: 0 0 25px 0;">Thank you for submitting your travel inquiry. We have received your request and our travel consultants will review it shortly.</p>
                                    
                                    <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin: 0 0 20px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                                        📝 Your Inquiry Summary
                                    </h2>
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 16px; color: #475569; line-height: 1.6;">
                                        <tr>
                                            <td style="padding-bottom: 10px; font-weight: 500;">Travel Dates:</td>
                                            <td style="padding-bottom: 10px; text-align: right;">${
                                              dates["Arrival Date"]
                                                ? new Date(
                                                    dates["Arrival Date"]
                                                  ).toLocaleDateString()
                                                : "Not specified"
                                            } to ${
        dates["Departure Date"]
          ? new Date(dates["Departure Date"]).toLocaleDateString()
          : "Not specified"
      }</td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 10px; font-weight: 500;">Duration:</td>
                                            <td style="padding-bottom: 10px; text-align: right;">${
                                              formData["No. of Nights"] || "0"
                                            } nights</td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 10px; font-weight: 500;">Travelers:</td>
                                            <td style="padding-bottom: 10px; text-align: right;">${
                                              formData["No of pax"] ||
                                              "Not specified"
                                            }</td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 10px; font-weight: 500;">Tour Type:</td>
                                            <td style="padding-bottom: 10px; text-align: right;">${
                                              formData["Tour type"] ||
                                              "Not specified"
                                            }</td>
                                        </tr>
                                    </table>

                                    <p style="margin: 25px 0 15px 0;">We will contact you within 48 hours with a customized travel proposal based on your requirements.</p>
                                    <p style="margin: 0 0 15px 0;">Please find your complete inquiry details attached as a PDF for your records.</p>
                                    <p style="margin: 0 0 25px 0;">If you have any immediate questions, please don't hesitate to contact us.</p>
                                    
                                    <p style="margin: 0;">Best regards,<br>SERENDIA Travel Planning Team</p>
                                </td>
                            </tr>
                            
                            <tr>
                                <td align="center" style="background-color: #1e293b; color: #94a3b8; padding: 20px 30px; font-size: 13px;">
                                    <p style="margin: 0;">We look forward to helping you plan your perfect trip!</p>
                                    
                                    <p style="margin: 0;">info@serendia.com | +94 112 233 444 | www.serendia.com</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
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
