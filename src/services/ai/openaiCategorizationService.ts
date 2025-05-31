
import OpenAI from 'openai';

const PERSONALITY_BUCKETS = {
  "Digital Marketing & Content Creation Skills": "Focuses on online advertising, SEO, social media strategy, content writing, graphic design, and video creation.",
  "Entrepreneurship & Business Development": "Relates to starting and growing businesses, business strategy, sales, leadership, innovation, and networking.",
  "Fitness, Nutrition & Weight Management": "Covers physical exercise, healthy eating, dietary plans, weight loss methods, sports, and physical well-being.",
  "Holistic Wellness & Natural Living": "Emphasizes natural remedies, organic lifestyle, mindfulness, yoga, meditation, herbalism, and alternative health practices.",
  "Investing, Finance & Wealth Creation": "Pertains to personal finance, stock market, real estate, cryptocurrency, financial planning, and building wealth.",
  "Longevity & Regenerative Health": "Concerns anti-aging techniques, regenerative medicine, biohacking, healthspan optimization, and advanced wellness.",
  "Mental & Emotional Well-being": "Addresses mental health, emotional intelligence, stress management, psychology, therapy, and personal development.",
  "Self-Reliance & Preparedness": "Focuses on self-sufficiency, survival skills, homesteading, emergency preparedness, and off-grid living.",
  "Targeted Health Solutions & Disease Management": "Relates to specific medical conditions, disease prevention, treatment options, and managing chronic illnesses.",
  "Women's Health & Community": "Topics specific to women's physiological and psychological health, empowerment, and community building for women."
};

// Get API key from Supabase secrets
const getOpenAIApiKey = async (): Promise<string> => {
  const { supabase } = await import("@/integrations/supabase/client");
  
  try {
    const { data, error } = await supabase.functions.invoke('get-secret', {
      body: { name: 'OPENAI_API_KEY' }
    });
    
    if (error) {
      console.error('Error getting OpenAI API key from Supabase:', error);
      throw new Error('Failed to retrieve OpenAI API key from secure storage');
    }
    
    if (!data?.value) {
      throw new Error('OpenAI API key not found in secure storage');
    }
    
    return data.value;
  } catch (error) {
    console.error('Error accessing OpenAI API key:', error);
    throw new Error('OpenAI API key not available. Please check your Supabase configuration.');
  }
};

export const categorizeContactWithAI = async (
  contactTags: string[],
  summitHistory: string[] = []
): Promise<string> => {
  console.log('=== Starting AI categorization ===');
  console.log('Contact tags:', contactTags);
  console.log('Summit history:', summitHistory);
  
  // Get API key from Supabase secrets
  let openaiApiKey: string;
  try {
    openaiApiKey = await getOpenAIApiKey();
    console.log('OpenAI API key retrieved from Supabase secrets');
  } catch (error) {
    console.error('Failed to get OpenAI API key:', error);
    throw error;
  }

  if (!contactTags.length && !summitHistory.length) {
    console.log('No data provided, using default category');
    return "Digital Marketing & Content Creation Skills"; // Default fallback
  }

  // Combine contact data into a prompt
  const contactData = [
    ...contactTags,
    ...summitHistory
  ].join(', ');

  console.log('Combined contact data:', contactData);

  const bucketList = Object.entries(PERSONALITY_BUCKETS)
    .map(([name, desc]) => `${name}: ${desc}`)
    .join('\n');

  const prompt = `You are a contact categorization expert. Based on the following contact data (tags and summit history), assign this contact to ONE of the 10 personality type buckets.

Contact Data: ${contactData}

Available Buckets:
${bucketList}

Instructions:
- Analyze the contact's tags and summit history semantically
- Choose the SINGLE best-fitting bucket based on the contact's interests and activities
- Consider the semantic meaning, not just keyword matching
- If uncertain, choose the most relevant bucket based on the dominant themes
- Respond with ONLY the exact bucket name, nothing else

Bucket:`;

  try {
    console.log('Making request to OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a precise categorization system. Always respond with exactly one of the provided bucket names."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.1
      })
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const bucketName = data.choices[0]?.message?.content?.trim();
    
    console.log('OpenAI returned bucket name:', bucketName);
    
    // Validate the response is one of our buckets
    if (bucketName && Object.keys(PERSONALITY_BUCKETS).includes(bucketName)) {
      console.log('Valid bucket name returned:', bucketName);
      return bucketName;
    }
    
    // Fallback if AI response is invalid
    console.warn('Invalid AI response, using fallback categorization:', bucketName);
    return fallbackCategorization(contactTags, summitHistory);
    
  } catch (error) {
    console.error('Error with OpenAI categorization:', error);
    return fallbackCategorization(contactTags, summitHistory);
  }
};

const fallbackCategorization = (contactTags: string[], summitHistory: string[]): string => {
  const allData = [...contactTags, ...summitHistory].join(' ').toLowerCase();
  
  console.log('Using fallback categorization for data:', allData);
  
  // Simple keyword-based fallback
  if (allData.includes('business') || allData.includes('entrepreneur') || allData.includes('marketing')) {
    console.log('Fallback: Assigned to Entrepreneurship & Business Development');
    return "Entrepreneurship & Business Development";
  }
  if (allData.includes('health') || allData.includes('fitness') || allData.includes('nutrition')) {
    console.log('Fallback: Assigned to Fitness, Nutrition & Weight Management');
    return "Fitness, Nutrition & Weight Management";
  }
  if (allData.includes('finance') || allData.includes('invest') || allData.includes('crypto')) {
    console.log('Fallback: Assigned to Investing, Finance & Wealth Creation');
    return "Investing, Finance & Wealth Creation";
  }
  if (allData.includes('wellness') || allData.includes('natural') || allData.includes('organic')) {
    console.log('Fallback: Assigned to Holistic Wellness & Natural Living');
    return "Holistic Wellness & Natural Living";
  }
  
  console.log('Fallback: Using default category');
  return "Digital Marketing & Content Creation Skills"; // Default
};

export const ensurePersonalityBucketsExist = async () => {
  const { supabase } = await import("@/integrations/supabase/client");
  
  console.log('Ensuring personality type buckets exist...');
  
  for (const [bucketName, description] of Object.entries(PERSONALITY_BUCKETS)) {
    console.log(`Checking for personality bucket: ${bucketName}`);
    
    const { data: existing, error: checkError } = await supabase
      .from('customer_categories')
      .select('id')
      .eq('name', bucketName)
      .eq('category_type', 'personality')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for personality bucket:', bucketName, checkError);
      continue;
    }

    if (!existing) {
      console.log(`Creating personality bucket: ${bucketName}`);
      const { error: insertError } = await supabase
        .from('customer_categories')
        .insert({
          name: bucketName,
          description: description,
          category_type: 'personality',
          color: getRandomColor()
        });

      if (insertError) {
        console.error('Error creating personality bucket:', bucketName, insertError);
      } else {
        console.log('Successfully created personality bucket:', bucketName);
      }
    } else {
      console.log(`Personality bucket already exists: ${bucketName}`);
    }
  }
  
  console.log('Finished ensuring personality buckets exist');
};

const getRandomColor = (): string => {
  const colors = [
    'bg-purple-500', 'bg-indigo-500', 'bg-pink-500', 'bg-rose-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-lime-500',
    'bg-amber-500', 'bg-red-500'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
