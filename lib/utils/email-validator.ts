export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  '10minutemail.com',
  'throwawaymail.com',
  'yopmail.com',
  'getairmail.com',
  'dispostable.com',
  'tempmail.net',
  'maildrop.cc',
  'tempmail.ninja',
  'tempmailaddress.com',
  'temp-mail.com',
  'tempmaildrop.com',
  'tempmail.plus',
  'temp-mail.io',
  'tempmail.co.com',
  'trashmail.com',
  'sharklasers.com',
  'guerrillamail.net',
  'guerrillamail.biz',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'spam4.me',
  'grr.la',
  'dropmail.me'
]);

export function isValidEmailDomain(email: string): { isValid: boolean; error?: string } {
  if (!email || !email.includes('@')) {
    return { isValid: false, error: 'Invalid email address format.' };
  }

  const domain = email.split('@')[1]?.toLowerCase().trim();
  
  if (!domain) {
    return { isValid: false, error: 'Invalid email address domain.' };
  }

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { isValid: false, error: 'Disposable email addresses are not allowed.' };
  }

  const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return { isValid: false, error: 'Invalid email domain format.' };
  }

  return { isValid: true };
}
