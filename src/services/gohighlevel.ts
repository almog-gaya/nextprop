import axios from 'axios';

interface SubAccountData {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  timezone?: string;
}

class GoHighLevelService {
  private readonly axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_GHL_BASE_URL,
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createSubAccount(data: SubAccountData) {
    try {
      const response = await this.axiosInstance.post('/sub-accounts', data);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to create sub account: ${error.message}`);
    }
  }
}

export default new GoHighLevelService(); 