function testEmailSending() {
  var testEmail = "sunnymehre451@gmail.com"; // Replace with your email to test
  var subject = "🔔 Test Email from LeadFlow v15.0";
  var body = "<h1>It Works!</h1><p>This is a test email to verify that the GAS script can send emails.</p>";
  
  Logger.log("Testing email to: " + testEmail);
  
  try {
    MailApp.sendEmail({
      to: testEmail,
      subject: subject,
      htmlBody: body
    });
    Logger.log("✅ SUCCESS: Email sent successfully!");
  } catch (e) {
    Logger.log("❌ FAILED: " + e.message);
  }
  
  var quota = MailApp.getRemainingDailyQuota();
  Logger.log("ℹ️ Remaining Email Quota: " + quota);
}
