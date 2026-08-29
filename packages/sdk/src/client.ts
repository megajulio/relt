import { ReltError } from "./errors/relt-error";

export interface ReltClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export class ReltClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof globalThis.fetch;

  constructor(options: ReltClientOptions) {
    if (!options.apiKey) {
      throw new Error("Relt API key is required");
    }

    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://api.relt.dev").replace(/\/$/, "");
    this.fetchFn = options.fetch ?? globalThis.fetch;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let body: unknown;

      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }

      throw new ReltError(`Relt API request failed with status ${response.status}`, {
        status: response.status,
        body,
      });
    }

    return response.json() as Promise<T>;
  }
}
