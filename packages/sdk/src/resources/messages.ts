import { ReltClient } from "../client";
import { SendMessageParams, SendMessageResponse } from "../types/messages";

export class MessagesResource {
  constructor(private readonly client: ReltClient) {}

  async send(params: SendMessageParams): Promise<SendMessageResponse> {
    if (!params.to) {
      throw new Error("'to' is required");
    }

    if (!params.text) {
      throw new Error("'text' is required");
    }

    return this.client.request<SendMessageResponse>("/v1/messages", {
      method: "POST",
      body: JSON.stringify({
        to: params.to,
        text: params.text,
      }),
    });
  }
}
