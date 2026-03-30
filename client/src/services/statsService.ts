import axios from '@/lib/axios';

export const statsService = {
  getStats: async (startDate: string, endDate: string) => {
    return axios.get(`/stats?startDate=${startDate}&endDate=${endDate}`);
  }
};