
import { serve } from "serverless-runtime";

serve(async (req) => {
  try {
    const { email, name } = await req.json();

    console.log("Creating sheet for:", email);

    // Use environment variable or fallback to the specific URL provided
    const scriptUrl = process.env.APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbwCky1SbW_SvqyGvaoCxGR7SPYTbkSpIP7_XWkcqKcBNXao3eeOnky3ao-3DXjJUFJW/exec";

    const resp = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });

    const data = await resp.json();
    console.log("Apps Script Response:", data);

    if (!data.sheetUrl) {
      return new Response(
        JSON.stringify({ error: "Sheet creation failed", raw: data }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ sheetUrl: data.sheetUrl }), {
      status: 200,
    });
  } catch (err) {
    console.log("ERROR CREATE SHEET:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});
