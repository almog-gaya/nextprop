export interface Conversation {
  id: string;
  contactId: string;
  locationId: string;
  lastMessageBody: string;
  lastMessageType?: string;
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
  status?: string,
  meta?: MetaDataMessage;
  activity?: Activity,
  attachments?: string[],
  type: string,
  altId?: string,
}

interface MetaDataMessage {
  email?: MetaEmail,
  incomingCall?: IncomingCall 
  call? : Call,
}
interface MetaEmail {
  subject?: string,
  firstMessageTimestamp: string,
  lastMessageTimestamp: string,
  direction: string,
  messageIds: string[],
}

interface IncomingCall {
  voicemailFile: string,
  childCallSid: string, 
}

interface Call {
   duration: number,
   status: string, // [no-answer || completed]
} 

export interface Activity {
  data: ActivityData,
  title: string,
  type: string, // [opportunity_created]
}
export interface ActivityData {
  id: string,
  name: string,
  status: string,
  pipeline: string,
  stage: any
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

