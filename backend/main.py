from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import warnings
from typing import List, Optional

warnings.filterwarnings('ignore')

app = FastAPI()

# CORS - ለFrontend ሁሉ ክፈት
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models
try:
    model = joblib.load("student_model.joblib")
    scaler = joblib.load("scaler.joblib")
    print("✅ Models loaded successfully")
    print(f"📊 Scaler expects: {scaler.n_features_in_} features")
except Exception as e:
    print(f"❌ Failed to load models: {e}")
    model = None
    scaler = None

@app.get("/")
def home():
    return {"message": "Student Performance API is Running!", "status": "active"}

@app.post("/predict")
async def predict_score(request: dict):
    """
    Receive 7 features from frontend, convert to 19 if needed, and predict
    """
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    try:
        # ከFrontend የሚመጣውን ውሂብ አምጣ
        # ይህ በሁለት አይነት ሊመጣ ይችላል
        
        # አማራጭ 1: ቀጥተኛ የ7 ባህሪያት ዝርዝር
        if "features" in request:
            input_features = request.get("features", [])
        # አማራጭ 2: በstudent_data ውስጥ የተደረደሩ ባህሪያት
        elif "student_data" in request:
            data = request["student_data"]
            input_features = [
                data.get("Hours_Studied", 0),
                data.get("Attendance", 0),
                data.get("Parental_Involvement", 0),
                data.get("Access_to_Resources", 0),
                data.get("Extracurricular_Activities", 0),
                data.get("Sleep_Hours", 0),
                data.get("Previous_Scores", 0)
            ]
        else:
            # አማራጭ 3: በቀጥታ የሚላኩ 7 መስኮች
            input_features = [
                request.get("Hours_Studied", 0),
                request.get("Attendance", 0),
                request.get("Parental_Involvement", 0),
                request.get("Access_to_Resources", 0),
                request.get("Extracurricular_Activities", 0),
                request.get("Sleep_Hours", 0),
                request.get("Previous_Scores", 0)
            ]
        
        print(f"📥 Received features: {input_features}")
        print(f"📊 Input length: {len(input_features)}")
        
        # ስኬለሩ ምን ያህል ባህሪ እንደሚጠብቅ ፈትሽ
        expected_features = scaler.n_features_in_
        
        # 19 ባህሪያት ለመስራት (ያልተላኩትን በ0 ሙላ)
        if len(input_features) == 7 and expected_features == 19:
            # ተጨማሪ 12 ባህሪያት በ0 ሙላ
            full_features = input_features + [0] * 12
            print(f"📊 Converted 7 → {len(full_features)} features (added 12 zeros)")
        elif len(input_features) == expected_features:
            full_features = input_features
            print(f"📊 Using {len(full_features)} features directly")
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Feature mismatch: Got {len(input_features)} features, but model expects {expected_features}"
            )
        
        # ትንበያ
        scaled_data = scaler.transform([full_features])
        prediction = model.predict(scaled_data)
        predicted_score = round(float(prediction[0]), 2)
        
        print(f"✅ Predicted score: {predicted_score}%")
        
        # ምላሽ
        response = {
            "predicted_score": predicted_score,
            "input_features_used": len(full_features)
        }
        
        # የተላከው ውሂብ መልስ ላክ (ለማጣራት)
        if "student_id" in request:
            response["student_id"] = request["student_id"]
        if "student_name" in request:
            response["student_name"] = request["student_name"]
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ለሙከራ ቀላል POST endpoint
@app.post("/predict-simple")
async def predict_simple(data: dict):
    """Simple endpoint that accepts any format"""
    try:
        # Try to extract 7 values
        values = []
        keys = ['Hours_Studied', 'Attendance', 'Parental_Involvement', 
                'Access_to_Resources', 'Extracurricular_Activities', 
                'Sleep_Hours', 'Previous_Scores']
        
        for key in keys:
            val = data.get(key, 0)
            values.append(float(val))
        
        print(f"📥 Simple endpoint received: {values}")
        
        # Scale and predict
        if scaler.n_features_in_ == 19:
            full = values + [0] * 12
        else:
            full = values
        
        scaled = scaler.transform([full])
        pred = model.predict(scaled)
        
        return {"predicted_score": round(float(pred[0]), 2)}
        
    except Exception as e:
        return {"error": str(e), "predicted_score": 0}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)