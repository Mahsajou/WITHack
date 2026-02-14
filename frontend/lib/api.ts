// frontend/lib/api.ts
const BACKEND_URL = 'http://localhost:8000';

export async function auditCampaign(contractId: string, campaignData: any) {
  const response = await fetch(`${BACKEND_URL}/audit/${contractId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campaignData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Audit request failed');
  }

  return response.json();
}

export async function rerunAudit(contractId: string, campaignName: string, updates: any) {
    const response = await fetch(`${BACKEND_URL}/rerun-audit/${contractId}/${campaignName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Rerun audit failed');
    }
  
    return response.json();
  }

export async function publishCampaign(campaignName: string) {
    const response = await fetch(`${BACKEND_URL}/publish-live/${campaignName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Publish failed');
    }
  
    return response.json();
  }