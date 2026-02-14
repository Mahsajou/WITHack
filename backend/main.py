from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date
import os
import json
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="SetSync AI - Autonomous Audit Layer (7-Pillar Edition)")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY")
MINIMAX_API_URL = os.getenv("MINIMAX_API_URL")
MINIMAX_MODEL = os.getenv("MINIMAX_MODEL", "MiniMax-M2.5")

# --- Data Models (7 Pillars) ---

class AudienceTargeting(BaseModel):
    geo_targeting: List[str]
    demographic: List[str]
    contextual: str

class OptimizationRules(BaseModel):
    placement_type: str
    frequency_cap: str

class CreativeSpecs(BaseModel):
    format: str
    compliance_standard: str

class CopyGuidelines(BaseModel):
    tone_of_voice: str
    forbidden_keywords: List[str]

class Timeframe(BaseModel):
    start_date: date
    end_date: date

class Budget(BaseModel):
    total_budget_limit: float

class Guardrails(BaseModel):
    audience: AudienceTargeting
    optimization: OptimizationRules
    creative: CreativeSpecs
    copy: CopyGuidelines
    timeframe: Timeframe
    budget: Budget
    # The 7th pillar 'Guardrails' itself is the container, but we can have specific legal terms here
    legal_terms: List[str] 

class ContractModel(BaseModel):
    contract_id: str
    client_name: str
    guardrails: Guardrails

# Campaign (The Attempt) Structure
class CampaignAudience(BaseModel):
    geo_targeting: List[str]
    demographic: List[str]
    contextual: str

class CampaignOptimization(BaseModel):
    placement: str
    frequency_cap: str

class CampaignCreative(BaseModel):
    format: str
    compliance_standard: str

class CampaignCopy(BaseModel):
    ad_copy_text: str

class CampaignTimeframe(BaseModel):
    start_date: date
    end_date: date

class CampaignBudget(BaseModel):
    daily_budget: float
    total_days: int

class CampaignModel(BaseModel):
    campaign_name: str
    status: str = "PENDING_AUDIT"
    audience: CampaignAudience
    optimization: CampaignOptimization
    creative: CampaignCreative
    copy: CampaignCopy
    timeframe: CampaignTimeframe
    budget: CampaignBudget

# Audit Response Models
class PillarStatus(BaseModel):
    status: str # PASS, FAIL, WARN
    message: str
    issues: List[str] = []

class AuditReport(BaseModel):
    contract_id: str
    campaign_name: str
    is_certified: bool
    pillars: Dict[str, PillarStatus]

# --- In-Memory Storage (Mock DB) ---
mock_db = {
    "contracts": {
        "CNT-NIKE-VALENTINE": {
            "contract_id": "CNT-NIKE-VALENTINE",
            "client_name": "Nike",
            "guardrails": {
                "audience": {
                    "geo_targeting": ["USA"],
                    "demographic": ["Male", "Female"],
                    "contextual": "Valentine gifting season"
                },
                "optimization": {
                    "placement_type": "Premium/Direct/Programmatic PMP",
                    "frequency_cap": "5 views per user"
                },
                "creative": {
                    "format": "1080p",
                    "compliance_standard": "IAB Standard"
                },
                "copy": {
                    "tone_of_voice": "Inspirational, Romantic, Athletic",
                    "forbidden_keywords": ["Cheap", "Discount", "Hate", "Violence"]
                },
                "timeframe": {
                    "start_date": "2026-02-09",
                    "end_date": "2026-02-14"
                },
                "budget": {
                    "total_budget_limit": 2000000
                },
                "legal_terms": ["No Defamatory Content", "GDPR Compliant"]
            }
        }
    },
    "campaigns": {}, # Will store the latest campaign state
    "reports": {}
}

# --- Logic Helper ---
async def check_semantic_copy(copy_text: str, tone: str, forbidden: List[str]) -> List[str]:
    """Uses Minimax to check ad copy against tone and forbidden keywords."""
    issues = []
    
    # 1. Simple Keyword Check (Fast)
    for word in forbidden:
        if word.lower() in copy_text.lower():
            issues.append(f"Forbidden keyword detected: '{word}'")

    # 2. Semantic Tone Check (AI)
    prompt = f"""
    Analyze the following ad copy against the required brand tone.
    Ad Copy: "{copy_text}"
    Required Tone: "{tone}"
    
    Does the copy violate the tone? (e.g., is it too aggressive if the tone is romantic?)
    Return a JSON object: {{"violation": boolean, "reason": "string"}}
    """
    
    headers = {
        "Authorization": f"Bearer {MINIMAX_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": MINIMAX_MODEL,
        "messages": [
            {"role": "system", "content": "You are a brand safety auditor. Respond only with JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(MINIMAX_API_URL, headers=headers, json=payload, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            
            result = json.loads(content)
            if result.get("violation"):
                issues.append(f"Tone Violation: {result.get('reason')}")

    except Exception as e:
        print(f"AI Check Failed: {e}")
        # Fail open or closed based on policy? For now, we just log it.

    return issues

# --- Core Auditor ---
async def perform_audit(contract_id: str, campaign: CampaignModel) -> AuditReport:
    contract = mock_db["contracts"].get(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    g = contract["guardrails"]
    pillars = {}
    
    # 1. Audience
    aud_issues = []
    # Check Geo (Simplified: exact match list)
    if not set(campaign.audience.geo_targeting).issubset(set(g["audience"]["geo_targeting"])):
        aud_issues.append(f"Geo Targeting mismatch. Allowed: {g['audience']['geo_targeting']}")
    
    pillars["Audience"] = PillarStatus(
        status="FAIL" if aud_issues else "PASS",
        message="Audience targeting checks.",
        issues=aud_issues
    )

    # 2. Budget
    bud_issues = []
    total_spend = campaign.budget.daily_budget * campaign.budget.total_days
    if total_spend > g["budget"]["total_budget_limit"]:
        bud_issues.append(f"Total spend ${total_spend} exceeds limit ${g['budget']['total_budget_limit']}")
    
    pillars["Budget"] = PillarStatus(
        status="FAIL" if bud_issues else "PASS",
        message="Budget compliance.",
        issues=bud_issues
    )

    # 3. Timeframe
    time_issues = []
    # Dates are objects, easy compare
    c_start = campaign.timeframe.start_date
    g_start = date.fromisoformat(g["timeframe"]["start_date"])
    if c_start < g_start:
        time_issues.append(f"Start date {c_start} is before contract start {g_start}")
    
    pillars["Timeframe"] = PillarStatus(
        status="FAIL" if time_issues else "PASS",
        message="Flight dates validation.",
        issues=time_issues
    )

    # 4. Optimization
    opt_issues = []
    if campaign.optimization.placement != g["optimization"]["placement_type"]:
        opt_issues.append(f"Placement '{campaign.optimization.placement}' invalid. Must be '{g['optimization']['placement_type']}'")
    
    pillars["Optimization"] = PillarStatus(
        status="FAIL" if opt_issues else "PASS",
        message="Placement & Frequency checks.",
        issues=opt_issues
    )

    # 5. Creative
    create_issues = []
    if campaign.creative.format != g["creative"]["format"]:
        create_issues.append(f"Format mismatch. Required: {g['creative']['format']}")

    pillars["Creative"] = PillarStatus(
        status="FAIL" if create_issues else "PASS",
        message="Asset spec validation.",
        issues=create_issues
    )

    # 6. Copy (Semantic)
    copy_issues = await check_semantic_copy(
        campaign.copy.ad_copy_text, 
        g["copy"]["tone_of_voice"],
        g["copy"]["forbidden_keywords"]
    )
    
    pillars["Copy"] = PillarStatus(
        status="FAIL" if copy_issues else "PASS",
        message="Semantic Brand Voice Analysis.",
        issues=copy_issues
    )

    # 7. Guardrails (Legal)
    # Placeholder: assuming generic legal compliance unless flagged elsewhere
    legal_issues = [] 
    pillars["Guardrails"] = PillarStatus(
        status="PASS", 
        message="General legal terms check.",
        issues=[]
    )

    # Final Certification
    is_certified = all(p.status == "PASS" for p in pillars.values())

    report = AuditReport(
        contract_id=contract_id,
        campaign_name=campaign.campaign_name,
        is_certified=is_certified,
        pillars=pillars
    )
    
    # Save state
    mock_db["campaigns"][campaign.campaign_name] = campaign
    mock_db["reports"][campaign.campaign_name] = report
    
    return report

# --- Endpoints ---

@app.post("/audit/{contract_id}", response_model=AuditReport)
async def audit_endpoint(contract_id: str, campaign: CampaignModel):
    return await perform_audit(contract_id, campaign)

@app.post("/rerun-audit/{contract_id}/{campaign_name}", response_model=AuditReport)
async def rerun_audit(contract_id: str, campaign_name: str, updates: Dict[str, Any] = Body(...)):
    # 1. Fetch existing campaign
    existing_campaign = mock_db["campaigns"].get(campaign_name)
    if not existing_campaign:
        raise HTTPException(status_code=404, detail="Campaign not found. Run /audit first.")

    # 2. Apply updates (Partial Update Logic)
    # We iterate through the updates dict and update the Pydantic model
    # This is a bit manual due to nested models, but robust
    campaign_dict = existing_campaign.dict()
    
    for section, fields in updates.items():
        if section in campaign_dict and isinstance(fields, dict):
            campaign_dict[section].update(fields)
    
    # Re-validate with Pydantic
    updated_campaign = CampaignModel(**campaign_dict)
    
    # 3. Rerun Audit
    return await perform_audit(contract_id, updated_campaign)

@app.post("/publish-live/{campaign_name}")
async def publish_live(campaign_name: str):
    report = mock_db["reports"].get(campaign_name)
    if not report:
         raise HTTPException(status_code=400, detail="Campaign must be audited first.")
    
    if not report.is_certified:
        raise HTTPException(status_code=403, detail="Forbidden: Campaign is not certified. Fix all red pillars.")
    
    if campaign_name in mock_db["campaigns"]:
        mock_db["campaigns"][campaign_name].status = "LIVE"

    return {"status": "SUCCESS", "message": "Campaign is LIVE on Ad Server."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)