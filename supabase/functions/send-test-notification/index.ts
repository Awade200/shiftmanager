import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestNotificationRequest {
  channel: 'email' | 'whatsapp';
  email?: string;
  phone_number?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channel, email, phone_number }: TestNotificationRequest = await req.json();

    if (channel === 'email') {
      if (!email) {
        throw new Error('Email address is required');
      }

      const emailResponse = await resend.emails.send({
        from: "Shift Tracker <onboarding@resend.dev>",
        to: [email],
        subject: "Test Email Notification",
        html: `
          <h1>Test Email Notification</h1>
          <p>This is a test email from your Shift Tracker app.</p>
          <p>If you're receiving this, your email notifications are configured correctly!</p>
        `,
      });

      console.log("Test email sent successfully:", emailResponse);

      return new Response(JSON.stringify({ success: true, message: 'Test email sent' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (channel === 'whatsapp') {
      if (!phone_number) {
        throw new Error('Phone number is required');
      }

      const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_CLOUD_ACCESS_TOKEN");
      const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

      if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
        throw new Error('WhatsApp credentials not configured');
      }

      const whatsappResponse = await fetch(
        `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone_number,
            type: 'text',
            text: {
              body: '🎉 Test WhatsApp Notification\n\nThis is a test message from your Shift Tracker app. If you\'re receiving this, your WhatsApp notifications are configured correctly!',
            },
          }),
        }
      );

      if (!whatsappResponse.ok) {
        const errorData = await whatsappResponse.json();
        console.error('WhatsApp API error:', errorData);
        throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`);
      }

      const result = await whatsappResponse.json();
      console.log("Test WhatsApp sent successfully:", result);

      return new Response(JSON.stringify({ success: true, message: 'Test WhatsApp sent' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    throw new Error('Invalid channel specified');
  } catch (error: any) {
    console.error("Error in send-test-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
