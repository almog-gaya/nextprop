import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling, getAuthHeaders } from '@/lib/enhancedApi';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    type,
    contactId,
    appointmentId,
    attachments,
    emailFrom,
    emailCc,
    emailBcc,
    html,
    message,
    subject,
    replyMessageId,
    templateId,
    threadId,
    scheduledTimestamp,
    conversationProviderId,
    emailTo,
    emailReplyMode,
    fromNumber,
    toNumber,
    conversationId,
  } = body;

  const data = await fetchWithErrorHandling(() =>
    SendMessage(
      type,
      contactId,
      appointmentId,
      attachments,
      emailFrom,
      emailCc,
      emailBcc,
      html,
      message,
      subject,
      replyMessageId,
      templateId,
      threadId,
      scheduledTimestamp,
      conversationProviderId,
      emailTo,
      emailReplyMode,
      fromNumber,
      toNumber,
      conversationId,
    )
  );


  // If the external API returns an error status, reflect that in the response
  if (data.status && data.status >= 400) {
    return NextResponse.json(data, { status: data.status });
  }

  return NextResponse.json(data);
}

const SendMessage = async (
  type: string,
  contactId: string,
  appointmentId: string,
  attachments: string[],
  emailFrom: string,
  emailCc: string[],
  emailBcc: string[],
  html: string,
  message: string,
  subject: string,
  replyMessageId: string,
  templateId: string,
  threadId: string,
  scheduledTimestamp: number,
  conversationProviderId: string,
  emailTo: string,
  emailReplyMode: string,
  fromNumber: string,
  toNumber: string,
  conversationId: string,
) => {
  const { locationId, token } = await getAuthHeaders();

  const url = 'https://services.leadconnectorhq.com/conversations/messages';
  const payload = {
    type,
    contactId,
    appointmentId,
    attachments,
    emailFrom,
    emailCc,
    emailBcc,
    html,
    message,
    subject,
    replyMessageId,
    templateId,
    threadId,
    scheduledTimestamp,
    conversationProviderId,
    emailTo,
    emailReplyMode,
    conversationId,
    // fromNumber,
    // toNumber,
  };

  const cleanedPayload = Object.fromEntries(
    Object.entries(payload).filter(([_, value]) => value !== undefined)
  );



  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Version: '2021-04-15',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(cleanedPayload),
  };

  const response = await fetch(url, options);
  const data = await response.json();
  if(response.ok){
    // const _options = {
    //   method: 'POST',
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     Version: '2021-04-15',
    //     'Content-Type': 'application/json',
    //     Accept: 'application/json',
    //   },
    //   body: JSON.stringify({
    //     ...cleanedPayload,
    //     direction: 'inbound'
    //   }),
    // };
    // const response = await fetch('https://services.leadconnectorhq.com/conversations/messages/inbound', _options);
    // const data = await response.json();
    // console.log('data>', data);
  }
  return data;
};
