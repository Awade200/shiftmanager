import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  location: string;
  duration: number;
  earnings: number;
  mobile_number: string;
}

interface NotificationPreference {
  mobile_number: string;
  email: string | null;
  phone_number: string | null;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  reminder_hours_before: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔔 Starting shift reminder check...');

    // Calculate target time window (12 hours from now ± 30 minutes)
    const now = new Date();
    const targetTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000);
    const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000);

    console.log(`Looking for shifts between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

    // Get all shifts in the target window
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*')
      .gte('date', windowStart.toISOString().split('T')[0])
      .lte('date', windowEnd.toISOString().split('T')[0]);

    if (shiftsError) {
      console.error('Error fetching shifts:', shiftsError);
      throw shiftsError;
    }

    console.log(`Found ${shifts?.length || 0} shifts to check`);

    const notifications: Array<{ shift: Shift; prefs: NotificationPreference }> = [];

    // For each shift, check if it's in the time window and get preferences
    for (const shift of shifts || []) {
      const shiftDateTime = new Date(`${shift.date}T${shift.start_time}`);
      
      if (shiftDateTime >= windowStart && shiftDateTime <= windowEnd) {
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('mobile_number', shift.mobile_number)
          .single();

        if (prefs && (prefs.email_enabled || prefs.whatsapp_enabled)) {
          notifications.push({ shift, prefs });
        }
      }
    }

    console.log(`Sending ${notifications.length} notifications`);

    // Send notifications
    for (const { shift, prefs } of notifications) {
      const message = formatShiftMessage(shift);

      // Send Email
      if (prefs.email_enabled && prefs.email) {
        try {
          await sendEmail(shift, prefs.email, message);
          await logNotification(supabase, shift.id, shift.mobile_number, 'email', 'sent');
          console.log(`✅ Email sent to ${prefs.email}`);
        } catch (error) {
          console.error('Email error:', error);
          await logNotification(supabase, shift.id, shift.mobile_number, 'email', 'failed', error.message);
        }
      }

      // Send WhatsApp
      if (prefs.whatsapp_enabled && prefs.phone_number) {
        try {
          await sendWhatsApp(shift, prefs.phone_number, message);
          await logNotification(supabase, shift.id, shift.mobile_number, 'whatsapp', 'sent');
          console.log(`✅ WhatsApp sent to ${prefs.phone_number}`);
        } catch (error) {
          console.error('WhatsApp error:', error);
          await logNotification(supabase, shift.id, shift.mobile_number, 'whatsapp', 'failed', error.message);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: notifications.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-shift-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function formatShiftMessage(shift: Shift): string {
  return `🔔 Shift Reminder

📅 Date: ${new Date(shift.date).toLocaleDateString('en-GB')}
⏰ Time: ${shift.start_time} - ${shift.end_time}
👤 Client: ${shift.client_name}
📍 Location: ${shift.location || 'N/A'}
⏱️ Duration: ${shift.duration} hours
💰 Earnings: £${shift.earnings.toFixed(2)}

Your shift starts in 12 hours!`;
}

async function sendEmail(shift: Shift, email: string, message: string) {
  const { error } = await resend.emails.send({
    from: 'Shift Reminders <onboarding@resend.dev>',
    to: [email],
    subject: `🔔 Shift Reminder - ${shift.client_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Shift Reminder</h2>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>📅 Date:</strong> ${new Date(shift.date).toLocaleDateString('en-GB')}</p>
          <p style="margin: 10px 0;"><strong>⏰ Time:</strong> ${shift.start_time} - ${shift.end_time}</p>
          <p style="margin: 10px 0;"><strong>👤 Client:</strong> ${shift.client_name}</p>
          <p style="margin: 10px 0;"><strong>📍 Location:</strong> ${shift.location || 'N/A'}</p>
          <p style="margin: 10px 0;"><strong>⏱️ Duration:</strong> ${shift.duration} hours</p>
          <p style="margin: 10px 0;"><strong>💰 Earnings:</strong> £${shift.earnings.toFixed(2)}</p>
        </div>
        <p style="color: #059669; font-weight: bold;">Your shift starts in 12 hours!</p>
      </div>
    `,
  });

  if (error) throw error;
}

async function sendWhatsApp(shift: Shift, phoneNumber: string, message: string) {
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  const accessToken = Deno.env.get('WHATSAPP_CLOUD_ACCESS_TOKEN');

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp credentials not configured');
  }

  const response = await fetch(
    `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber.replace(/\s+/g, ''),
        type: 'text',
        text: { body: message },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WhatsApp API error: ${error}`);
  }
}

async function logNotification(
  supabase: any,
  shiftId: string,
  mobileNumber: string,
  channel: string,
  status: string,
  errorMessage?: string
) {
  await supabase.from('notification_log').insert({
    shift_id: shiftId,
    mobile_number: mobileNumber,
    channel,
    status,
    error_message: errorMessage || null,
  });
}
