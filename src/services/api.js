/**
 * API Service for Ad Manager Backend
 * Handles all API communication with proper authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_KEY = import.meta.env.VITE_API_KEY;

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'X-API-Key': API_KEY,
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

/**
 * Get contract data from backend
 */
export async function getContractData() {
  return apiRequest('/contract');
}

/**
 * Get campaign field data
 */
export async function getCampaignFields() {
  return apiRequest('/campaign/fields');
}

/**
 * Get audit flags
 */
export async function getAuditFlags() {
  return apiRequest('/audit/flags');
}

/**
 * Get compliance score
 */
export async function getComplianceScore() {
  return apiRequest('/audit/compliance-score');
}

/**
 * Remediate a field issue
 */
export async function remediateField(fieldId, fieldType) {
  return apiRequest(`/audit/remediate/${fieldId}`, {
    method: 'POST',
    body: JSON.stringify({ fieldType }),
  });
}

/**
 * Push campaign to live
 */
export async function pushToLive() {
  return apiRequest('/campaign/push-to-live', {
    method: 'POST',
  });
}

/**
 * Update field value
 */
export async function updateField(fieldType, value) {
  return apiRequest(`/campaign/fields/${fieldType}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
}

