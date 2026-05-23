const BASE_URL = 'https://basevaultmarket.com/api'; 
const API_KEY = 'YOUR_SECRET_KEY'; 

export const apiClient = async (endpoint, options = {}) => {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      ...options.headers,
    },
  };
  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  return response.json();
};
