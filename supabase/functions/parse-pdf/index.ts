import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file } = await req.json();
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Parsing PDF file');

    // Decode base64 file
    const pdfData = Uint8Array.from(atob(file), c => c.charCodeAt(0));
    
    // Use pdf-parse library to extract text
    const pdfParse = await import("https://esm.sh/pdf-parse@1.1.1");
    const data = await pdfParse.default(pdfData);
    
    console.log(`Extracted ${data.text.length} characters from PDF`);

    return new Response(
      JSON.stringify({ 
        text: data.text,
        pages: data.numpages 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error parsing PDF:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to parse PDF',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
