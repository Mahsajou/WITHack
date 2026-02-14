from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date
import os
import json
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="SetSync AI - Autonomous Audit Layer")

# CORS middleware for frontend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY")
MINIMAX_API_URL = os.getenv("MINIMAX_API_URL")
MINIMAX_MODEL = os.getenv("MINIMAX_MODEL", "MiniMax-M2.5")

# --- Data Models ---

class Guardrails(BaseModel):
    total_budget_limit: float
    flight_dates: Dict[str, date]
    forbidden_genres: List[str]
    targeting_logic: Dict[str, Any]

class GuardrailModel(BaseModel):
    contract_id: str
    client_name: str
    guardrails: Guardrails

class CampaignFields(BaseModel):
    daily_budget: float
    total_days: int
    start_date: date
    selected_genres: List[str]
    target_age_range: str
    placement: str

class CampaignModel(BaseModel):
    campaign_name: str
    status: str = "PENDING_AUDIT"
    fields: CampaignFields

class AuditIssue(BaseModel):
    field: str
    status: str  # "PASS" or "FAIL"
    message: str
    suggested_fix: Optional[str] = None
    severity: str  # "HIGH", "MEDIUM", "LOW"

class AuditReport(BaseModel):
    logic_score: int
    issues: List[AuditIssue]
    overall_status: str # "CERTIFIED" or "REJECTED"

# --- In-Memory Storage (Mock DB) ---
mock_db = {
    "contracts": {
        "CNT-9988-LVMH": {
            "contract_id": "CNT-9988-LVMH",
            "client_name": "Luxury Brand X",
            "guardrails": {
                "total_budget_limit": 100000,
                "flight_dates": {"start": "2026-03-01", "end": "2026-03-31"},
                "forbidden_genres": ["Horror", "Zombies", "Extreme Violence"],
                "targeting_logic": {
                    "audience_age_min": 25,
                    "geo_exclusion": ["Russia", "North Korea"],
                    "placement_type": "Mid-Roll Only"
                }
            }
        },
        "CNT-NIKE-VALENTINE": {
            "contract_id": "CNT-NIKE-VALENTINE",
            "client_name": "Nike",
            "guardrails": {
                "total_budget_limit": 2000000,
                "flight_dates": {"start": "2026-02-09", "end": "2026-02-14"},
                "forbidden_genres": ["Defamatory", "Obscene", "Illegal Content"], 
                "targeting_logic": {
                    "geo_targeting": ["USA"],
                    "demographic": ["Male", "Female"],
                    "contextual": "Valentine gifting season",
                    "placement_type": "Premium/Direct/Programmatic PMP",
                    "frequency_cap": "5 views per user"
                }
            }
        }
    },
    "campaigns": {},
    "reports": {}
}

# --- Auditor Logic ---

async def run_semantic_audit(campaign_genres: List[str], forbidden_genres: List[str]) -> List[AuditIssue]:
    """Uses Minimax API via HTTPX to check for semantic violations in genres."""
    issues = []
    
    prompt = f"""
    Compare the following selected genres for an ad campaign against the forbidden genres list from a legal contract.
    Selected Genres: {campaign_genres}
    Forbidden Genres: {forbidden_genres}
    
    Check for semantic overlaps. For example, if 'No Horror' is a rule and 'Slasher' is selected, that is a FAIL.
    
    Return ONLY a JSON array of objects with this structure:
    [{{"genre": "selected_genre", "forbidden_match": "forbidden_genre", "reason": "why it matches"}}]
    If no matches, return an empty array [].
    """
    
    headers = {
        "Authorization": f"Bearer {MINIMAX_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": MINIMAX_MODEL,
        "messages": [
            {"role": "system", "content": "You are a legal compliance auditor for advertising. You perform semantic analysis of content categories. You respond only with JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(MINIMAX_API_URL, headers=headers, json=payload, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            
            content = data["choices"][0]["message"]["content"]
            # Basic cleanup in case model wraps in markdown
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            
            violations = json.loads(content)
            
            for v in violations:
                issues.append(AuditIssue(
                    field="selected_genres",
                    status="FAIL",
                    message=f"Semantic Violation: '{v['genre']}' violates forbidden category '{v['forbidden_match']}'. {v['reason']}",
                    suggested_fix=f"Remove '{v['genre']}' from targeting.",
                    severity="HIGH"
                ))
            
    except Exception as e:
        print(f"Minimax Audit Error: {e}")
        # Fallback to exact match if API fails
        for sg in campaign_genres:
            if sg in forbidden_genres:
                issues.append(AuditIssue(
                    field="selected_genres",
                    status="FAIL",
                    message=f"Direct Violation: '{sg}' is explicitly forbidden.",
                    suggested_fix=f"Remove '{sg}' from targeting.",
                    severity="HIGH"
                ))
                
    return issues

# --- Frontend API Endpoints ---

@app.get("/api/contract")
async def get_contract():
    """Get the default contract data for the frontend."""
    contract_id = "CNT-9988-LVMH"
    if contract_id not in mock_db["contracts"]:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract = mock_db["contracts"][contract_id]
    guardrails = contract["guardrails"]
    
    # Format for frontend
    return {
        "fields": {
            "Budget": f"${guardrails['total_budget_limit']:,.0f}",
            "Genres": ", ".join(guardrails.get("allowed_genres", ["Action", "Drama"])),
            "Geos": ", ".join(guardrails["targeting_logic"].get("geo_targeting", ["US", "CA", "UK"])),
            "Age Range": f"{guardrails['targeting_logic'].get('audience_age_min', 25)}-{guardrails['targeting_logic'].get('audience_age_max', 35)}",
            "Start Date": guardrails["flight_dates"]["start"],
            "End Date": guardrails["flight_dates"]["end"],
        },
        "contract_id": contract_id,
        "client_name": contract["client_name"]
    }

@app.get("/api/campaign/fields")
async def get_campaign_fields():
    """Get campaign field data."""
    # Return mock campaign fields
    return [
        {
            "fieldType": "Budget",
            "value": "$55,000",
            "expected": "$100,000",
            "status": "FAIL",
            "remediatedAt": None,
        },
        {
            "fieldType": "Genres",
            "value": "Action, Drama, Comedy",
            "expected": "Action, Drama",
            "status": "WARN",
            "remediatedAt": None,
        },
        {
            "fieldType": "Geos",
            "value": "US, CA, UK",
            "expected": "US, CA, UK",
            "status": "PASS",
            "remediatedAt": None,
        },
    ]

@app.get("/api/audit/flags")
async def get_audit_flags():
    """Get audit flags for the frontend."""
    # Get the latest report if available
    if not mock_db["reports"]:
        return []
    
    latest_report = list(mock_db["reports"].values())[-1]
    
    flags = []
    for idx, issue in enumerate(latest_report.issues):
        flags.append({
            "id": str(idx + 1),
            "status": issue.status,
            "message": issue.message,
            "field": issue.field,
            "suggested_fix": issue.suggested_fix,
            "severity": issue.severity,
        })
    
    return flags

@app.get("/api/audit/compliance-score")
async def get_compliance_score():
    """Get compliance score."""
    if not mock_db["reports"]:
        return {"score": 0}
    
    latest_report = list(mock_db["reports"].values())[-1]
    return {"score": latest_report.logic_score}

@app.post("/api/audit/remediate/{field_id}")
async def remediate_field_endpoint(field_id: str, body: dict):
    """Remediate a field issue."""
    field_type = body.get("fieldType", "")
    
    # Update the campaign field
    if mock_db["campaigns"]:
        campaign = list(mock_db["campaigns"].values())[0]
        # Logic to fix the field based on contract
        contract = mock_db["contracts"]["CNT-9988-LVMH"]
        
        return {
            "status": "success",
            "field": field_type,
            "value": "fixed",  # This would be the corrected value
        }
    
    return {"status": "success", "field": field_type}

@app.post("/api/campaign/push-to-live")
async def push_to_live_endpoint():
    """Push campaign to live."""
    if not mock_db["campaigns"]:
        raise HTTPException(status_code=400, detail="No campaign to push")
    
    campaign_name = list(mock_db["campaigns"].keys())[0]
    return await publish_live(campaign_name)

@app.get("/api/campaign/audience")
async def get_audience_data():
    """Get audience data for Audience Node."""
    contract = mock_db["contracts"]["CNT-9988-LVMH"]
    guardrails = contract["guardrails"]
    
    return {
        "status": "FAIL",
        "hasSeverance": True,
        "contractAge": f"{guardrails['targeting_logic'].get('audience_age_min', 25)}-{guardrails['targeting_logic'].get('audience_age_max', 35)}",
        "setupAge": "18-24",
        "interests": ["Technology", "Gaming", "Entertainment"],
        "geos": guardrails["targeting_logic"].get("geo_targeting", ["US", "CA", "UK"]),
    }

@app.get("/api/campaign/optimization")
async def get_optimization_data():
    """Get optimization data for Optimization Node."""
    return {
        "status": "FAIL",
        "contractGoal": "ROAS 4.0",
        "setupGoal": "CPC (Traffic)",
    }

@app.get("/api/campaign/creative")
async def get_creative_data():
    """Get creative data for Creative Node."""
    return {
        "status": "PASS",
        "type": "image",
        "thumbnail": "https://via.placeholder.com/200x150/00d4aa/ffffff?text=Creative",
        "talentRights": "Active",
        "metadata": {
            "format": "JPG",
            "size": "2.4 MB",
            "dimensions": "1920x1080",
        },
    }

@app.get("/api/campaign/copy")
async def get_copy_data():
    """Get copy data for Copy Node."""
    return {
        "status": "FAIL",
        "headline": "Get 50% Off Today Only!",
        "body": "Limited time offer. Act now before it's too late. Terms and conditions apply.",
        "violations": ["Missing disclaimer", "Unsubstantiated claim"],
    }

@app.get("/api/campaign/temporal")
async def get_temporal_data():
    """Get temporal data for Temporal Node."""
    contract = mock_db["contracts"]["CNT-9988-LVMH"]
    guardrails = contract["guardrails"]
    
    return {
        "status": "WARN",
        "contractStart": guardrails["flight_dates"]["start"],
        "contractEnd": guardrails["flight_dates"]["end"],
        "setupStart": "2026-01-15",
        "setupEnd": "2026-04-05",
    }

@app.get("/api/audit/strategic-gaps")
async def get_strategic_gaps():
    """Get strategic gaps for Strategy Mirror."""
    gaps = []
    
    # Check audience severance
    gaps.append({
        "message": "Target audience age range (18-24) is broader than contract specification (25-35). Severance required.",
        "remediation": "Adjust age targeting to match contract range",
    })
    
    # Check optimization mismatch
    gaps.append({
        "message": "The setup is optimized for Traffic (CPC), but the contract guarantees Sales (ROAS 4.0). Remediation required.",
        "remediation": "Change optimization goal from CPC to ROAS target",
    })
    
    return gaps

# --- Original Backend Endpoints ---

@app.post("/audit/{contract_id}", response_model=AuditReport)
async def audit_campaign(contract_id: str, campaign: CampaignModel):
    if contract_id not in mock_db["contracts"]:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract = mock_db["contracts"][contract_id]
    guardrails = contract["guardrails"]
    fields = campaign.fields
    
    issues = []
    
    # 1. Budget Check
    total_attempted_budget = fields.daily_budget * fields.total_days
    if total_attempted_budget > guardrails["total_budget_limit"]:
        issues.append(AuditIssue(
            field="budget",
            status="FAIL",
            message=f"Total budget ${total_attempted_budget} exceeds contract limit of ${guardrails['total_budget_limit']}.",
            suggested_fix="Reduce daily budget or total flight days.",
            severity="HIGH"
        ))
    else:
        issues.append(AuditIssue(field="budget", status="PASS", message="Budget is within limits.", severity="LOW"))

    # 2. Date Check
    if fields.start_date < date.fromisoformat(guardrails["flight_dates"]["start"] if isinstance(guardrails["flight_dates"]["start"], str) else guardrails["flight_dates"]["start"].isoformat()):
        issues.append(AuditIssue(
            field="start_date",
            status="FAIL",
            message=f"Start date {fields.start_date} is before contract start {guardrails['flight_dates']['start']}.",
            suggested_fix="Adjust start date.",
            severity="MEDIUM"
        ))

    # 3. Semantic Genre Check
    ai_issues = await run_semantic_audit(fields.selected_genres, guardrails["forbidden_genres"])
    issues.extend(ai_issues)
    if not any(i.field == "selected_genres" and i.status == "FAIL" for i in ai_issues):
        issues.append(AuditIssue(field="selected_genres", status="PASS", message="No forbidden genres detected.", severity="LOW"))

    # 4. Placement Check
    if fields.placement != guardrails["targeting_logic"]["placement_type"]:
        issues.append(AuditIssue(
            field="placement",
            status="FAIL",
            message=f"Placement '{fields.placement}' violates contract requirement '{guardrails['targeting_logic']['placement_type']}'.",
            suggested_fix=f"Change placement to '{guardrails['targeting_logic']['placement_type']}'.",
            severity="HIGH"
        ))

    # Calculate Logic Score
    fail_count = sum(1 for i in issues if i.status == "FAIL")
    score = max(0, 100 - (fail_count * 25))
    
    report = AuditReport(
        logic_score=score,
        issues=issues,
        overall_status="CERTIFIED" if fail_count == 0 else "REJECTED"
    )
    
    # Save to mock DB
    mock_db["campaigns"][campaign.campaign_name] = campaign
    mock_db["reports"][campaign.campaign_name] = report
    
    return report

@app.post("/publish-live/{campaign_name}")
async def publish_live(campaign_name: str):
    if campaign_name not in mock_db["reports"]:
        raise HTTPException(status_code=400, detail="Campaign must be audited before publishing.")
    
    report = mock_db["reports"][campaign_name]
    
    if report.overall_status == "REJECTED":
        violations = [i.message for i in report.issues if i.status == "FAIL"]
        raise HTTPException(
            status_code=422, 
            detail={
                "error": "Compliance Check Failed",
                "violations": violations,
                "message": "Campaign cannot be published until all legal guardrails are met."
            }
        )
    
    # Update status to LIVE
    if campaign_name in mock_db["campaigns"]:
        mock_db["campaigns"][campaign_name].status = "LIVE"
    
    return {"status": "SUCCESS", "message": f"Campaign '{campaign_name}' is now LIVE."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
