import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, phone, company, desiredDomain, listingName, listingUrl } = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not configured in Supabase. Returning fallback trigger.");
      return new Response(
        JSON.stringify({ 
          error: "RESEND_API_KEY is not configured in Supabase. Please configure it in your dashboard settings.",
          fallback: true
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const toEmail = Deno.env.get('NOTIFICATION_EMAIL') || 'omprakashesakkimuthu@gmail.com'
    const emailBody = {
      from: 'Custom Domain Requests <onboarding@resend.dev>',
      to: toEmail,
      subject: `Custom Domain Request: ${listingName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #0077ff; margin-bottom: 20px;">New Custom Domain Request</h2>
          <p>A user has requested a custom domain for their premium page.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; width: 180px;">Requested Domain:</td>
              <td style="padding: 10px 0; color: #0077ff; font-weight: bold;">${desiredDomain || 'Not provided'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">Business Name:</td>
              <td style="padding: 10px 0;">${listingName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">Listing Preview URL:</td>
              <td style="padding: 10px 0;"><a href="${listingUrl}">${listingUrl}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">User Name:</td>
              <td style="padding: 10px 0;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">User Email:</td>
              <td style="padding: 10px 0;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">User Phone:</td>
              <td style="padding: 10px 0;">${phone || 'Not provided'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">Company Name:</td>
              <td style="padding: 10px 0;">${company}</td>
            </tr>
          </table>
          <p style="margin-top: 25px; font-size: 12px; color: #9ca3af;">Sent automatically via Storefries Listing Creator.</p>
        </div>
      `
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailBody),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("Resend API error:", data)
      return new Response(
        JSON.stringify({ error: data.message || "Failed to send email via Resend.", fallback: true }),
        { 
          status: res.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error: any) {
    console.error("Function error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error", fallback: true }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
