const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.smsProvider = process.env.SMS_PROVIDER || 'mock';
    this.smsApiKey = process.env.SMS_API_KEY;
    this.smsApiUrl = process.env.SMS_API_URL;
    
    // Email transporter for notifications (optional)
    try {
      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        this.emailTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        console.log('Email transporter configured successfully');
      } else {
        console.log('Gmail credentials not found in environment variables');
        this.emailTransporter = null;
      }
    } catch (error) {
      console.log('Email service not available:', error.message);
      this.emailTransporter = null;
    }
  }

  // Send SMS authorization code
  async sendAuthorizationCode(phoneNumber, code, purpose) {
    try {
      const message = `Your ${purpose} authorization code is: ${code}. Valid for 5 minutes. Do not share this code.`;
      
      if (this.smsProvider === 'mock') {
        console.log(`📱 SMS to ${phoneNumber}: ${message}`);
        return { success: true, messageId: 'mock_' + Date.now() };
      }

      // Twilio support without extra deps
      if (this.smsProvider === 'twilio') {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_FROM_NUMBER;
        if (!accountSid || !authToken || !fromNumber) {
          console.error('Twilio credentials missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER');
          return { success: false, error: 'Twilio credentials missing' };
        }

        const https = require('https');
        const querystring = require('querystring');
        const postData = querystring.stringify({
          To: phoneNumber,
          From: fromNumber,
          Body: message
        });

        const options = {
          host: 'api.twilio.com',
          path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
          }
        };

        const result = await new Promise((resolve) => {
          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve({ success: true, messageId: `twilio_${Date.now()}` });
              } else {
                console.error('Twilio SMS error:', res.statusCode, data);
                resolve({ success: false, error: `Twilio error ${res.statusCode}` });
              }
            });
          });
          req.on('error', (e) => {
            console.error('Twilio request error:', e.message);
            resolve({ success: false, error: e.message });
          });
          req.write(postData);
          req.end();
        });

        return result;
      }

      // Generic HTTP API support if SMS_API_URL is configured (expects Bearer token)
      if (this.smsApiUrl && this.smsApiKey) {
        try {
          const https = require('https');
          const url = new URL(this.smsApiUrl);
          const payload = JSON.stringify({ to: phoneNumber, message });
          const options = {
            hostname: url.hostname,
            path: url.pathname + (url.search || ''),
            method: 'POST',
            port: url.port || 443,
            headers: {
              'Authorization': `Bearer ${this.smsApiKey}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload)
            }
          };
          const result = await new Promise((resolve) => {
            const req = https.request(options, (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                  resolve({ success: true, messageId: `api_${Date.now()}` });
                } else {
                  console.error('SMS API error:', res.statusCode, data);
                  resolve({ success: false, error: `SMS API error ${res.statusCode}` });
                }
              });
            });
            req.on('error', (e) => {
              console.error('SMS API request error:', e.message);
              resolve({ success: false, error: e.message });
            });
            req.write(payload);
            req.end();
          });
          return result;
        } catch (apiErr) {
          console.error('Generic SMS API error:', apiErr);
          return { success: false, error: apiErr.message };
        }
      }

      // Fallback to mock if no provider configured
      console.log(`📱 [MOCK - no provider configured] SMS to ${phoneNumber}: ${message}`);
      return { success: true, messageId: 'mock_' + Date.now() };

    } catch (error) {
      console.error('SMS sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send bulk payment completion notification
  async sendBulkPaymentComplete(summary) {
    try {
      const subject = `Bulk Payment Completed - ${summary.month}/${summary.year}`;
      const message = `
        Bulk Payment Processing Complete
        
        Summary:
        - Successful Payments: ${summary.successful}
        - Failed Payments: ${summary.failed}
        - Total Amount: ETB ${summary.totalAmount.toLocaleString()}
        - Month/Year: ${summary.month}/${summary.year}
        
        Please review the detailed report in the system.
        
        Salale University Meal Attendance System
      `;

      // Send email notification to admin
      if (process.env.GMAIL_USER && this.emailTransporter) {
        await this.emailTransporter.sendMail({
          from: process.env.GMAIL_USER,
          to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
          subject: subject,
          text: message
        });
      }

      // Send SMS notification if configured
      if (process.env.ADMIN_PHONE) {
        const smsMessage = `Bulk payment complete: ${summary.successful} successful, ${summary.failed} failed. Total: ETB ${summary.totalAmount.toLocaleString()}`;
        await this.sendSMS(process.env.ADMIN_PHONE, smsMessage);
      }

      return { success: true };

    } catch (error) {
      console.error('Notification sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send SMS notification
  async sendSMS(phoneNumber, message) {
    try {
      if (this.smsProvider === 'mock') {
        console.log(`📱 SMS to ${phoneNumber}: ${message}`);
        return { success: true };
      }

      if (this.smsProvider === 'twilio') {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_FROM_NUMBER;
        if (!accountSid || !authToken || !fromNumber) {
          console.error('Twilio credentials missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER');
          return { success: false, error: 'Twilio credentials missing' };
        }
        const https = require('https');
        const querystring = require('querystring');
        const postData = querystring.stringify({
          To: phoneNumber,
          From: fromNumber,
          Body: message
        });
        const options = {
          host: 'api.twilio.com',
          path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
          }
        };
        const result = await new Promise((resolve) => {
          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve({ success: true });
              } else {
                console.error('Twilio SMS error:', res.statusCode, data);
                resolve({ success: false, error: `Twilio error ${res.statusCode}` });
              }
            });
          });
          req.on('error', (e) => {
            console.error('Twilio request error:', e.message);
            resolve({ success: false, error: e.message });
          });
          req.write(postData);
          req.end();
        });
        return result;
      }

      if (this.smsApiUrl && this.smsApiKey) {
        const https = require('https');
        const url = new URL(this.smsApiUrl);
        const payload = JSON.stringify({ to: phoneNumber, message });
        const options = {
          hostname: url.hostname,
          path: url.pathname + (url.search || ''),
          method: 'POST',
          port: url.port || 443,
          headers: {
            'Authorization': `Bearer ${this.smsApiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        };
        const result = await new Promise((resolve) => {
          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve({ success: true });
              } else {
                console.error('SMS API error:', res.statusCode, data);
                resolve({ success: false, error: `SMS API error ${res.statusCode}` });
              }
            });
          });
          req.on('error', (e) => {
            console.error('SMS API request error:', e.message);
            resolve({ success: false, error: e.message });
          });
          req.write(payload);
          req.end();
        });
        return result;
      }

      console.log(`📱 [MOCK - no provider configured] SMS to ${phoneNumber}: ${message}`);
      return { success: true };

    } catch (error) {
      console.error('SMS error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send payment failure alerts
  async sendPaymentFailureAlert(failedPayments, month, year) {
    try {
      const subject = `Payment Failures Alert - ${month}/${year}`;
      const failureList = failedPayments.map(p => 
        `- ${p.name} (${p.studentId}): ${p.error}`
      ).join('\n');

      const message = `
        Payment Failure Alert
        
        ${failedPayments.length} payments failed for ${month}/${year}:
        
        ${failureList}
        
        Please review and retry failed payments manually.
        
        Salale University Meal Attendance System
      `;

      if (process.env.GMAIL_USER && this.emailTransporter) {
        await this.emailTransporter.sendMail({
          from: process.env.GMAIL_USER,
          to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
          subject: subject,
          text: message
        });
      }

      return { success: true };

    } catch (error) {
      console.error('Alert sending error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();
