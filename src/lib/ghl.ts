import { getAuthHeaders } from './enhancedApi';

export async function getContactById(contactId: string) {
  const { token } = await getAuthHeaders();
  const url = `https://services.leadconnectorhq.com/contacts/${contactId}`;

  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Version: '2021-07-28',
      Accept: 'application/json'
    }
  };

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} ${data.message}`);
  }

  return data;
} 