import { getAuthHeaders } from "@/lib/enhancedApi";
import { refreshTokenIdBackend } from "@/utils/authUtils";

/**
 * This basically checks if the workflow exists
 *  Returns `isExists: true` if the workflow exists 
 */
export async function GET(request: Request) {
    const { locationId } = await getAuthHeaders();
    const headers = await __buildHeaders();
    const URL = `https://backend.leadconnectorhq.com/workflow/${locationId}/list?search=SMS AI Agent&limit=1&offset=0&sortBy=name&sortOrder=asc`;
    const response = await fetch(URL, {
        method: "GET",
        headers: headers,
        redirect: "follow"
    })

    const data = await response.json();

    return Response.json({
        isExists: data.count > 0,
        ...data
    });
}

/**
 *   Create the initial workflow and trigger
 */
export async function POST(request: Request) {
    const { locationId } = await getAuthHeaders();
    const headers = await __buildHeaders();
    const workflow = await createInitialWorkflow(headers, locationId!);
    const trigger = await createSMSReceiveTrigger(headers, locationId!, workflow.id);

    return Response.json({
        "workflowId": workflow.id,
        "triggerId": trigger.id,
        "status": "success"
    });

}

/** 
 *  Update the workflow with the webhook template and trigger of SMS receiver
 */
export async function PUT(request: Request) {
    const { locationId } = await getAuthHeaders();
    const headers = await __buildHeaders();
    const payload = await request.json();
    const workflowId = payload.workflowId;
    const triggerId = payload.triggerId;
    const templateId = payload.templateId;
    const sendPayload = {
        "_id": workflowId,
        "locationId": locationId,
        "companyId": "c19vX1spjlLJWQKMUWVD",
        "companyAge": 17,
        "name": "SMS AI Agent",
        "status": "published",
        "version": 1,
        "dataVersion": 7,
        "allowMultiple": true,
        "timezone": "account",
        "removeContactFromLastStep": true,
        "filePath": `location/Pwjw3eYm72e3vYnLaTpD/workflows/${workflowId}/1`,
        "fileUrl": `https://firebasestorage.googleapis.com/v0/b/highlevel-backend.appspot.com/o/location%2FPwjw3eYm72e3vYnLaTpD%2Fworkflows%2F${workflowId}%2F1?alt=media&token=90b11305-4d21-4b2b-9434-ea5c25c61e7c`,
        "stopOnResponse": false,
        "autoMarkAsRead": false,
        "permission": 380,
        "type": "workflow",
        "parentId": null,
        "meta": null,
        "updatedBy": "9fQQvB6FdYvvaAbk617n",
        "createdAt": "2025-04-07T08:40:12.197Z",
        "updatedAt": "2025-04-07T08:40:12.197Z",
        "deleted": false,
        "allowMultipleOpportunity": true,
        "__v": 0,
        "id": workflowId,
        "workflowData": {
            "templates": [
                {
                    "id": templateId,
                    "order": 0,
                    "attributes": {
                        "method": "POST",
                        "url": "https://receivewebhook-vhkdzfr2sq-uc.a.run.app",
                        "customData": [],
                        "headers": []
                    },
                    "name": "Webhook",
                    "type": "webhook"
                }
            ]
        },
        "permissionMeta": {
            "canRead": true,
            "canWrite": true
        },
        "scheduledPauseDates": [],
        "modifiedSteps": [],
        "deletedSteps": [],
        "createdSteps": [
            templateId,
        ],
        "senderAddress": {},
        "eventStartDate": "",
        "triggersChanged": true,
        "newTriggers": [
            {
                "status": "published",
                "workflowId": workflowId,
                "conditions": [],
                "type": "customer_reply",
                "masterType": "highlevel",
                "name": "Customer Replied",
                "actions": [
                    {
                        "workflow_id": workflowId,
                        "type": "add_to_workflow"
                    }
                ],
                "active": true,
                "id": triggerId,
                "location_id": "Pwjw3eYm72e3vYnLaTpD"
            }
        ]
    }
    const URL = `https://backend.leadconnectorhq.com/workflow/${locationId}/${workflowId}`;
    const raw = JSON.stringify(sendPayload);

    const response = await fetch(URL, {
        method: "PUT",
        headers: headers,
        body: raw,
        redirect: "follow"
    })
    const data = await response.json();
    return Response.json(data);
}

/**
 * Delete a workflow by id 
 */
export async function DELETE(request: Request) {
    const { locationId } = await getAuthHeaders();
    const headers = await __buildHeaders();
    const payload = await request.json();
    const workflowId = payload.workflowId;
    const URL = `https://backend.leadconnectorhq.com/workflow/${locationId}/${workflowId}`;

    const response = await fetch(URL, {
        method: "DELETE",
        headers: headers,
        redirect: "follow"
    });

    const data = await response.json();
    return Response.json(data);
}

/**
 * 
 * Response succes : 
    {
        "id": "868f5487-1e79-49f5-b1ce-07e5d4be2fcd" <= workflow id
    }
    
 */
const createInitialWorkflow = async (headers: any, locationId: string) => {
    const URL = `https://backend.leadconnectorhq.com/workflow/${locationId}`;

    const raw = JSON.stringify({
        "name": "SMS AI Agent",
        "status": "draft",
        "parentId": null,
        "updatedBy": locationId,
        "modifiedSteps": [],
        "deletedSteps": [],
        "createdSteps": [],
        "senderAddress": {},
        "stopOnResponse": false,
        "allowMultiple": false,
        "allowMultipleOpportunity": true,
        "autoMarkAsRead": false,
        "eventStartDate": "",
        "timezone": "",
        "workflowData": {
            "templates": []
        },
        "triggersChanged": false,
        "company_id": "c19vX1spjlLJWQKMUWVD",
        "company_age": 17
    });
    const response = await fetch(URL, {
        method: "POST",
        headers: headers,
        body: raw,
        redirect: "follow"
    });

    const data = await response.json();
    return data;
}

/**
 * 
 Response succes :
    {
        "id": "yBH8SQyn2PaTkZQq1e2h" <= trigger id for customer_reply
    }
 */
const createSMSReceiveTrigger = async (headers: any, locationId: string, workflowId: string) => {
    const URL = `https://backend.leadconnectorhq.com/workflow/${locationId}/trigger`;
    const payload = {
        "status": "draft",
        "workflowId": workflowId,
        "conditions": [],
        "type": "customer_reply",
        "masterType": "highlevel",
        "name": "Customer Replied",
        "actions": [
            {
                "workflow_id": workflowId,
                "type": "add_to_workflow"
            }
        ],
        "active": true,
        "triggersChanged": true,
        "location_id": locationId,
        "company_id": "c19vX1spjlLJWQKMUWVD",
        "company_age": 17
    }

    const raw = JSON.stringify(payload);
    const response = await fetch(URL, {
        method: "POST",
        headers: headers,
        body: raw,
        redirect: "follow"
    });
    const data = await response.json();
    return data;

}

const __buildHeaders = async () => {
    const tokenId = (await refreshTokenIdBackend()).id_token;
    const myHeaders = new Headers();

    myHeaders.append("accept", "application/json, text/plain, */*");
    myHeaders.append("accept-language", "en-US,en;q=0.9");
    myHeaders.append("content-type", "application/json");
    myHeaders.append("dnt", "1");
    myHeaders.append("origin", "https://client-app-automation-workflows.leadconnectorhq.com");
    myHeaders.append("priority", "u=1, i");
    myHeaders.append("referer", "https://client-app-automation-workflows.leadconnectorhq.com/");
    myHeaders.append("sec-ch-ua", "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"");
    myHeaders.append("sec-ch-ua-mobile", "?1");
    myHeaders.append("sec-ch-ua-platform", "\"Android\"");
    myHeaders.append("sec-fetch-dest", "empty");
    myHeaders.append("sec-fetch-mode", "cors");
    myHeaders.append("sec-fetch-site", "same-site");
    myHeaders.append("token-id", tokenId);
    myHeaders.append("user-agent", "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36");

    return myHeaders;
}