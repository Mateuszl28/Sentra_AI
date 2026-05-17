export type EmailExample = {
  id: string;
  label: string;
  description: string;
  expected: "PHISHING" | "SUSPICIOUS" | "SAFE";
  raw: string;
  pattern?: string;
};

export const EXAMPLES: EmailExample[] = [
  {
    id: "paypal-classic",
    label: "PayPal account suspended",
    description:
      "Classic credential-harvest with a lookalike domain, urgency, and a fake login link.",
    expected: "PHISHING",
    pattern: "Lookalike domain + urgency + anchor↔href mismatch",
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
    pattern: "Display-name spoof + webmail Reply-To",
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
    pattern: "Punycode homoglyph + suspicious TLD",
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
    pattern: "Parcel lure + macro attachment + URL shortener",
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
    id: "apple-id-lock",
    label: "Apple ID locked",
    description:
      "Credential harvest disguised as an Apple ID security alert from a brand-spoofed sender.",
    expected: "PHISHING",
    pattern: "Brand spoof + urgency + lookalike Apple domain",
    raw: `Authentication-Results: mx.recipient.com; spf=fail smtp.mailfrom=appleid-verify-support.com; dkim=none; dmarc=fail
Return-Path: <noreply@appleid-verify-support.com>
From: "Apple Support" <no-reply@appleid-verify-support.com>
Reply-To: applesupportteam@yandex.com
To: <you@recipient.com>
Subject: [Final Notice] Your Apple ID will be permanently disabled today
Date: Fri, 16 May 2026 08:21:17 +0000
Content-Type: text/html; charset="UTF-8"

<html><body style="font-family:Helvetica">
  <p>Dear Customer,</p>
  <p>We detected a sign-in attempt to your Apple ID from an <b>unrecognized iPhone 15 in Lagos, Nigeria</b>.
     For your protection, your Apple ID has been temporarily locked.</p>
  <p>You must confirm your identity within the next <b>12 hours</b> or your account will be permanently
     disabled and all purchases, photos, and iCloud data will be lost.</p>
  <p style="text-align:center"><a href="https://appleid-verify-support.com/unlock?u=you"
     style="display:inline-block;background:#0071e3;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none">
     Confirm your Apple ID</a></p>
  <p style="color:#666;font-size:11px">Apple Inc. · One Apple Park Way · Cupertino, CA 95014</p>
</body></html>`,
  },
  {
    id: "payroll-redirect",
    label: "Payroll direct-deposit change",
    description:
      "HR-targeted BEC asking to silently redirect an employee's salary. No links, no malware — pure social engineering.",
    expected: "PHISHING",
    pattern: "Business email compromise — bank-account redirect",
    raw: `Authentication-Results: mx.recipient.com; spf=pass smtp.mailfrom=gmail.com; dkim=pass; dmarc=pass
From: "Michael Brown" <michael.brown.exec88@gmail.com>
Reply-To: m.brown.exec@outlook.com
To: <hr@yourcompany.com>
Subject: Direct deposit update — effective this payroll cycle
Date: Fri, 16 May 2026 14:42:00 +0000
Content-Type: text/plain; charset="UTF-8"

Hi,

I switched banks recently and would like to update my direct deposit details
before Friday's payroll run. Please use the new account below:

  Bank: Cross River Bank
  Routing: 021214891
  Account: 884720156332
  Type: Checking

Let me know if you need a voided check — I can scan one tomorrow but timing is
tight for this cycle. Appreciate the quick turnaround.

Thanks,
Michael
Sent from my iPhone`,
  },
  {
    id: "mfa-fatigue",
    label: "Microsoft MFA approval request",
    description:
      "Pretends to be a push-notification approval email from Microsoft Authenticator. Real MFA prompts don't arrive by email.",
    expected: "PHISHING",
    pattern: "MFA-fatigue social engineering",
    raw: `Authentication-Results: mx.recipient.com; spf=fail; dkim=fail; dmarc=fail
From: "Microsoft Authenticator" <security-alerts@microsoft-auth-prompt.co>
To: <you@recipient.com>
Subject: New sign-in request waiting for your approval (request #84-2719)
Date: Sat, 17 May 2026 02:18:00 +0000
Content-Type: text/html; charset="UTF-8"

<html><body style="font-family:Segoe UI">
  <p>A sign-in to your Microsoft account is waiting for approval.</p>
  <table cellpadding="6" style="border:1px solid #eee">
    <tr><td>App</td><td><b>Microsoft 365</b></td></tr>
    <tr><td>Device</td><td>Windows 11, Edge 124</td></tr>
    <tr><td>Location</td><td>Frankfurt, Germany</td></tr>
    <tr><td>Time</td><td>just now</td></tr>
  </table>
  <p style="margin-top:14px">If this was you, tap <b>Approve</b> to continue.</p>
  <p>
    <a href="https://microsoft-auth-prompt.co/approve?id=84-2719"
       style="background:#0078d4;color:#fff;padding:8px 18px;text-decoration:none;border-radius:4px">Approve</a>
    &nbsp;
    <a href="https://microsoft-auth-prompt.co/deny?id=84-2719"
       style="background:#eee;color:#000;padding:8px 18px;text-decoration:none;border-radius:4px">Deny</a>
  </p>
  <p style="color:#888;font-size:11px">Microsoft Corporation · Redmond, WA</p>
</body></html>`,
  },
  {
    id: "invoice-attachment",
    label: "Unpaid invoice (.iso)",
    description:
      "Vendor-impersonation invoice fraud delivering an ISO container — a common 2024-2026 malware loader.",
    expected: "PHISHING",
    pattern: "Invoice lure + ISO malware container",
    raw: `Authentication-Results: mx.recipient.com; spf=softfail; dkim=none; dmarc=none
From: "Accounts Receivable" <billing@invoice-secure-ap.com>
Reply-To: ap.billing@mail.ru
To: <accounting@yourcompany.com>
Subject: Past-due invoice INV-0042118 — payment required to avoid late fees
Date: Fri, 16 May 2026 16:00:00 +0000
Content-Type: multipart/mixed; boundary="bound1"

--bound1
Content-Type: text/html; charset="UTF-8"

<html><body style="font-family:Arial">
  <p>Hello,</p>
  <p>Our records show invoice <b>INV-0042118</b> for <b>$4,820.00</b> is still outstanding
     and is now <b>14 days past due</b>. Please review the attached invoice and remit
     payment by <b>end of business today</b> to avoid a 2.5% late fee.</p>
  <p>If you have any questions, reply directly to this email.</p>
  <p>Best,<br/>Accounts Receivable Team</p>
</body></html>

--bound1
Content-Type: application/octet-stream; name="INV-0042118.iso"
Content-Disposition: attachment; filename="INV-0042118.iso"
Content-Transfer-Encoding: base64

Q0QwMDFISVNPMDl…
--bound1--`,
  },
  {
    id: "linkedin-clone",
    label: "LinkedIn 'You appeared in searches'",
    description:
      "Social-engineering lure with a near-perfect LinkedIn layout but a click-through to a lookalike domain. Subtle — easy to miss.",
    expected: "SUSPICIOUS",
    pattern: "Social-network credential harvest with subtle off-brand domain",
    raw: `Authentication-Results: mx.recipient.com; spf=pass smtp.mailfrom=linkedin-notify.email; dkim=pass header.d=linkedin-notify.email; dmarc=pass
From: "LinkedIn" <notifications@linkedin-notify.email>
To: <you@recipient.com>
Subject: You appeared in 24 searches this week
Date: Sat, 17 May 2026 09:00:00 +0000
Content-Type: text/html; charset="UTF-8"

<html><body style="font-family:Arial">
  <p>Hi,</p>
  <p><b>24 people</b> searched for you on LinkedIn this week — that's more than 80% of users in your network.</p>
  <p>3 of them were recruiters at companies you've shown interest in. Sign in to see who.</p>
  <p><a href="https://linkedin-notify.email/secure-signin?ref=weekly">See who searched for you</a></p>
  <p style="color:#888;font-size:11px">You're receiving this because you have weekly digest enabled in your LinkedIn account.<br/>
     LinkedIn Ireland Unlimited Company. Wilton Plaza, Wilton Place, Dublin 2.</p>
</body></html>`,
  },
  {
    id: "legit-github",
    label: "Legit GitHub security alert",
    description:
      "Real-style notification from GitHub with valid auth and an in-domain link. Confirms Sentra doesn't cry wolf on legitimate security mail.",
    expected: "SAFE",
    pattern: "Verified transactional email",
    raw: `Authentication-Results: mx.recipient.com; spf=pass smtp.mailfrom=github.com; dkim=pass header.d=github.com; dmarc=pass
Return-Path: <noreply@github.com>
From: "GitHub" <noreply@github.com>
To: <you@recipient.com>
Subject: [GitHub] A new SSH key was added to your account
Date: Sat, 17 May 2026 07:14:33 +0000
Content-Type: text/html; charset="UTF-8"

<html><body style="font-family:Helvetica">
  <p>Hi @mateuszl28,</p>
  <p>A new SSH key was added to your account.</p>
  <table cellpadding="4">
    <tr><td>Key fingerprint</td><td><code>SHA256:Wq8u…7nXk</code></td></tr>
    <tr><td>Title</td><td>laptop-2026</td></tr>
    <tr><td>Added</td><td>May 17, 2026 07:14 UTC</td></tr>
  </table>
  <p>If you did not add this key, you should
     <a href="https://github.com/settings/keys">remove it</a> and
     <a href="https://github.com/settings/security">review your account security</a>.</p>
  <p style="color:#888;font-size:11px">GitHub, Inc. · 88 Colin P Kelly Jr St · San Francisco, CA 94107</p>
</body></html>`,
  },
  {
    id: "legit-stripe",
    label: "Legit Stripe receipt",
    description:
      "A real-looking transactional email from a verified sender. Use to confirm Sentra doesn't cry wolf.",
    expected: "SAFE",
    pattern: "Verified transactional email",
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
