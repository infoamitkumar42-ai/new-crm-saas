
/**
 * 📧 MANUAL NOTIFICATION SCRIPT FOR TANU
 * =====================================
 * Instructions:
 * 1. Copy this code.
 * 2. Go to script.google.com -> New Project.
 * 3. Paste this code.
 * 4. Run the function 'sendTanuAlert'.
 * 5. Grant permissions when asked.
 */

function sendTanuAlert() {
  var email = 'dhawantanu536@gmail.com'; // Tanu's Email
  var subject = '🚨 ACTION REQUIRED: 4 New Leads Assigned + Important Settings';
  
  var htmlBody = 
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:2px solid #E11D48;border-radius:12px;">' +
    
    // Header
    '<h2 style="color:#E11D48;text-align:center;">🔔 URGENT UPDATE</h2>' +
    '<p>Hi <strong>Tanu</strong>,</p>' +
    '<p>You have received <strong>4 NEW LEADS</strong> today, but our system noticed that receiving notifications on your phone failed.</p>' +
    
    // WARNING SECTION
    '<div style="background:#FEF2F2;border:1px solid #FCA5A5;padding:15px;border-radius:8px;margin:20px 0;">' +
    '<h3 style="margin-top:0;color:#991B1B;">⚠️ CRITICAL: Enable Notifications</h3>' +
    '<p style="color:#7F1D1D;margin-bottom:0;">Your phone is <strong>NOT registered</strong> to receive alerts. To fix this:</p>' +
    '<ol style="color:#7F1D1D;margin-top:5px;">' +
    '<li>Open the CRM App on your phone.</li>' +
    '<li>Log out and Log back in (Authorize).</li>' +
    '<li>When asked <strong>"Allow Notifications?"</strong>, click <strong>ALLOW</strong>.</li>' +
    '</ol>' +
    '</div>' +
    
    // LEAD DETAILS
    '<h3>📋 Leads Assigned Today:</h3>' +
    
    // Lead 1
    '<div style="background:#F3F4F6;padding:10px;margin-bottom:10px;border-radius:6px;">' +
    '<strong>1. Rohit Chaudhary</strong><br>' +
    '🕒 4:34 PM | 📍 Maharashtra<br>' +
    '<span style="color:#2563EB;">Dashboard Status: Adjusted to 4</span>' +
    '</div>' +

    // Lead 2
    '<div style="background:#F3F4F6;padding:10px;margin-bottom:10px;border-radius:6px;">' +
    '<strong>2. Sonu Singh Dhaliwal</strong><br>' +
    '🕒 4:33 PM | 📍 India<br>' +
    '</div>' +

    // Lead 3
    '<div style="background:#F3F4F6;padding:10px;margin-bottom:10px;border-radius:6px;">' +
    '<strong>3. Netar Singh Bheem</strong><br>' +
    '🕒 4:32 PM | 📍 India<br>' +
    '</div>' +

    // Lead 4
    '<div style="background:#F3F4F6;padding:10px;margin-bottom:10px;border-radius:6px;">' +
    '<strong>4. Deep Mattu</strong><br>' +
    '🕒 12:26 AM | 📍 India<br>' +
    '</div>' +

    '<p style="text-align:center;margin-top:30px;">' +
    '<a href="https://crm.myleadflow.com" style="background:#E11D48;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">OPEN DASHBOARD</a>' +
    '</p>' +
    
    '</div>';

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });

  Logger.log('✅ Email sent to ' + email);
}
