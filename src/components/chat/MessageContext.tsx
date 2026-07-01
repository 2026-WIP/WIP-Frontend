import { createContext, useContext } from 'react';

interface MessageContextValue {
  messageId: string;
}

export const MessageContext = createContext<MessageContextValue>({ messageId: '' });

export function useMessageContext() {
  return useContext(MessageContext);
}
