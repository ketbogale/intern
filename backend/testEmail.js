const { verifyEmailService } = require('./src/services/emailService');

async function testEmail() {
  console.log('Testing email service configuration...');
  const isReady = await verifyEmailService();
  
  if (isReady) {
    console.log('✅ Email service is working correctly!');
  } else {
    console.log('❌ Email service failed - check your Gmail App Password');
  }
}

testEmail();
