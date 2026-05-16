export type EmailExample = {
  id: string;
  label: string;
  description: string;
  expected: "PHISHING" | "SUSPICIOUS" | "SAFE";
  raw: string;
};

export const EXAMPLES: EmailExample[] = [
  {
    id: "paypal-classic",
    label: "PayPal account suspended",
    description:
      "Classic credential-harvest with a lookalike domain, urgency, and a fake login link.",
    expected: "PHISHING",
    raw: `Authentication-Results: mx.recipient.com; spf=fail smtp.mailfrom=paypal-secure-help.com; dkim=none; dmarc=fail
Return-Path: <noreply@paypal-secure-help.com>
From: "PayPal Service" <support@paypal-secure-help.com>
Reply-To: paypal-team@protonmail.com
To: <you@recipient.com>
Subject: URGENT: Your PayPal account has been limited - Action required within 24 hours
Date: Mon, 12 May 2026 09:14:21 +0000
Content-Type: text/html; charset="UTF-8"

<html><body style="font-family:Arial">
  <p>Dear Customer,</p>
  <p>We detected unusual sign-in activity on your PayPal account from an unrecognized device.
  For your protection, your account has been temporarily <b>limited</b>.</p>
  <p>You must <b>verify your identity within 24 hours</b> or your account will be permanently suspended
  and any pending balance will be forfeited.</p>
  <p><a href="http://paypal-secure-help.com@198.51.100.42/login.php">https://www.paypal.com/signin</a></p>
  <p>If you do not respond, legal action may be taken to recover any outstanding amounts.</p>
  <p>Sincerely,<br/>PayPal Security Team</p>
</body></html>`,
  },
  {
    id: "ceo-fraud",
    label: "CEO gift-card request",
    description:
      "Business email compromise (BEC): display-name spoof of the boss, plus a free webmail Reply-To.",
    expected: "PHISHING",
    raw: `Authentication-Results: mx.recipient.com; spf=pass smtp.mailfrom=gmail.com; dkim=pass; dmarc=pass
From: "Anna Kowalska - CEO" <annakowalska.ceo.urgent@gmail.com>
Reply-To: a.kowalska.ceo@proton.me
To: <intern@yourcompany.com>
Subject: Quick favor — are you at your desk?
Date: Tue, 13 May 2026 11:02:08 +0000
Content-Type: text/plain; charset="UTF-8"

Hi,

Are you available? I'm in a meeting and cannot make calls. I need you to take care of
something for me ASAP — purchase 5 Apple Gift Cards of $200 each for a client appreciation
program. Once you have them, scratch the back and send me the codes via reply.

I'll reimburse you the moment I'm out. Time-sensitive, please confirm.

Thanks,
Anna
Sent from my iPhone
`,
  },
  {
    id: "microsoft-365",
    label: "Microsoft 365 mailbox full",
    description:
      "Brand impersonation: Microsoft display name from a freshly registered .top domain with a punycode link.",
    expected: "PHISHING",
    raw: `Authentication-Results: mx.recipient.com; spf=fail; dkim=fail; dmarc=fail
From: "Microsoft 365 Team" <no-reply@office365-notice.top>
To: <user@recipient.com>
Subject: [Action Required] Your Microsoft 365 mailbox is 99% full — messages will bounce
Date: Wed, 14 May 2026 06:35:11 +0000
Content-Type: text/html; charset="UTF-8"

<html><body>
  <p>Hello user,</p>
  <p>Your Office 365 mailbox storage is <b>99% full</b>. Incoming messages will start bouncing
     unless you upgrade your quota.</p>
  <p>Click the secure portal below to free up space and verify your account:</p>
  <p><a href="https://xn--micrsoft-uhb.top/quota/verify?u=user">Free up space — Microsoft</a></p>
  <p>This is an automated notice. Please do not reply.</p>
  <p>— The Microsoft 365 Team</p>
</body></html>`,
  },
  {
    id: "shipping-malware",
    label: "DHL package with .zip attachment",
    description:
      "Parcel-delivery lure with a macro-enabled doc and a bit.ly shortener.",
    expected: "PHISHING",
    raw: `Authentication-Results: mx.recipient.com; spf=softfail; dkim=none; dmarc=none
From: "DHL Express" <tracking@dhl-parcel-delivery.click>
To: <you@recipient.com>
Subject: DHL — package #2026-DLV-88142 could not be delivered, schedule re-delivery
Date: Wed, 14 May 2026 18:12:00 +0000
Content-Type: multipart/mixed; boundary="bound1"

--bound1
Content-Type: text/html; charset="UTF-8"

<html><body>
  <p>Dear Customer,</p>
  <p>We attempted to deliver your parcel today but no one was available at the address.
     Customs requires a $2.99 re-delivery fee.</p>
  <p>Track and confirm here: <a href="https://bit.ly/3xK4Q9z">https://tracking.dhl.com/2026-DLV-88142</a></p>
  <p>Full shipping label is attached as a Word document. Enable editing to view.</p>
  <p>DHL Express Customer Service</p>
</body></html>

--bound1
Content-Type: application/vnd.ms-word.document.macroEnabled.12; name="DHL-label.docm"
Content-Disposition: attachment; filename="DHL-label.docm"
Content-Transfer-Encoding: base64

UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRl…
--bound1--`,
  },
  {
    id: "legit-stripe",
    label: "Legit Stripe receipt",
    description:
      "A real-looking transactional email from a verified sender. Use to confirm Sentra doesn't cry wolf.",
    expected: "SAFE",
    raw: `Authentication-Results: mx.recipient.com; spf=pass smtp.mailfrom=stripe.com; dkim=pass header.d=stripe.com; dmarc=pass
Return-Path: <bounce+abc@bounce.stripe.com>
From: "Stripe" <receipts@stripe.com>
To: <you@recipient.com>
Subject: Your receipt from Acme, Inc.  [#1234-5678]
Date: Thu, 15 May 2026 10:00:00 +0000
Content-Type: text/html; charset="UTF-8"

<html><body style="font-family:Helvetica">
  <h2>Receipt from Acme, Inc.</h2>
  <p>Amount paid: <b>$24.00</b><br/>
     Date paid: May 15, 2026<br/>
     Payment method: Visa •••• 4242</p>
  <p>Questions about this charge? Reply to this email or contact Acme directly.</p>
  <p><a href="https://dashboard.stripe.com/receipts/payment/abc123">View receipt</a> ·
     <a href="https://stripe.com/docs/receipts">Help</a></p>
  <p style="color:#888;font-size:12px">You received this email because you made a payment to Acme, Inc.
     Stripe is the payment processor. Your card information is not stored by Acme.</p>
</body></html>`,
  },
];
