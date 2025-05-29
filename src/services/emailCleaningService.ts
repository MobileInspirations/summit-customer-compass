
interface EmailValidationResult {
  email: string;
  isValid: boolean;
  reason?: string;
}

interface TrueListResponse {
  email: string;
  result: 'valid' | 'invalid' | 'disposable' | 'risky' | 'unknown';
  reason?: string;
}

const TRUELIST_API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjNiODZjMGY1LTI2M2ItNDY0Mi1iZDM2LTZjMTdjOTJjMTUyNSIsImV4cGlyZXNfYXQiOm51bGx9.D-LIILY4-D4fj8yADyF0wfdKcb0FdBqXTUJB0ioSrEA";
const TRUELIST_API_URL = "https://api.truelist.io/v1/verify";

export const validateEmail = async (email: string): Promise<EmailValidationResult> => {
  try {
    const response = await fetch(TRUELIST_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRUELIST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`TrueList API error: ${response.status}`);
    }

    const result: TrueListResponse = await response.json();
    
    return {
      email: result.email,
      isValid: result.result === 'valid',
      reason: result.reason,
    };
  } catch (error) {
    console.error(`Error validating email ${email}:`, error);
    // Return as valid if validation fails to avoid blocking exports
    return {
      email,
      isValid: true,
      reason: 'Validation service unavailable',
    };
  }
};

export const validateEmailsBatch = async (
  emails: string[],
  onProgress?: (processed: number, total: number, validEmails: number) => void
): Promise<string[]> => {
  console.log(`Starting email validation for ${emails.length} emails`);
  
  const validEmails: string[] = [];
  const batchSize = 5000; // Process emails in batches of 5,000 to improve performance
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    // Process batch in parallel with some delay to respect rate limits
    const batchPromises = batch.map((email, index) => 
      new Promise<EmailValidationResult>(resolve => {
        setTimeout(async () => {
          const result = await validateEmail(email);
          resolve(result);
        }, index * 100); // 100ms delay between requests
      })
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    // Filter valid emails
    batchResults.forEach(result => {
      if (result.isValid) {
        validEmails.push(result.email);
      }
    });
    
    // Report progress
    if (onProgress) {
      onProgress(i + batch.length, emails.length, validEmails.length);
    }
    
    // Add delay between batches
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`Email validation complete: ${validEmails.length}/${emails.length} valid emails`);
  return validEmails;
};
