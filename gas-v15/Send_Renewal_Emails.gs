/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📧 LEADFLOW RENEWAL EMAIL SCRIPT
 * Run this in Google Apps Script to send renewal emails to expired users
 * ═══════════════════════════════════════════════════════════════════════════════
 */

function sendRenewalEmails() {
  // 7 Users who need renewal
  const users = [
    { name: "Rohit Kumar", email: "rohitgagneja69@gmail.com", plan: "Starter", leads: 57 },
    { name: "Jashandeep Kaur", email: "jashandeepkaur6444@gmail.com", plan: "Starter", leads: 62 },
    { name: "Sneha", email: "sy390588@gmail.com", plan: "Weekly Boost", leads: 121 },
    { name: "Rahul Rai", email: "rrai26597@gmail.com", plan: "Weekly Boost", leads: 105 },
    { name: "Ravenjeet Kaur", email: "ravenjeetkaur@gmail.com", plan: "Weekly Boost", leads: 109 },
    { name: "Palak", email: "palakgharu2025@gmail.com", plan: "Weekly Boost", leads: 96 },
    { name: "Navpreet Kaur", email: "navpreetkaur95271@gmail.com", plan: "Weekly Boost", leads: 118 }
  ];

  users.forEach(user => {
    const subject = `🎯 ${user.name}, Your LeadFlow Journey Continues! Renew Now`;
    const htmlBody = generateEmailHTML(user);
    
    try {
      MailApp.sendEmail({
        to: user.email,
        subject: subject,
        htmlBody: htmlBody
      });
      Logger.log(`✅ Email sent to: ${user.name} (${user.email})`);
    } catch (error) {
      Logger.log(`❌ Failed for ${user.email}: ${error}`);
    }
  });
  
  Logger.log("🎉 All renewal emails sent!");
}

function generateEmailHTML(user) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  
  <!-- Main Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎯 LeadFlow
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Your Partner in Growth
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Greeting -->
              <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 24px;">
                Hi ${user.name}! 👋
              </h2>
              
              <p style="margin: 0 0 25px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                We hope you've been crushing it! 🚀
              </p>
              
              <!-- Achievement Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #047857; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                      🏆 Your Achievement
                    </p>
                    <h3 style="margin: 0; color: #065f46; font-size: 36px; font-weight: 800;">
                      ${user.leads} Leads
                    </h3>
                    <p style="margin: 8px 0 0 0; color: #059669; font-size: 14px;">
                      Delivered on ${user.plan} Plan
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Message -->
              <p style="margin: 0 0 15px 0; color: #475569; font-size: 16px; line-height: 1.7;">
                Your <strong>${user.plan}</strong> plan has completed its journey. You received <strong>${user.leads} fresh leads</strong> – and we delivered every single one with care! 💪
              </p>
              
              <p style="margin: 0 0 30px 0; color: #475569; font-size: 16px; line-height: 1.7;">
                Ready to keep the momentum going? Your next batch of exclusive leads is waiting!
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://leadflow.app/subscription" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 50px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                      🔥 Renew My Plan
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits Reminder -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 35px; background-color: #f8fafc; border-radius: 12px;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0 0 15px 0; color: #1e293b; font-size: 14px; font-weight: 700;">
                      ✨ Why Our Members Love LeadFlow:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #475569; font-size: 14px;">
                          ✅ 100% Exclusive Leads (Not Shared)
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #475569; font-size: 14px;">
                          ✅ Real-time WhatsApp Delivery
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #475569; font-size: 14px;">
                          ✅ Invalid Lead Replacement Guarantee
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #475569; font-size: 14px;">
                          ✅ 5-Star Rated Support Team
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: rgba(255,255,255,0.7); font-size: 14px;">
                Questions? Reply to this email or WhatsApp us!
              </p>
              <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                © 2026 LeadFlow. Made with ❤️ in India
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

// Run this function to send emails
// sendRenewalEmails();
