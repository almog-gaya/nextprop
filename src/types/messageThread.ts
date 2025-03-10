export interface Conversation {
    id: string;
    contactId: string;
    locationId: string;
    lastMessageBody: string;
    lastMessageType: string;
    type: string;
    unreadCount: number;
    fullName: string;
    contactName: string;
    email: string;
    phone: string;
    originalData?: any;
  }
  
  
  export interface Message {
    id: string;
    body: string;
    text?: string;
    direction: string;
    dateAdded: string;
    messageType: string;
  }
  
  // Define a type for our extended conversation object
  export interface ConversationDisplay extends Conversation {
    name: string;
    avatar: string;
    lastMessage: string;
    timestamp: string;
    unread: boolean;
    originalData?: any;
  }