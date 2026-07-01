export interface Channel {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  memberIds: string[];
  ownerId?: string;
}

export interface Thread {
  id: string;
  parentMessageId: string;
  channelId: string;
  messageIds: string[];
}
