import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { email, name } = req.body;
    const scriptUrl = process.env.VITE_APPS_SCRIPT_URL || process.env.APPS_SCRIPT_URL;

    if (!scriptUrl) return res.status(500).json({ error: "Script URL missing" });

    // ⚡ SUPER STRICT TIMEOUT (4 Seconds)
    // Vercel 10s deta hai, hum 4s mein hi cut kar denge taaki error na aaye.
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve({ timedOut: true });
      }, 4000);
    });

    const fetchPromise = fetch(scriptUrl, {
      method: "POST",
      body: JSON.stringify({ action: "createSheet", email, name }),
      headers: { "Content-Type": "text/plain" },
    });

    // Race lagao: Kaun pehle khatam hota hai? (Google ya Timer)
    const response: any = await Promise.race([fetchPromise, timeoutPromise]);

    // Agar Timer jeet gaya (Google slow tha)
    if (response.timedOut) {
      console.log("⚠️ Google Sheet slow hai, skipping wait to save Dashboard.");
      // Frontend ko bolo sab theek hai, bas sheetUrl null hai
      return res.status(200).json({ sheetUrl: null, status: "slow_connection" });
    }

    // Agar Google jeet gaya (Sheet ban gayi)
    const data = await response.json();
    return res.status(200).json({ sheetUrl: data.sheetUrl });

  } catch (error: any) {
    console.error("API Error:", error);
    // Error mat bhejo, 200 OK bhejo taaki user Dashboard mein ghus sake
    return res.status(200).json({ sheetUrl: null, error: error.message });
  }
}
