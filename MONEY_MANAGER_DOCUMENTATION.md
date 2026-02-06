# Money Manager Feature Documentation

## Overview
The Money Manager is a new feature added to the FinLit platform that helps rural users make smart decisions about their money through AI-powered budget planning and visualization.

## Features

### 1. **Manual & Voice Input**
- Users can enter their available amount manually through a numeric input field
- Voice input support with speech recognition (supports Hindi & English)
- Automatic amount extraction from voice input
- Large, accessible input interface with ₹ symbol

### 2. **AI-Powered Analysis**
- Uses Google Gemini AI to provide personalized financial advice
- Analyzes user profile (occupation, location, income) for contextual recommendations
- Generates budget allocations based on best practices for rural users
- Provides multilingual insights in Hindi or English

### 3. **Visual Budget Breakdown**
- **Pie Chart**: Shows percentage-wise distribution of budget
- **Bar Chart**: Category-wise allocation visualization
- **Summary Cards**: Total Amount, Savings Target, Investment suggestions
- **Detailed List**: Complete breakdown with amounts and percentages

### 4. **Smart Budget Categories**
The system recommends allocation across:
- 🍚 Food & Groceries (35%)
- 💡 Bills & Utilities (15%)
- 🚌 Transport (10%)
- 🏥 Healthcare (10%)
- 📚 Education (10%)
- 🚨 Emergency Fund (10%)
- 🏦 Savings (10%)

### 5. **Personalized Recommendations**
- Savings suggestions (typically 10-30% based on amount)
- Investment recommendations
- Priority action tips
- Context-aware AI insights based on user's financial situation

### 6. **History Tracking**
- Saves all budget analyses to database
- Users can view previous analyses
- Quick reuse of previous amounts
- Tracks user's financial planning journey

## Technical Implementation

### Backend (Python/FastAPI)

**File**: `backend/app/routes/money_manager.py`

Key endpoints:
- `POST /api/money-manager/analyze` - Analyze user's money and provide budget
- `GET /api/money-manager/history` - Get user's analysis history
- `POST /api/money-manager/save-custom` - Save custom budget

Features:
- Integration with Google Gemini AI for insights
- MongoDB database storage for history
- Multilingual support (English/Hindi)
- User profile integration for personalized advice

### Frontend (React)

**File**: `frontend/src/pages/MoneyManager.jsx`

Key features:
- Speech recognition using Web Speech API
- Interactive charts using Recharts library
- Responsive design with Tailwind CSS
- Dark mode support
- Real-time amount formatting

**Dashboard Integration**: `frontend/src/dashboards/UserDashboard.jsx`
- New Money Manager card in Quick Actions section
- Emerald/green color theme
- Wallet icon for easy identification

### Language Support

**English strings**: `frontend/src/lang/string_english.js`
**Hindi strings**: `frontend/src/lang/string_hindi.js`

All UI text is fully localized with simple, clear language suitable for rural users.

## User Flow

1. User clicks "Money Manager" from dashboard
2. Enters available amount (manual or voice)
3. Optional: Speaks additional context via microphone
4. Clicks "Analyze My Money"
5. System generates comprehensive budget breakdown with:
   - Visual charts
   - Detailed allocations
   - AI insights
   - Priority tips
6. User can view history of previous analyses
7. User can reuse previous amounts for quick analysis

## Voice Input Setup

The feature uses the Web Speech API (browser-native):
- **Hindi**: `hi-IN` locale
- **English**: `en-IN` locale
- Automatically extracts numbers from spoken text
- Handles common phrases in both languages

## AI Prompt Engineering

The system uses carefully crafted prompts for Gemini AI:
- Emphasizes simple, clear language
- Limits response to ~100 words for mobile users
- Adapts to user's occupation and location
- Provides actionable, practical advice
- Incorporates voice input context when available

## Database Schema

### budgets collection:
```javascript
{
  user_id: String,
  amount: Float,
  allocations: Array<{
    category: String,
    amount: Float,
    percentage: Float,
    description: String
  }>,
  created_at: DateTime,
  type: "budget_analysis"
}
```

### custom_budgets collection:
```javascript
{
  user_id: String,
  amount: Float,
  allocations: Array,
  created_at: DateTime,
  notes: String (optional)
}
```

## Design Philosophy

### Rural-First UX:
- **Large touch targets**: Easy to tap on mobile
- **Clear icons**: Universal symbols like ₹, 🍚, 💡
- **Simple language**: Avoids financial jargon
- **Visual feedback**: Loading states, animations
- **Voice support**: For users with low literacy

### Accessibility:
- High contrast colors
- Large font sizes
- Screen reader friendly
- Dark mode support
- Keyboard navigation

## Color Scheme
- Primary: Emerald/Green (represents money, growth)
- Accent: Purple (for AI features)
- Background: Gradient from emerald-50 to green-50
- Chart colors: Diverse, distinct palette

## Installation & Setup

1. **Backend**:
```bash
cd backend
# Add GEMINI_API_KEY to .env
pip install -r requirements.txt
```

2. **Frontend**:
```bash
cd frontend
npm install  # Installs lucide-react and recharts
npm run dev
```

3. **Environment Variables**:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Testing

### Test Scenarios:
1. ✅ Enter small amount (₹1000-5000) - See appropriate advice
2. ✅ Enter medium amount (₹5000-15000) - Balanced allocation
3. ✅ Enter large amount (₹15000+) - Investment suggestions
4. ✅ Use voice input in Hindi - Amount extraction works
5. ✅ Use voice input in English - Amount extraction works
6. ✅ Switch language mid-session - UI updates correctly
7. ✅ View history - Previous analyses load
8. ✅ Reuse amount from history - Fills input field
9. ✅ Dark mode toggle - All elements readable
10. ✅ Mobile responsive - Works on small screens

## Future Enhancements

1. **Goal Setting**: Allow users to set savings goals
2. **Recurring Budgets**: Save and reuse budget templates
3. **Expense Tracking Integration**: Connect with Expense Tracker
4. **Scheme Recommendations**: Link to eligible government schemes
5. **Family Budgets**: Multi-user budget planning
6. **SMS/WhatsApp**: Send budget summary via message
7. **PDF Export**: Download budget plan as PDF
8. **Comparison**: Compare current vs previous months
9. **Alerts**: Notify when spending exceeds budget
10. **Financial Education**: Link to relevant lessons

## API Response Example

```json
{
  "total_amount": 10000,
  "allocations": [
    {
      "category": "🍚 Food & Groceries",
      "amount": 3500,
      "percentage": 35,
      "description": "Recommended for food & groceries"
    }
  ],
  "savings_suggestion": 1000,
  "investment_suggestion": 500,
  "priority_tips": [
    "Prioritize essential expenses",
    "Save at least 10%",
    "Keep all receipts"
  ],
  "ai_insights": "With ₹10,000 available...",
  "language": "en"
}
```

## Troubleshooting

### Common Issues:

**Voice input not working:**
- Check browser permissions for microphone
- Ensure HTTPS connection (required for Speech API)
- Try Chrome/Edge (better Speech API support)

**AI insights not generating:**
- Verify GEMINI_API_KEY in .env
- Check API quota limits
- Falls back to default tips if API fails

**Charts not rendering:**
- Ensure recharts is installed
- Check browser console for errors
- Verify data structure matches expected format

## Credits

- **Charts**: Recharts library
- **Icons**: Lucide React & React Icons
- **AI**: Google Gemini 2.5 Flash
- **Design**: Tailwind CSS
- **Speech**: Web Speech API

## License
Part of FinLit platform - Financial Literacy & Empowerment for Rural India
