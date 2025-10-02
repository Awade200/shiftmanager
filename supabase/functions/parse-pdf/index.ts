import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.11.0";

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
    
    // Use unpdf library to extract text (Deno-compatible)
    const pdf = await getDocumentProxy(pdfData);
    const { text, totalPages } = await extractText(pdf, { mergePages: true });
    
    console.log(`Extracted ${text.length} characters from ${totalPages} pages`);

    return new Response(
      JSON.stringify({ 
        text: text,
        pages: totalPages 
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
