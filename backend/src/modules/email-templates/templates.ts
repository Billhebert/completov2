// src/modules/email-templates/templates.ts
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export const templates = {
  welcome: (variables: { name: string; companyName: string }): EmailTemplate => ({
    subject: `Welcome to ${variables.companyName}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${variables.companyName}!</h1>
          </div>
          <div class="content">
            <p>Hi ${variables.name},</p>
            <p>Welcome to our platform! We're excited to have you on board.</p>
            <p>Your account has been created successfully.</p>
            <a href="https://app.omni.com/login" class="button">Get Started</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${variables.companyName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to ${variables.companyName}!\n\nHi ${variables.name},\n\nWelcome to our platform! We're excited to have you on board.\n\nYour account has been created successfully.`,
  }),

  passwordReset: (variables: { name: string; resetUrl: string }): EmailTemplate => ({
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #EF4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #FEF3C7; padding: 12px; border-left: 4px solid #F59E0B; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <p>Hi ${variables.name},</p>
            <p>We received a request to reset your password.</p>
            <a href="${variables.resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <strong>Security Note:</strong> This link expires in 1 hour. If you didn't request this, please ignore this email.
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${variables.name},\n\nWe received a request to reset your password.\n\nReset your password: ${variables.resetUrl}\n\nThis link expires in 1 hour.`,
  }),

  dealWon: (variables: { name: string; dealTitle: string; value: number }): EmailTemplate => ({
    subject: `🎉 Deal Won: ${variables.dealTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .stat { padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
          .stat:last-child { border-bottom: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
          </div>
          <div class="content">
            <p>Hi ${variables.name},</p>
            <p>Great news! You've won a deal!</p>
            <div class="stats">
              <div class="stat"><strong>Deal:</strong> ${variables.dealTitle}</div>
              <div class="stat"><strong>Value:</strong> $${variables.value.toLocaleString()}</div>
            </div>
            <p>Keep up the excellent work!</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  notification: (variables: { name: string; title: string; body: string; actionUrl?: string }): EmailTemplate => ({
    subject: variables.title,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6366F1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #6366F1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${variables.title}</h1>
          </div>
          <div class="content">
            <p>Hi ${variables.name},</p>
            <p>${variables.body}</p>
            ${variables.actionUrl ? `<a href="${variables.actionUrl}" class="button">View Details</a>` : ''}
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  invoice: (variables: { name: string; invoiceNumber: string; amount: number; dueDate: string; pdfUrl: string }): EmailTemplate => ({
    subject: `Invoice ${variables.invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0891B2; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .invoice { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #0891B2; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice ${variables.invoiceNumber}</h1>
          </div>
          <div class="content">
            <p>Hi ${variables.name},</p>
            <p>Your invoice is ready.</p>
            <div class="invoice">
              <p><strong>Invoice #:</strong> ${variables.invoiceNumber}</p>
              <p><strong>Amount:</strong> $${variables.amount.toLocaleString()}</p>
              <p><strong>Due Date:</strong> ${variables.dueDate}</p>
            </div>
            <a href="${variables.pdfUrl}" class="button">Download PDF</a>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

export type TemplateName = keyof typeof templates;
