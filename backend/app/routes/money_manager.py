from fastapi import APIRouter, Depends, HTTPException
from app.utils.auth import get_current_user
from app.database import get_collection, USERS_COLLECTION
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import os
import logging
import google.generativeai as genai

router = APIRouter()
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("Gemini API configured for Money Manager")
else:
    logger.warning("GEMINI_API_KEY not found in environment variables")

# Pydantic Models
class MoneyInput(BaseModel):
    amount: float = Field(..., gt=0, description="Available amount to spend")
    language: Optional[str] = Field(default="en", description="User language preference")
    voice_input: Optional[str] = Field(default=None, description="Voice input text if available")

class BudgetAllocation(BaseModel):
    category: str
    amount: float
    percentage: float
    description: str

class MoneyAdvice(BaseModel):
    total_amount: float
    allocations: List[BudgetAllocation]
    savings_suggestion: float
    investment_suggestion: float
    priority_tips: List[str]
    ai_insights: str
    language: str

@router.post("/analyze", response_model=MoneyAdvice)
async def analyze_money(
    money_input: MoneyInput,
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze user's available money and provide AI-powered allocation advice
    """
    try:
        amount = money_input.amount
        language = money_input.language
        user_id = current_user.get("sub")
        
        # Get user profile for personalized advice
        users_collection = get_collection(USERS_COLLECTION)
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        occupation = user.get("occupation", "Unknown") if user else "Unknown"
        village = user.get("village", "Unknown") if user else "Unknown"
        
        # Basic allocation logic for rural users
        allocations = []
        
        # Essential categories with percentages
        categories = [
            {"name": "Food & Groceries", "percentage": 35, "icon": "🍚"},
            {"name": "Bills & Utilities", "percentage": 15, "icon": "💡"},
            {"name": "Transport", "percentage": 10, "icon": "🚌"},
            {"name": "Healthcare", "percentage": 10, "icon": "🏥"},
            {"name": "Education", "percentage": 10, "icon": "📚"},
            {"name": "Emergency Fund", "percentage": 10, "icon": "🚨"},
            {"name": "Savings", "percentage": 10, "icon": "🏦"},
        ]
        
        for category in categories:
            alloc_amount = (amount * category["percentage"]) / 100
            allocations.append(BudgetAllocation(
                category=f"{category['icon']} {category['name']}",
                amount=round(alloc_amount, 2),
                percentage=category["percentage"],
                description=f"Recommended for {category['name'].lower()}"
            ))
        
        # Calculate savings and investment
        savings_suggestion = round(amount * 0.10, 2)
        investment_suggestion = round(amount * 0.05, 2)
        
        # Generate AI insights using Gemini
        ai_insights = await generate_ai_insights(
            amount, 
            occupation, 
            village, 
            language,
            money_input.voice_input
        )
        
        # Priority tips based on amount
        priority_tips = generate_priority_tips(amount, language)
        
        # Save this analysis to user history
        await save_budget_history(user_id, amount, [alloc.dict() for alloc in allocations])
        
        return MoneyAdvice(
            total_amount=amount,
            allocations=allocations,
            savings_suggestion=savings_suggestion,
            investment_suggestion=investment_suggestion,
            priority_tips=priority_tips,
            ai_insights=ai_insights,
            language=language
        )
        
    except Exception as e:
        logger.error(f"Error in money analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing money: {str(e)}")

async def generate_ai_insights(amount: float, occupation: str, village: str, language: str, voice_input: Optional[str]) -> str:
    """
    Generate personalized AI insights using Gemini
    """
    try:
        if not GEMINI_API_KEY:
            return get_default_insights(amount, language)
        
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Determine language prompt
        lang_instruction = ""
        if language == "hi":
            lang_instruction = "कृपया हिंदी में जवाब दें। सरल और स्पष्ट भाषा का उपयोग करें।"
        else:
            lang_instruction = "Please respond in simple English."
        
        voice_context = f"\nUser also mentioned: {voice_input}" if voice_input else ""
        
        prompt = f'''You are a financial advisor for rural India users. 
        
User Profile:
- Available Money: ₹{amount}
- Occupation: {occupation}
- Location: {village}
{voice_context}

{lang_instruction}

Provide 3-4 SHORT, PRACTICAL tips for managing this money:
- Focus on savings and smart spending
- Mention government schemes if relevant
- Keep it under 100 words
- Be encouraging and simple
- Use bullet points'''

        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        logger.error(f"Error generating AI insights: {str(e)}")
        return get_default_insights(amount, language)

def get_default_insights(amount: float, language: str) -> str:
    """
    Fallback insights when AI is not available
    """
    if language == "hi":
        if amount < 5000:
            return """💡 सुझाव:
• छोटी रकम है, लेकिन बचत जरूरी है
• दैनिक खर्चों को ट्रैक करें
• छोटे-छोटे बचत से शुरुआत करें
• सरकारी योजनाएं देखें"""
        elif amount < 15000:
            return """💡 सुझाव:
• अच्छी रकम है, बुद्धिमानी से खर्च करें
• 20% बचत करने की कोशिश करें
• आपातकालीन फंड बनाएं
• सरकारी बचत योजनाओं में निवेश करें"""
        else:
            return """💡 सुझाव:
• बढ़िया! अच्छी रकम है
• 30% बचत का लक्ष्य रखें
• निवेश के विकल्प तलाशें
• FD या पोस्ट ऑफिस योजनाएं देखें"""
    else:
        if amount < 5000:
            return """💡 Tips:
• Small amount, but saving is important
• Track daily expenses carefully
• Start with small savings
• Check government schemes"""
        elif amount < 15000:
            return """💡 Tips:
• Good amount to work with
• Try to save 20%
• Build emergency fund
• Consider government savings schemes"""
        else:
            return """💡 Tips:
• Great! You have good amount
• Aim to save 30%
• Explore investment options
• Look into FD or Post Office schemes"""

def generate_priority_tips(amount: float, language: str) -> List[str]:
    """
    Generate priority tips based on amount
    """
    if language == "hi":
        tips = [
            "सबसे पहले जरूरी खर्च करें",
            "10% जरूर बचाएं",
            "रसीद जरूर रखें",
            "खर्च रजिस्टर बनाएं"
        ]
        if amount > 10000:
            tips.append("निवेश के बारे में सोचें")
            tips.append("बीमा के बारे में जानें")
    else:
        tips = [
            "Prioritize essential expenses",
            "Save at least 10%",
            "Keep all receipts",
            "Maintain expense register"
        ]
        if amount > 10000:
            tips.append("Think about investment")
            tips.append("Learn about insurance")
    
    return tips

async def save_budget_history(user_id: str, amount: float, allocations: List[dict]):
    """
    Save budget analysis to user's history
    """
    try:
        budgets_collection = get_collection("budgets")
        budget_entry = {
            "user_id": user_id,
            "amount": amount,
            "allocations": allocations,
            "created_at": datetime.utcnow(),
            "type": "budget_analysis"
        }
        
        await budgets_collection.insert_one(budget_entry)
        logger.info(f"Saved budget history for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error saving budget history: {str(e)}")

@router.get("/history")
async def get_budget_history(
    current_user: dict = Depends(get_current_user),
    limit: int = 10
):
    """
    Get user's budget analysis history
    """
    try:
        user_id = current_user.get("sub")
        budgets_collection = get_collection("budgets")
        
        # Convert cursor to list with await
        cursor = budgets_collection.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit)
        
        history = await cursor.to_list(length=limit)
        
        return {"history": history}
        
    except Exception as e:
        logger.error(f"Error fetching budget history: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching history")

@router.post("/save-custom")
async def save_custom_budget(
    amount: float,
    allocations: List[dict],
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Save user's custom budget allocation
    """
    try:
        user_id = current_user.get("sub")
        
        custom_budget = {
            "user_id": user_id,
            "amount": amount,
            "allocations": allocations,
            "created_at": datetime.utcnow(),
            "notes": notes
        }
        
        custom_budgets_collection = get_collection("custom_budgets")
        await custom_budgets_collection.insert_one(custom_budget)
        
        return {"success": True, "message": "Budget saved successfully"}
        
    except Exception as e:
        logger.error(f"Error saving custom budget: {str(e)}")
        raise HTTPException(status_code=500, detail="Error saving budget")
