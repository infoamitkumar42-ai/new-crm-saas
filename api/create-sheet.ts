import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { email, name } = req.body;
    const scriptUrl = process.env.VITE_APPS_SCRIPT_URL || process.env.APPS_SCRIPT_URL;

    if (!scriptUrl) {
        console.error("Script URL missing");
        // Script URL nahi hai tab bhi success bhejo taaki user dashboard mein ghus sake
        return res.status(200).json({ sheetUrl: null, error: "Config Missing" }); 
    }

    // ⚡ SUPER FAST TIMEOUT (4 Seconds Only)
    // Google agar 4 second se zyada le, toh hum connection tod denge
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

    // Race: Timer vs Google
    const response: any = await Promise.race([fetchPromise, timeoutPromise]);

    if (response.timedOut) {
      console.log("⚠️ Google took too long. Proceeding to Dashboard anyway.");
      // Timeout hone par bhi SUCCESS (200) bhejo
      return res.status(200).json({ sheetUrl: null, status: "slow_connection" });
    }

    const data = await response.json();
    return res.status(200).json({ sheetUrl: data.sheetUrl });

  } catch (error: any) {
    console.error("API Error:", error);
    // Kisi bhi haal mein error mat bhejo, User ko Dashboard chahiye!
    return res.status(200).json({ sheetUrl: null, error: error.message });
  }
}
