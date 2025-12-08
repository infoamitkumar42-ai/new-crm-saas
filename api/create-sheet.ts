import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. CORS Headers (Zaroori hai taaki Vercel aur Browser baat kar sakein)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle Options pre-flight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name } = req.body;

    // 2. URL Check
    const scriptUrl = process.env.VITE_APPS_SCRIPT_URL || process.env.APPS_SCRIPT_URL;

    if (!scriptUrl) {
      console.error("CRITICAL: VITE_APPS_SCRIPT_URL missing hai.");
      return res.status(500).json({ error: "Server config error: Script URL missing" });
    }

    // 3. Google Apps Script Call
    // Fix: Hum 'action' bhej rahe hain aur Content-Type 'text/plain' rakh rahe hain
    const response = await fetch(scriptUrl, {
      method: "POST",
      body: JSON.stringify({ 
        action: "createSheet", // Ye field zaroori hai!
        email: email, 
        name: name 
      }),
      headers: { "Content-Type": "text/plain" },
    });

    // 4. Response Parsing
    const data = await response.json();

    if (data.result === 'error') {
      throw new Error(data.error || "Google Script returned an error");
    }

    if (!data.sheetUrl) {
      throw new Error("No sheet URL returned from Google");
    }

    // Success!
    return res.status(200).json({ sheetUrl: data.sheetUrl });

  } catch (error: any) {
    console.error("Create Sheet API Error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to create sheet",
      details: "Check Vercel Logs"
    });
  }
}