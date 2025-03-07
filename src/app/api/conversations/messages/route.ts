

import { NextRequest, NextResponse } from 'next/server';
import {  fetchWithErrorHandling } from '@/lib/enhancedApi';

export async function POST(request: NextRequest) {
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
        toNumber
    } = await request.json();
    const data = await fetchWithErrorHandling(() => SendMessage(
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
        toNumber
    ));

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
    toNumber: string
) => {
  
    const url = 'https://services.leadconnectorhq.com/conversations/messages';
    const options = {
        method: 'POST',
        headers: {
            Authorization: 'Bearer 123',
            Version: '2021-04-15',
            Prefer: 'code=200',
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({
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
            toNumber
        })
    };
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
}


/**
 {
  "conversationId": "ABC12h2F6uBrIkfXYazb",
  "emailMessageId": "rnGyqh2F6uBrIkfhFo9A",
  "messageId": "t22c6DQcTDf3MjRhwf77",
  "messageIds": [
    "string"
  ],
  "msg": "Message queued successfully."
}
 */