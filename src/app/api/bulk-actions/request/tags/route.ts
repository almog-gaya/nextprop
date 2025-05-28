import { getAuthHeaders } from "@/lib/enhancedApi";
import { refreshTokenIdBackend } from "@/utils/authUtils";
 
export enum ActionType {
  ADD_TAG = 'bulk-tag-add-v2',
  REMOVE_TAG = 'bulk-tag-remove-v2',
} 
interface BulkActionRequest {
  actionType: ActionType;
  ids: string[];
  tags: string[]; 
}

export async function POST(request: Request) {
  const url = 'https://services.leadconnectorhq.com/bulk-actions/request';
  const tokenId = (await refreshTokenIdBackend()).id_token;
  const { locationId } = await getAuthHeaders();
  const { actionType, ids, tags } = await request.json() as BulkActionRequest;

  // Validate required parameters
  if (!locationId || !actionType || !ids || !tags) {
    return Response.json({
      error: 'Missing required parameters',
      current: { locationId, actionType, ids, tags },
    }, { status: 400 });
  }

  // Validate actionType
  if (!Object.values(ActionType).includes(actionType)) {
    return Response.json({
      error: `Invalid actionType. Must be one of: ${Object.values(ActionType).join(', ')}`,
    }, { status: 400 });
  }

  const payload = buildPayload(locationId, actionType, ids, tags);
  const headers = buildHeaders(tokenId);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return Response.json({
    data,
    message: `Tags ${actionType === ActionType.ADD_TAG ? 'addition' : 'removal'} is in progress for the selected ${ids.length} contacts`,
  });
}

const buildHeaders = (tokenId: string) => ({
  'token-id': tokenId,
  'sec-ch-ua-platform': '"Android"',
  'Referer': 'https://app.gohighlevel.com/',
  'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
  'sec-ch-ua-mobile': '?1',
  'baggage': 'sentry-environment=production,sentry-release=999e88d7a7b7c61d87dd30f3898b826f1869d5c6,sentry-public_key=c67431ff70d6440fb529c2705792425f,sentry-trace_id=bf1e1e98298a416ea44f43e97044f8ff',
  'sentry-trace': 'bf1e1e98298a416ea44f43e97044f8ff-aedb6b02a98b58f4',
  'source': 'WEB_USER',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'channel': 'APP',
  'Content-Type': 'application/json',
  'DNT': '1',
  'Version': '2021-04-15',
});

const buildPayload = (locationId: string, actionType: ActionType, contactIds: string[], tags: string[], documentSource?: string) => ({
  title: actionType,
  locationId,
  documentIds: contactIds,
  opSpecs: {
    note: actionType,
    tags,
    opType: actionType,
  },
  bulkActionType: actionType,
  scheduleType: 'NOW',
  documentSource: documentSource || 'search',
});