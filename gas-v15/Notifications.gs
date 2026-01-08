/**
 * ============================================================================
 * LEADFLOW v15.0 - NOTIFICATIONS.GS
 * ============================================================================
 * Notification system with Visual Signaling for night leads
 * Supports: Email, WhatsApp (pluggable), Push (future)
 * ============================================================================
 */

// ============================================================================
// 🔔 MAIN NOTIFICATION ROUTER
// ============================================================================

/**
 * Send lead notification to user via all configured channels
 * @param {Object} user - User object
 * @param {Object} lead - Lead object
 * @param {boolean} isNightLead - Whether this is a backlog/night lead
 */
function sendLeadNotification(user, lead, isNightLead) {
  if (!user || !lead) {
    Logger.log('⚠️ sendLeadNotification: Missing user or lead');
    return;
  }
  
  if (TEST_MODE.SKIP_NOTIFICATIONS) {
    Logger.log('📧 [TEST MODE] Notification skipped for: ' + user.email);
    return;
  }
  
  // Send Email notification
  if (NOTIFICATION_CONFIG.ENABLE_EMAIL && user.email) {
    sendEmailAlert(user, lead, isNightLead);
  }
  
  // Send WhatsApp notification
  if (NOTIFICATION_CONFIG.ENABLE_WHATSAPP && user.phone) {
    sendWhatsAppMessage(user, lead, isNightLead);
  }
  
  // Mark lead as delivered
  markLeadDelivered(lead.id);
}

// ============================================================================
// 📧 EMAIL NOTIFICATIONS
// ============================================================================

/**
 * Send email notification to user
 * Includes visual signaling for night leads
 */
function sendEmailAlert(user, lead, isNightLead) {
  try {
    var userName = user.user_name || user.name || 'Member';
    var leadName = lead.name || 'New Enquiry';
    var leadCity = lead.city || 'India';
    var leadPhone = lead.phone || 'N/A';
    
    // Build subject line
    var subject = isNightLead 
      ? NOTIFICATION_CONFIG.EMAIL_SUBJECT_NIGHT + leadName
      : NOTIFICATION_CONFIG.EMAIL_SUBJECT_REALTIME + leadName;
    
    // Build visual signal for night leads
    var nightBadge = isNightLead ? 
      '<div style="background:#3B82F6;color:white;padding:10px;border-radius:8px;margin-bottom:15px;text-align:center;">' +
      NOTIFICATION_CONFIG.NIGHT_LEAD_ICON + ' ' + NOTIFICATION_CONFIG.NIGHT_LEAD_MESSAGE_HINDI +
      '</div>' : '';
    
    var leadTypeBadge = isNightLead 
      ? '<span style="background:#3B82F6;color:white;padding:4px 8px;border-radius:4px;">🌙 Night Lead</span>'
      : '<span style="background:#22C55E;color:white;padding:4px 8px;border-radius:4px;">⚡ Fresh Lead</span>';
    
    // Email HTML body
    var htmlBody = 
      '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;' +
      'border:2px solid #4F46E5;border-radius:16px;background:#ffffff;">' +
      
      // Header
      '<div style="text-align:center;margin-bottom:20px;">' +
      '<h2 style="color:#4F46E5;margin:0;">🎯 Lead Assigned!</h2>' +
      '</div>' +
      
      // Night lead signal
      nightBadge +
      
      // Greeting
      '<p style="font-size:16px;">Hi <strong>' + userName + '</strong>,</p>' +
      '<p style="color:#6B7280;">You have a new customer waiting for your call.</p>' +
      
      // Lead details card
      '<div style="background:#F8FAFC;padding:20px;border-radius:12px;margin:20px 0;">' +
      '<p style="margin:8px 0;"><strong>👤 Name:</strong> ' + leadName + '</p>' +
      '<p style="margin:8px 0;"><strong>📞 Phone:</strong> ' + leadPhone + '</p>' +
      '<p style="margin:8px 0;"><strong>📍 City:</strong> ' + leadCity + '</p>' +
      '<p style="margin:8px 0;"><strong>📋 Type:</strong> ' + leadTypeBadge + '</p>' +
      '</div>' +
      
      // CTA Button
      '<div style="text-align:center;margin:25px 0;">' +
      '<a href="tel:' + leadPhone + '" style="background:#4F46E5;color:white;' +
      'padding:14px 40px;text-decoration:none;border-radius:8px;font-weight:bold;' +
      'display:inline-block;">📞 CALL NOW</a>' +
      '</div>' +
      
      // Tips
      '<div style="background:#FEF3C7;padding:12px;border-radius:8px;margin-top:15px;">' +
      '<p style="margin:0;font-size:13px;color:#92400E;">' +
      '💡 <strong>Tip:</strong> Call within 5 minutes for 3x higher conversion!' +
      '</p>' +
      '</div>' +
      
      // Footer
      '<div style="text-align:center;margin-top:20px;padding-top:15px;border-top:1px solid #E5E7EB;">' +
      '<p style="color:#9CA3AF;font-size:12px;margin:0;">LeadFlow v' + SYSTEM.VERSION + '</p>' +
      '</div>' +
      
      '</div>';
    
    MailApp.sendEmail({
      to: user.email,
      subject: subject,
      htmlBody: htmlBody
    });
    
    Logger.log('📧 Email sent to: ' + user.email + (isNightLead ? ' 🟦' : ''));
    
  } catch (e) {
    Logger.log('⚠️ Email failed for ' + user.email + ': ' + e.message);
  }
}

// ============================================================================
// 📱 WHATSAPP NOTIFICATIONS
// ============================================================================

/**
 * Send WhatsApp message to user
 * Uses configured WhatsApp API
 */
function sendWhatsAppMessage(user, lead, isNightLead) {
  var config = getConfig();
  
  if (!config.WHATSAPP_API_URL || !config.WHATSAPP_API_KEY) {
    Logger.log('ℹ️ WhatsApp API not configured. Skipping.');
    return;
  }
  
  try {
    var phone = cleanPhone(user.phone);
    if (!phone || phone.length !== 10) {
      Logger.log('⚠️ Invalid user phone for WhatsApp');
      return;
    }
    
    // Format message with visual signal for night leads
    var message = formatWhatsAppMessage(user, lead, isNightLead);
    
    var payload = {
      phone: '91' + phone,
      message: message,
      // Add any API-specific fields here
    };
    
    var options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.WHATSAPP_API_KEY
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(config.WHATSAPP_API_URL, options);
    var code = response.getResponseCode();
    
    if (code >= 200 && code < 300) {
      Logger.log('📱 WhatsApp sent to: ' + phone + (isNightLead ? ' 🟦' : ''));
    } else {
      Logger.log('⚠️ WhatsApp API error: ' + response.getContentText());
    }
    
  } catch (e) {
    Logger.log('⚠️ WhatsApp failed: ' + e.message);
  }
}

/**
 * Format WhatsApp message text
 */
function formatWhatsAppMessage(user, lead, isNightLead) {
  var userName = user.user_name || user.name || 'Member';
  var leadName = lead.name || 'New Enquiry';
  var leadPhone = lead.phone || 'N/A';
  var leadCity = lead.city || 'India';
  
  var nightSignal = isNightLead 
    ? NOTIFICATION_CONFIG.NIGHT_LEAD_ICON + ' *' + NOTIFICATION_CONFIG.NIGHT_LEAD_MESSAGE_HINDI + '*\n\n'
    : '';
  
  var leadType = isNightLead ? '🌙 Night Lead' : '⚡ Fresh Lead';
  
  var message = 
    nightSignal +
    '🎯 *New Lead Assigned!*\n\n' +
    'Hi ' + userName + ',\n\n' +
    '👤 *Name:* ' + leadName + '\n' +
    '📞 *Phone:* ' + leadPhone + '\n' +
    '📍 *City:* ' + leadCity + '\n' +
    '📋 *Type:* ' + leadType + '\n\n' +
    '💡 _Call within 5 mins for best results!_\n\n' +
    '— Team LeadFlow';
  
  return message;
}

// ============================================================================
// 🔔 ADMIN ALERTS
// ============================================================================

/**
 * Send alert to admin
 */
function sendAdminAlert(subject, body) {
  if (!NOTIFICATION_CONFIG.ENABLE_ADMIN_ALERTS) return;
  
  var config = getConfig();
  if (!config.ADMIN_EMAIL) return;
  
  try {
    MailApp.sendEmail({
      to: config.ADMIN_EMAIL,
      subject: '🔔 LeadFlow Alert: ' + subject,
      body: body + '\n\n---\nTime: ' + getTimestampIST() + '\nVersion: ' + SYSTEM.VERSION
    });
    Logger.log('📧 Admin alert sent: ' + subject);
  } catch (e) {
    Logger.log('⚠️ Admin alert failed: ' + e.message);
  }
}

// ============================================================================
// 🧪 TEST FUNCTIONS
// ============================================================================

function testEmailNotification() {
  Logger.log('========== TEST EMAIL NOTIFICATION ==========');
  
  var testUser = {
    user_name: 'Test User',
    email: getConfig().ADMIN_EMAIL,
    phone: '9876543210',
    plan_name: 'Booster'
  };
  
  var testLead = {
    id: 'test-lead-123',
    name: 'Rahul Sharma',
    phone: '9123456789',
    city: 'Mumbai'
  };
  
  // Test real-time lead
  Logger.log('Testing Real-time Lead Email...');
  sendEmailAlert(testUser, testLead, false);
  
  // Test night lead
  Logger.log('Testing Night Lead Email...');
  sendEmailAlert(testUser, testLead, true);
  
  Logger.log('✅ Check inbox for test emails');
}
