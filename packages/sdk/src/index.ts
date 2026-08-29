import { ReltClient, ReltClientOptions } from "./client";
import { MessagesResource } from "./resources/messages";

export class Relt {
  public readonly messages: MessagesResource;

  constructor(options: ReltClientOptions) {
    const client = new ReltClient(options);
    this.messages = new MessagesResource(client);
  }
}

export { ReltError } from "./errors/relt-error";

export type { ReltClientOptions } from "./client";

export type { Message, SendMessageParams, SendMessageResponse } from "./types/messages";
