import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { OrderDto } from '../order/order.service';

@Injectable()
export class EmailService {
  private readonly resend: Resend | null = null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = configService.get<string>('RESEND_API_KEY')?.trim();
    this.from =
      configService.get<string>('EMAIL_FROM')?.trim() ??
      'Darkloom <onboarding@resend.dev>';
    if (apiKey?.startsWith('re_')) {
      this.resend = new Resend(apiKey);
    }
  }

  isConfigured(): boolean {
    return this.resend !== null;
  }

  /**
   * Send order confirmation email after successful Stripe payment.
   * Fire-and-forget safe: catches and logs errors, never throws.
   */
  async sendOrderConfirmationEmail(
    order: OrderDto,
    recipientEmail: string,
    recipientName?: string,
  ): Promise<void> {
    if (!this.resend) return;

    const subject = `Order confirmed – #${order.id.slice(0, 8).toUpperCase()}`;

    try {
      await this.resend.emails.send({
        from: this.from,
        to: recipientEmail,
        subject,
        html: buildOrderConfirmationHtml(order, recipientName),
        text: buildOrderConfirmationText(order),
      });
    } catch (err) {
      // Email failure must never break the checkout / webhook flow
      console.error('[EmailService] Failed to send order confirmation', {
        orderId: order.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Send failed payment notification when user returns from Stripe without completing payment.
   * Fire-and-forget safe: catches and logs errors, never throws.
   */
  async sendPaymentFailedEmail(
    order: OrderDto,
    recipientEmail: string,
    recipientName?: string,
  ): Promise<void> {
    if (!this.resend) return;

    const uiUrl =
      this.configService.get<string>('UI_URL')?.trim() ??
      'http://localhost:3001';
    const orderId = order.id.slice(0, 8).toUpperCase();
    const subject = `Payment not completed – Order #${orderId}`;

    try {
      await this.resend.emails.send({
        from: this.from,
        to: recipientEmail,
        subject,
        html: buildPaymentFailedHtml(order, recipientName, uiUrl),
        text: buildPaymentFailedText(order, uiUrl),
      });
    } catch (err) {
      console.error('[EmailService] Failed to send payment failed email', {
        orderId: order.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Send contact form submission to configured CONTACT_EMAIL.
   * Fire-and-forget safe: catches and logs errors, never throws.
   * If Resend not configured, logs only (form still returns success for demo).
   */
  async sendContactEmail(
    name: string,
    email: string,
    subject: string,
    message: string,
  ): Promise<void> {
    const recipient =
      this.configService.get<string>('CONTACT_EMAIL')?.trim() ??
      this.configService.get<string>('EMAIL_FROM')?.trim();
    if (!this.resend || !recipient) {
      console.log('[EmailService] Contact form submission (no email sent):', {
        name,
        email,
        subject: subject || '(no subject)',
      });
      return;
    }
    const subj = subject?.trim() || 'Contact form submission';
    const emailSubject = `[Darkloom Contact] ${subj}`;
    const html = buildContactHtml(name, email, subject, message);
    const text = buildContactText(name, email, subject, message);
    try {
      await this.resend.emails.send({
        from: this.from,
        to: recipient,
        replyTo: email,
        subject: emailSubject,
        html,
        text,
      });
    } catch (err) {
      console.error('[EmailService] Failed to send contact email', {
        fromEmail: email,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

// ─── Template helpers ───────────────────────────────────────────────────────

function fmt(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function buildOrderConfirmationHtml(order: OrderDto, name?: string): string {
  const orderId = order.id.slice(0, 8).toUpperCase();
  const greeting = name ? `Hi ${name},` : 'Hello,';

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;">
          <span style="color:#ffffff;font-size:14px;">${escapeHtml(item.productNameAtOrder)}</span>
          ${item.selectedOptionAtOrder ? `<span style="color:#888;font-size:12px;"> (${escapeHtml(item.selectedOptionAtOrder)})</span>` : ''}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;text-align:center;color:#888;font-size:14px;">×${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;text-align:right;color:#E6C068;font-size:14px;white-space:nowrap;">
          ${fmt(item.priceCentsAtOrder * item.quantity)}
        </td>
      </tr>`,
    )
    .join('');

  const shippingLine2 = order.shippingLine2
    ? `${escapeHtml(order.shippingLine2)}<br>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Order Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#111111;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background-color:#0D0D0D;padding:28px 40px;border-bottom:2px solid #FF4D00;text-align:center;">
            <h1 style="margin:0;font-size:26px;font-weight:900;letter-spacing:6px;color:#ffffff;text-transform:uppercase;">
              DARKLOOM
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#1A1A1A;padding:40px;">
            <p style="margin:0 0 6px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:3px;">Order Confirmed</p>
            <h2 style="margin:0 0 20px;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">Your order is being processed</h2>
            <p style="margin:0 0 28px;color:#cccccc;font-size:15px;line-height:1.7;">
              ${greeting} Thank you for your purchase. Your payment has been received and we're getting your order ready.
            </p>

            <!-- Order ID badge -->
            <div style="background-color:#0D0D0D;border:1px solid #2a2a2a;border-left:3px solid #FF4D00;border-radius:6px;padding:16px 20px;margin-bottom:32px;">
              <p style="margin:0 0 4px;color:#888;font-size:10px;text-transform:uppercase;letter-spacing:2px;">Order ID</p>
              <p style="margin:0;color:#FF4D00;font-family:monospace;font-size:18px;font-weight:700;">#${orderId}</p>
            </div>

            <!-- Items -->
            <h3 style="margin:0 0 12px;color:#ffffff;font-size:11px;text-transform:uppercase;letter-spacing:3px;">Items Ordered</h3>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:8px;">
              <thead>
                <tr>
                  <th style="text-align:left;color:#555;font-size:10px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;font-weight:normal;">Product</th>
                  <th style="text-align:center;color:#555;font-size:10px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;font-weight:normal;">Qty</th>
                  <th style="text-align:right;color:#555;font-size:10px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;font-weight:normal;">Price</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;border-top:1px solid #2a2a2a;margin-top:4px;">
              <tr>
                <td style="padding:10px 0 4px;color:#888;font-size:13px;">Subtotal</td>
                <td style="padding:10px 0 4px;text-align:right;color:#cccccc;font-size:13px;">${fmt(order.subtotalCents)}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#888;font-size:13px;">Shipping</td>
                <td style="padding:4px 0;text-align:right;color:#cccccc;font-size:13px;">${order.shippingCents === 0 ? '<span style="color:#4ade80;">Free</span>' : fmt(order.shippingCents)}</td>
              </tr>
              <tr>
                <td style="padding:14px 0 0;color:#ffffff;font-size:16px;font-weight:700;border-top:1px solid #2a2a2a;">Total</td>
                <td style="padding:14px 0 0;text-align:right;color:#E6C068;font-size:18px;font-weight:700;border-top:1px solid #2a2a2a;">${fmt(order.totalCents)}</td>
              </tr>
            </table>

            <!-- Shipping address -->
            <h3 style="margin:0 0 12px;color:#ffffff;font-size:11px;text-transform:uppercase;letter-spacing:3px;">Shipping To</h3>
            <div style="background-color:#0D0D0D;border:1px solid #2a2a2a;border-radius:6px;padding:16px 20px;margin-bottom:32px;">
              <p style="margin:0;color:#cccccc;font-size:14px;line-height:1.9;">
                ${escapeHtml(order.shippingFullName)}<br>
                ${escapeHtml(order.shippingLine1)}<br>
                ${shippingLine2}${escapeHtml(order.shippingCity)}, ${escapeHtml(order.shippingStateOrProvince)} ${escapeHtml(order.shippingPostalCode)}<br>
                ${escapeHtml(order.shippingCountry)}
              </p>
            </div>

            <p style="margin:0;color:#888;font-size:13px;line-height:1.6;">
              We'll notify you once your order ships. If you have any questions, please reply to this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#0D0D0D;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a;">
            <p style="margin:0;color:#444;font-size:12px;">
              &copy; ${new Date().getFullYear()} Darkloom. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildOrderConfirmationText(order: OrderDto): string {
  const orderId = order.id.slice(0, 8).toUpperCase();
  const lines = [
    'DARKLOOM — Order Confirmed',
    '==========================',
    '',
    'Your order is being processed.',
    `Order ID: #${orderId}`,
    '',
    'ITEMS ORDERED',
    '─────────────',
    ...order.items.map(
      (i) =>
        `${i.productNameAtOrder}${i.selectedOptionAtOrder ? ` (${i.selectedOptionAtOrder})` : ''} ×${i.quantity}  ${fmt(i.priceCentsAtOrder * i.quantity)}`,
    ),
    '',
    `Subtotal:  ${fmt(order.subtotalCents)}`,
    `Shipping:  ${order.shippingCents === 0 ? 'Free' : fmt(order.shippingCents)}`,
    `Total:     ${fmt(order.totalCents)}`,
    '',
    'SHIPPING TO',
    '───────────',
    order.shippingFullName,
    order.shippingLine1,
    ...(order.shippingLine2 ? [order.shippingLine2] : []),
    `${order.shippingCity}, ${order.shippingStateOrProvince} ${order.shippingPostalCode}`,
    order.shippingCountry,
    '',
    "We'll notify you once your order ships.",
  ];
  return lines.join('\n');
}

function buildPaymentFailedHtml(
  order: OrderDto,
  name?: string,
  uiUrl: string = 'http://localhost:3001',
): string {
  const orderId = order.id.slice(0, 8).toUpperCase();
  const greeting = name ? `Hi ${name},` : 'Hello,';
  const checkoutUrl = `${uiUrl}/checkout`;

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;">
          <span style="color:#ffffff;font-size:14px;">${escapeHtml(item.productNameAtOrder)}</span>
          ${item.selectedOptionAtOrder ? `<span style="color:#888;font-size:12px;"> (${escapeHtml(item.selectedOptionAtOrder)})</span>` : ''}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;text-align:center;color:#888;font-size:14px;">×${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;text-align:right;color:#E6C068;font-size:14px;white-space:nowrap;">
          ${fmt(item.priceCentsAtOrder * item.quantity)}
        </td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Payment Not Completed</title>
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#111111;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
        <tr>
          <td style="background-color:#0D0D0D;padding:28px 40px;border-bottom:2px solid #FF4D00;text-align:center;">
            <h1 style="margin:0;font-size:26px;font-weight:900;letter-spacing:6px;color:#ffffff;text-transform:uppercase;">DARKLOOM</h1>
          </td>
        </tr>
        <tr>
          <td style="background-color:#1A1A1A;padding:40px;">
            <p style="margin:0 0 6px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:3px;">Payment Not Completed</p>
            <h2 style="margin:0 0 20px;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">Your payment was not completed</h2>
            <p style="margin:0 0 28px;color:#cccccc;font-size:15px;line-height:1.7;">
              ${greeting} Your order #${orderId} is still pending. The payment was not completed — you may have cancelled or encountered an issue.
            </p>
            <p style="margin:0 0 24px;color:#cccccc;font-size:15px;line-height:1.7;">
              You can complete your purchase by returning to checkout. Your cart items are saved.
            </p>
            <div style="margin-bottom:32px;">
              <a href="${checkoutUrl}" style="display:inline-block;background-color:#FF4D00;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:6px;">Complete your order</a>
            </div>
            <div style="background-color:#0D0D0D;border:1px solid #2a2a2a;border-left:3px solid #FF4D00;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0 0 4px;color:#888;font-size:10px;text-transform:uppercase;letter-spacing:2px;">Order total</p>
              <p style="margin:0;color:#E6C068;font-size:18px;font-weight:700;">${fmt(order.totalCents)}</p>
            </div>
            <h3 style="margin:0 0 12px;color:#ffffff;font-size:11px;text-transform:uppercase;letter-spacing:3px;">Items in your order</h3>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
              <thead>
                <tr>
                  <th style="text-align:left;color:#555;font-size:10px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;font-weight:normal;">Product</th>
                  <th style="text-align:center;color:#555;font-size:10px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;font-weight:normal;">Qty</th>
                  <th style="text-align:right;color:#555;font-size:10px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;font-weight:normal;">Price</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <p style="margin:0;color:#888;font-size:13px;line-height:1.6;">
              If you have questions, please reply to this email or contact support.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#0D0D0D;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a;">
            <p style="margin:0;color:#444;font-size:12px;">&copy; ${new Date().getFullYear()} Darkloom. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildPaymentFailedText(
  order: OrderDto,
  uiUrl: string = 'http://localhost:3001',
): string {
  const orderId = order.id.slice(0, 8).toUpperCase();
  const checkoutUrl = `${uiUrl}/checkout`;
  const lines = [
    'DARKLOOM — Payment Not Completed',
    '=================================',
    '',
    `Your order #${orderId} is still pending. The payment was not completed.`,
    '',
    'You can complete your purchase by returning to checkout:',
    checkoutUrl,
    '',
    `Order total: ${fmt(order.totalCents)}`,
    '',
    'ITEMS',
    '─────',
    ...order.items.map(
      (i) =>
        `${i.productNameAtOrder}${i.selectedOptionAtOrder ? ` (${i.selectedOptionAtOrder})` : ''} ×${i.quantity}  ${fmt(i.priceCentsAtOrder * i.quantity)}`,
    ),
    '',
    'If you have questions, please contact support.',
  ];
  return lines.join('\n');
}

function buildContactHtml(
  name: string,
  email: string,
  subject: string,
  message: string,
): string {
  const subj = subject?.trim() || '(no subject)';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Contact</title></head>
<body style="margin:0;padding:0;background:#111;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <h2 style="color:#fff;margin:0 0 16px;">Contact Form Submission</h2>
    <p style="color:#888;font-size:12px;margin:0 0 24px;">From Darkloom website</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#888;width:100px;">Name</td><td style="padding:8px 0;color:#fff;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;color:#fff;">${escapeHtml(email)}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Subject</td><td style="padding:8px 0;color:#fff;">${escapeHtml(subj)}</td></tr>
    </table>
    <h3 style="color:#fff;font-size:14px;margin:24px 0 8px;">Message</h3>
    <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;padding:16px;color:#ccc;white-space:pre-wrap;">${escapeHtml(message)}</div>
  </div>
</body>
</html>`;
}

function buildContactText(
  name: string,
  email: string,
  subject: string,
  message: string,
): string {
  const subj = subject?.trim() || '(no subject)';
  return [
    'Contact Form Submission',
    '=======================',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Subject: ${subj}`,
    '',
    'Message',
    '-------',
    message,
  ].join('\n');
}

/** Minimal HTML escaping for user-supplied content placed inside HTML. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
