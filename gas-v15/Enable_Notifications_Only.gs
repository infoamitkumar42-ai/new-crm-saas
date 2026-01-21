
/**
 * 🔔 ENABLE NOTIFICATIONS ALERT SCRIPT
 * ====================================
 * Instructions:
 * 1. Copy this code.
 * 2. Go to script.google.com -> New Project.
 * 3. Paste this code.
 * 4. Run the function 'sendNotificationAlert'.
 */

function sendNotificationAlert() {
  var email = 'dhawantanu536@gmail.com'; // User's Email
  var subject = '⚠️ Action Required: Enable LeadFlow Notifications';
  
  var htmlBody = 
    '<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:25px;border:1px solid #E5E7EB;border-radius:12px;background:#FFFFFF;">' +
    
    // Icon & Header
    '<div style="text-align:center;margin-bottom:20px;">' +
    '<span style="font-size:40px;">🔕</span>' +
    '<h2 style="color:#1F2937;margin:10px 0;">Enable Notifications</h2>' +
    '</div>' +
    
    // Message
    '<p style="color:#4B5563;font-size:16px;line-height:1.5;">Hi <strong>Tanu</strong>,</p>' +
    '<p style="color:#4B5563;font-size:16px;line-height:1.5;">' +
    'We noticed that you are <strong style="color:#DC2626;">missing real-time alerts</strong> for new leads because notifications are disabled on your device.' +
    '</p>' +
    
    // Instructions Box
    '<div style="background:#F3F4F6;padding:20px;border-radius:8px;margin:25px 0;border-left:4px solid #2563EB;">' +
    '<h3 style="margin:0 0 10px 0;color:#1F2937;font-size:16px;">📲 Please follow these steps now:</h3>' +
    '<ol style="color:#374151;margin:0;padding-left:20px;line-height:1.8;">' +
    '<li>Open the <strong>LeadFlow CRM App</strong>.</li>' +
    '<li>Go to <strong>Settings</strong> -> <strong>Logout</strong>.</li>' +
    '<li>Log back in.</li>' +
    '<li>When a popup asks <em>"Allow Notifications?"</em>, tap <strong style="color:#2563EB;">ALLOW</strong>.</li>' +
    '</ol>' +
    '</div>' +

    '<p style="color:#6B7280;font-size:14px;text-align:center;">' +
    'Once enabled, you will receive instant alerts for every new lead assigned to you.' +
    '</p>' +
    
    '</div>';

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });

  Logger.log('✅ Alert email sent to ' + email);
}
