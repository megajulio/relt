export interface SendMessageParams {
  /**
   * Phone number in E.164 format.
   * Example: +573001234567
   */
  to: string;

  /**
   * Plain text message.
   */
  text: string;
}

export interface Message {
  id: string;
  organizationId?: string;
  to: string;
  from?: string;
  text?: string;
  status:
    | "pending"
    | "queued"
    | "sent"
    | "delivered"
    | "failed";
  provider?: string;
  providerMessageId?: string;
  createdAt: string;
}

export interface SendMessageResponse {
  data: Message;
}
