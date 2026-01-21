/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎯 LEADFLOW - INACTIVE USER CONVERSION EMAIL
 * High-Converting Interest Trigger Email for Users Who Haven't Purchased Yet
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Strategy: FOMO + Social Proof + Pain Point + Clear CTA
 * Tone: Friendly, Helpful, Not Pushy
 */

function sendConversionEmails() {
  // Inactive Users (Profile Created but No Plan Purchased) - 37 Users
  const users = [
    { name: "Arshpreet", email: "sidhuarsh4071@gmail.com" },
    { name: "Amit", email: "techeducation.kkp@gmail.com" },
    { name: "Pradeep", email: "pradeepleads@gmail.com" },
    { name: "Akangsha", email: "dakangsha@08gmail.com" },
    { name: "Sunita", email: "jhattasunita@gmail.com" },
    { name: "Mandeep", email: "arshrandawa29@gmil.com" },
    { name: "Prabh", email: "gurprabhhundal@gmail.com" },
    { name: "Neha", email: "neharajoria1543@gmail.com" },
    { name: "Priya", email: "priyajotgoyal@gmail.com" },
    { name: "Manavbir", email: "manavbirsingh12@gmail.com" },
    { name: "Shivani", email: "shivanigupta0276@gmail.com" },
    { name: "Punam", email: "kalyanj739@gmail.com" },
    { name: "Komal", email: "goldymahi27@gmail.com" },
    { name: "Kulwant", email: "kulwantsinghdhaliwalsaab@gmail.com" },
    { name: "Lovepreet", email: "lovepreetsinghvicky05@gmail.com" },
    { name: "Sohan", email: "sohanpgk22@gmail.com" },
    { name: "Simran", email: "simrankaurdee9@gmail.com" },
    { name: "Mandeep", email: "mandeepkau340@gmail.com" },
    { name: "Yuail", email: "aryansandhu652@gmail.com" },
    { name: "Daljit", email: "jagdeeppanesar52@gmail.com" },
    { name: "Jashan", email: "didar9915175976@gmail.com" },
    { name: "Harpreet", email: "gurpreetsingh02915@gmail.com" },
    { name: "Jyoti", email: "nasib03062003@gmail.com" },
    { name: "Harjinder", email: "lrai04672@gmail.com" },
    { name: "Sohan", email: "singhsohan58857@gmail.com" },
    { name: "Gurvinder", email: "gurvindermatharu61@gmail.com" },
    { name: "Simranpreet", email: "simransidhu792005@gmail.com" },
    { name: "Jashanpreet", email: "sirmanjeetsingh85530@gmail.com" },
    { name: "Baljinder", email: "jassskaur909@gmail.com" },
    { name: "Swinky", email: "swinkychiku@gmail.com" },
    { name: "Harpreet", email: "harpreetsidhu2141@gmail.com" },
    { name: "Shivani", email: "sandhu16shivani@gmail.com" },
    { name: "Harpreet", email: "harpreetuppal062@gamil.com" },
    { name: "Isha", email: "ishagarg69169@gmail.com" },
    { name: "Shivani", email: "sparklingsoulshivani@icloud.com" },
    { name: "Lakhveer", email: "lakhveerkaur219@gmail.com" },
    { name: "Manjinder", email: "rajveerbrarbrar637@gmail.com" }
  ];

  let successCount = 0;
  let failCount = 0;

  users.forEach(user => {
    const subject = `${user.name}, Your Leads Are Waiting! 🚀`;
    const htmlBody = generateConversionEmail(user.name);
    
    try {
      MailApp.sendEmail({
        to: user.email,
        subject: subject,
        htmlBody: htmlBody
      });
      Logger.log(`✅ Sent to: ${user.name} (${user.email})`);
      successCount++;
    } catch (error) {
      Logger.log(`❌ Failed: ${user.email} - ${error}`);
      failCount++;
    }
  });
  
  Logger.log(`\n🎉 DONE! Success: ${successCount}, Failed: ${failCount}`);
}

function generateConversionEmail(userName) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 50px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -1px;">
                🎯 LeadFlow CRM
              </h1>
              <p style="margin: 15px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px; font-weight: 500;">
                Fresh Leads, Delivered Daily
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 50px 40px;">
              
              <!-- Personal Greeting -->
              <h2 style="margin: 0 0 25px 0; color: #1e293b; font-size: 26px; font-weight: 700;">
                Hi ${userName}! 👋
              </h2>
              
              <!-- Opening Hook (Pain Point) -->
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.8;">
                We noticed you created your LeadFlow account but haven't started receiving leads yet.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #475569; font-size: 16px; line-height: 1.8;">
                <strong style="color: #1e293b;">Here's the thing:</strong> While you're waiting, your competitors are closing deals with the same leads you could be getting. 😬
              </p>
              
              <!-- Social Proof Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; margin-bottom: 30px; border-left: 5px solid #f59e0b;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.7;">
                      <strong style="font-size: 18px;">📊 This Week's Stats:</strong><br><br>
                      ✅ <strong>5,400+</strong> Fresh leads delivered<br>
                      ✅ <strong>68</strong> Active closers receiving leads daily<br>
                      ✅ <strong>94%</strong> Members report increased conversions
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- What You're Missing -->
              <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; font-weight: 700;">
                🔥 What Our Members Get:
              </h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <table width="100%">
                      <tr>
                        <td width="40" style="vertical-align: top;">
                          <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">✓</div>
                        </td>
                        <td style="padding-left: 15px; color: #334155; font-size: 15px;">
                          <strong>Real-time Lead Delivery</strong> – Fresh leads on WhatsApp instantly
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <table width="100%">
                      <tr>
                        <td width="40" style="vertical-align: top;">
                          <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">✓</div>
                        </td>
                        <td style="padding-left: 15px; color: #334155; font-size: 15px;">
                          <strong>100% Exclusive</strong> – Leads are never shared or resold
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <table width="100%">
                      <tr>
                        <td width="40" style="vertical-align: top;">
                          <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">✓</div>
                        </td>
                        <td style="padding-left: 15px; color: #334155; font-size: 15px;">
                          <strong>Invalid Lead Replacement</strong> – Bad lead? We replace it free
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table width="100%">
                      <tr>
                        <td width="40" style="vertical-align: top;">
                          <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">✓</div>
                        </td>
                        <td style="padding-left: 15px; color: #334155; font-size: 15px;">
                          <strong>Smart Dashboard</strong> – Track, manage & close leads easily
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Urgency/FOMO Message -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 16px; margin-bottom: 35px;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="margin: 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                      ⚡ <strong>Today's leads are being distributed right now.</strong><br>
                      <span style="font-weight: 400; font-size: 14px;">Don't let another day pass without getting your share!</span>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Primary CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://www.leadflowcrm.in/" 
                       style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-size: 18px; font-weight: 700; box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4); transition: all 0.3s;">
                      🚀 Start Getting Leads Now
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Secondary Link -->
              <p style="margin: 30px 0 0 0; text-align: center; color: #64748b; font-size: 14px;">
                or visit <a href="https://www.leadflowcrm.in/" style="color: #6366f1; font-weight: 600; text-decoration: none;">www.leadflowcrm.in</a>
              </p>
              
            </td>
          </tr>
          
          <!-- Testimonial Section -->
          <tr>
            <td style="background-color: #f8fafc; padding: 35px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 15px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
                💬 What Members Say
              </p>
              <p style="margin: 0; color: #334155; font-size: 15px; font-style: italic; line-height: 1.7;">
                "LeadFlow changed my business. I was struggling to find clients, now I get 5-7 fresh leads every single day. The quality is amazing!" 
              </p>
              <p style="margin: 10px 0 0 0; color: #6366f1; font-size: 14px; font-weight: 600;">
                — Himanshu S., Supervisor Plan
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 35px 40px; text-align: center;">
              <p style="margin: 0 0 15px 0; color: rgba(255,255,255,0.8); font-size: 14px;">
                Questions? Just reply to this email – we're here to help!
              </p>
              <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                © 2026 LeadFlow CRM | Made with ❤️ for Closers
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

// Test function to preview email
function previewEmail() {
  const html = generateConversionEmail("Test User");
  Logger.log(html);
}
