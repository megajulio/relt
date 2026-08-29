export interface ReltErrorOptions {
  status?: number;
  body?: unknown;
}

export class ReltError extends Error {
  readonly status?: number;
  readonly body?: unknown;

  constructor(message: string, options: ReltErrorOptions = {}) {
    super(message);
    this.name = "ReltError";
    this.status = options.status;
    this.body = options.body;
  }
}
