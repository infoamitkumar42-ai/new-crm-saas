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

    // ⏳ 6 Second Timeout (Vercel Limit is 10s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(scriptUrl, {
        method: "POST",
        body: JSON.stringify({ action: "createSheet", email, name }),
        headers: { "Content-Type": "text/plain" },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      return res.status(200).json({ sheetUrl: data.sheetUrl });

    } catch (e: any) {
      // ✅ MAGIC FIX: Agar timeout ho jaye, tab bhi ERROR MAT DO.
      // Success bhejo, bas sheetUrl null rakho. Dashboard handle kar lega.
      console.log("Sheet creation slow, skipping wait.");
      return res.status(200).json({ sheetUrl: null, status: "slow_connection" });
    }

  } catch (error: any) {
    // Ye critical server error hai
    return res.status(500).json({ error: error.message });
  }
}
