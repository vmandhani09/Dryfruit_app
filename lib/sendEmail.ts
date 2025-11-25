import nodemailer from "nodemailer";

// ✅ Generate a random 6-digit OTP
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ Order Item type for email template
type OrderItemEmail = {
  productName: string;
  weight: string;
  quantity: number;
  price: number;
};

type OrderEmailData = {
  orderId: string;
  customerName: string;
  email: string;
  phone: string;
  items: OrderItemEmail[];
  shippingAddress: {
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    zip: string;
  };
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  paymentMethod: string;
  transactionId?: string;
  orderDate: Date;
};

// ✅ Order Confirmation Email Template
export function getOrderConfirmationEmailTemplate(order: OrderEmailData) {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0; font-weight: 500; color: #1f2937;">${item.productName}</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">${item.weight}</p>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #4b5563;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937; font-weight: 500;">
          ₹${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 35px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                    🥜 Dryfruit Grove
                  </h1>
                  <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 14px;">
                    Premium Quality Dry Fruits & Nuts
                  </p>
                </td>
              </tr>

              <!-- Success Icon -->
              <tr>
                <td style="padding: 30px 30px 0 30px; text-align: center;">
                  <div style="width: 70px; height: 70px; background-color: #ecfdf5; border-radius: 50%; display: inline-block; line-height: 70px;">
                    <span style="font-size: 35px;">✓</span>
                  </div>
                  <h2 style="color: #059669; margin: 20px 0 5px 0; font-size: 24px;">
                    Order Confirmed!
                  </h2>
                  <p style="color: #6b7280; margin: 0; font-size: 15px;">
                    Thank you for your order, ${order.customerName}!
                  </p>
                </td>
              </tr>
              
              <!-- Order ID Box -->
              <tr>
                <td style="padding: 25px 30px;">
                  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; text-align: center;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                      Order ID
                    </p>
                    <p style="color: #059669; font-size: 18px; font-weight: bold; margin: 5px 0 0 0; font-family: 'Courier New', monospace;">
                      ${order.orderId}
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
                      ${new Date(order.orderDate).toLocaleDateString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Order Items -->
              <tr>
                <td style="padding: 0 30px;">
                  <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                    📦 Order Details
                  </h3>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <tr style="background-color: #f9fafb;">
                      <td style="padding: 10px 12px; font-weight: 600; color: #374151; font-size: 13px;">Item</td>
                      <td style="padding: 10px 12px; font-weight: 600; color: #374151; font-size: 13px; text-align: center;">Qty</td>
                      <td style="padding: 10px 12px; font-weight: 600; color: #374151; font-size: 13px; text-align: right;">Price</td>
                    </tr>
                    ${itemsHtml}
                  </table>
                </td>
              </tr>
              
              <!-- Pricing Summary -->
              <tr>
                <td style="padding: 20px 30px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Subtotal</td>
                      <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right;">₹${order.pricing.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Shipping</td>
                      <td style="padding: 6px 0; color: ${order.pricing.shipping === 0 ? "#059669" : "#1f2937"}; font-size: 14px; text-align: right;">
                        ${order.pricing.shipping === 0 ? "FREE" : "₹" + order.pricing.shipping.toFixed(2)}
                      </td>
                    </tr>
                    ${order.pricing.tax > 0 ? `
                    <tr>
                      <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Tax</td>
                      <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right;">₹${order.pricing.tax.toFixed(2)}</td>
                    </tr>
                    ` : ""}
                    <tr>
                      <td colspan="2" style="padding: 10px 0 0 0;">
                        <div style="border-top: 2px solid #e5e7eb;"></div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0 0 0; color: #1f2937; font-size: 18px; font-weight: bold;">Total</td>
                      <td style="padding: 10px 0 0 0; color: #059669; font-size: 18px; font-weight: bold; text-align: right;">₹${order.pricing.total.toFixed(2)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Shipping & Payment Info -->
              <tr>
                <td style="padding: 0 30px 25px 30px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td width="48%" style="vertical-align: top;">
                        <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px;">
                          <h4 style="color: #374151; margin: 0 0 10px 0; font-size: 14px;">
                            📍 Shipping Address
                          </h4>
                          <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.5;">
                            ${order.customerName}<br>
                            ${order.shippingAddress.address1}<br>
                            ${order.shippingAddress.address2 ? order.shippingAddress.address2 + "<br>" : ""}
                            ${order.shippingAddress.city} - ${order.shippingAddress.zip}<br>
                            ${order.shippingAddress.state || ""}
                          </p>
                          <p style="color: #6b7280; font-size: 13px; margin: 10px 0 0 0;">
                            📞 ${order.phone}
                          </p>
                        </div>
                      </td>
                      <td width="4%"></td>
                      <td width="48%" style="vertical-align: top;">
                        <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px;">
                          <h4 style="color: #374151; margin: 0 0 10px 0; font-size: 14px;">
                            💳 Payment Info
                          </h4>
                          <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.5;">
                            Method: ${order.paymentMethod}<br>
                            Status: <span style="color: #059669; font-weight: 500;">Paid ✓</span>
                          </p>
                          ${order.transactionId ? `
                          <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0; word-break: break-all;">
                            Txn: ${order.transactionId}
                          </p>
                          ` : ""}
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 30px 30px 30px; text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://dryfruit-grove.vercel.app"}/order-confirmation/${order.orderId}" 
                     style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                    View Order Details
                  </a>
                </td>
              </tr>
              
              <!-- Help Section -->
              <tr>
                <td style="background-color: #ecfdf5; padding: 20px 30px; text-align: center;">
                  <p style="color: #059669; font-size: 14px; margin: 0 0 5px 0; font-weight: 500;">
                    Need Help?
                  </p>
                  <p style="color: #6b7280; font-size: 13px; margin: 0;">
                    Contact us at <a href="tel:+919359682328" style="color: #059669; text-decoration: none;">+91 9359682328</a>
                    or <a href="mailto:info.dryfruitgrove@gmail.com" style="color: #059669; text-decoration: none;">info.dryfruitgrove@gmail.com</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #1f2937; padding: 25px 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} Dryfruit Grove. All rights reserved.
                  </p>
                  <p style="color: #6b7280; font-size: 11px; margin: 8px 0 0 0;">
                    Mumbai, Maharashtra, India
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ✅ Styled OTP Email Template
export function getOTPEmailTemplate(otp: string, name?: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f0f9ff; margin: 0; padding: 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
                    Dryfruit Grove
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">
                    Hello ${name || 'User'},
                  </h2>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    You requested to reset your password. Please use the following One-Time Password (OTP):
                  </p>
                  
                  <!-- OTP Box -->
                  <div style="background-color: #ecfdf5; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                    <p style="color: #059669; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">
                      Your OTP
                    </p>
                    <div style="font-size: 36px; font-weight: bold; color: #10b981; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                      ${otp}
                    </div>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                    This OTP will expire in 10 minutes for security reasons.
                  </p>
                  <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
                    If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} Dryfruit Grove. All rights reserved.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
                    This is an automated email, please do not reply.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ✅ Email Verification Template
export function getVerificationEmailTemplate(verificationLink: string, name?: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f0f9ff; margin: 0; padding: 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
                    Dryfruit Grove
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">
                    Hello ${name || 'User'},
                  </h2>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Thank you for registering with Dryfruit Grove! Please verify your email address by clicking the button below:
                  </p>
                  
                  <!-- Verification Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Verify Email Address
                    </a>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                    Or copy and paste this link into your browser:
                  </p>
                  <p style="color: #10b981; font-size: 12px; margin: 5px 0 0 0; word-break: break-all;">
                    ${verificationLink}
                  </p>
                  
                  <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                    This verification link will expire in 24 hours.
                  </p>
                  <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
                    If you didn't create an account, please ignore this email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} Dryfruit Grove. All rights reserved.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
                    This is an automated email, please do not reply.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ✅ Email sender function
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.MAIL_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Dryfruit Grove" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
