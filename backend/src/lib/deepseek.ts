import { Redis } from 'ioredis';

export interface DeepSeekOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
}

export class DeepSeekService {
  private apiKey: string;
  private redis: Redis | null;

  constructor(
    apiKey?: string,
    redis?: Redis,
    private defaultOptions: DeepSeekOptions = {
      model: 'deepseek-chat',
      temperature: 0.2,
      max_tokens: 5000,
      system_prompt:
        'You are an expert web scraper assistant. Extract and organize the requested information accurately.',
    }
  ) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || '';
    this.redis = redis || null;

    if (!this.apiKey) {
      console.warn(
        'DeepSeek API key is not configured. The service will not work properly.'
      );
    }
  }

  /**
   * Call the DeepSeek API with caching support
   */
  async callDeepSeekAPI(
    prompt: string,
    context: Record<string, any> = {},
    options?: Partial<DeepSeekOptions>
  ): Promise<any> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key is not configured');
    }

    // Merge options with defaults
    const finalOptions = {
      ...this.defaultOptions,
      ...options,
    };

    // Cache key based on the prompt, context and options
    const cacheKey = `deepseek:${Buffer.from(
      JSON.stringify({ prompt, context, options: finalOptions })
    ).toString('base64')}`;

    // Check cache first if Redis is available
    if (this.redis) {
      const cachedResult = await this.redis.get(cacheKey);
      if (cachedResult) {
        try {
          return JSON.parse(cachedResult);
        } catch (e) {
          // If parsing fails, continue with API call
          console.warn('Failed to parse cached DeepSeek result');
        }
      }
    }

    // Call DeepSeek API
    const response = await fetch(
      'https://api.deepseek.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: finalOptions.model,
          messages: [
            {
              role: 'system',
              content: finalOptions.system_prompt,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: finalOptions.temperature,
          max_tokens: finalOptions.max_tokens,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `DeepSeek API error: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();
    const result = responseData.choices[0].message.content;

    // Try to parse the result as JSON if possible
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (e) {
      // If not valid JSON, use the text as is
      parsedResult = { text: result };
    }

    // Cache the result for 30 minutes if Redis is available
    if (this.redis) {
      await this.redis.set(cacheKey, JSON.stringify(parsedResult), 'EX', 1800);
    }

    return parsedResult;
  }

  /**
   * Generate URL based on namespace and prompt
   */
  async generateUrl(
    platformUrl: string,
    prompt: string,
    additionalContext: Record<string, any> = {}
  ): Promise<string> {
    const result = await this.callDeepSeekAPI(
      prompt,
      {
        platformUrl,
        ...additionalContext,
      },
      {
        system_prompt:
          'You are an expert in generating accurate URLs for web scraping. Return only the URL with no additional text.',
        temperature: 0.1,
      }
    );

    if (typeof result === 'string') {
      return result.trim();
    } else if (result.text) {
      return result.text.trim();
    } else if (result.url) {
      return result.url.trim();
    }

    throw new Error('Failed to generate a valid URL');
  }

  /**
   * Parse content from a URL based on a prompt
   */
  async parseContent(
    url: string,
    prompt: string,
    additionalContext: Record<string, any> = {}
  ): Promise<any> {
    const result = await this.callDeepSeekAPI(
      prompt,
      {
        url,
        ...additionalContext,
      },
      {
        system_prompt:
          'You are an expert web scraper. Parse the content from the provided URL based on the user prompt.',
        temperature: 0.2,
      }
    );

    if (typeof result === 'object') {
      return result;
    }

    throw new Error('Failed to parse content');
  }

  /**
   * Analyze API response data to extract structure and important fields
   */
  async analyzeContent(
    url: string,
    prompt: string,
    additionalContext: Record<string, any> = {}
  ): Promise<any> {
    const result = await this.callDeepSeekAPI(
      prompt,
      {
        url,
        ...additionalContext,
      },
      {
        system_prompt:
          'You are an API analysis expert. Analyze the structure of API responses and identify important data fields and patterns.',
        temperature: 0.2,
      }
    );

    if (typeof result === 'object') {
      return result;
    } else if (typeof result === 'string') {
      try {
        // Try to parse the result as JSON if it's a string
        return JSON.parse(result);
      } catch (e) {
        // If not valid JSON, return as is
        return {
          text: result,
          path: '',
          properties: [],
        };
      }
    }

    throw new Error('Failed to analyze content structure');
  }

  /**
   * Generate comprehensive Puppeteer script based on namespace and prompt
   */
  async generatePuppeteerScript(
    namespace: string,
    prompt: string,
    additionalContext: Record<string, any> = {}
  ): Promise<{
    script: string;
    selectors: Record<string, string>;
    pagination?: { nextPageSelector?: string; maxPages: number };
  }> {
    const scriptPrompt = `
      You are a web scraping expert for ${namespace}. A user needs to extract specific data based on this prompt: "${prompt}"
      
      Create a comprehensive Puppeteer script that will:
      1. Navigate and extract exactly what the user requested
      2. Store all extracted data in a 'data' object
      3. Handle common errors that might occur during scraping
      4. Use modern Puppeteer best practices
      
      Return a JSON object with the following structure:
      {
        "script": "// Puppeteer script here (only the data extraction logic)",
        "selectors": {
          "key1": "selector1",
          "key2": "selector2"
        },
        "pagination": {
          "nextPageSelector": "selector for next page button if applicable",
          "maxPages": number of pages to scrape (default: 1)
        }
      }
    `;

    const result = await this.callDeepSeekAPI(
      scriptPrompt,
      {
        namespace,
        prompt,
        ...additionalContext,
      },
      {
        system_prompt:
          'You are an expert Puppeteer developer. Create precise and reliable web scraping scripts.',
        temperature: 0.2,
      }
    );

    if (!result.script) {
      throw new Error('Failed to generate a valid Puppeteer script');
    }

    return {
      script: result.script,
      selectors: result.selectors || {},
      pagination: result.pagination || { maxPages: 1 },
    };
  }
}

// Export a factory function to easily create instances
export function createDeepSeekService(
  apiKey?: string,
  redis?: Redis,
  options?: DeepSeekOptions
): DeepSeekService {
  return new DeepSeekService(apiKey, redis, options);
}

// For backward compatibility with the function-style API
export async function legacyDeepSeekService(prompt: string): Promise<any> {
  const service = new DeepSeekService();
  return service.callDeepSeekAPI(prompt);
}
