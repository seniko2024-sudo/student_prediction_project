import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestRegressor

# 1. ዳታውን መጫን
df = pd.read_csv("../data/StudentPerformanceFactors.csv")
# 2. ጽሁፎችን ወደ ቁጥር መቀየር (ሞዴሉ ቁጥር ብቻ ነው የሚረዳው)
le = LabelEncoder()
for col in df.select_dtypes(include=['object']).columns:
    df[col] = le.fit_transform(df[col])

# 3. ግብዓት (X) እና ውጤት (y) መለየት
X = df.drop('Exam_Score', axis=1) 
y = df['Exam_Score']

# 4. መረጃውን ለስልጠና ማዘጋጀት
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

# 5. ሞዴሉን ማሰልጠን
model = RandomForestRegressor(n_estimators=100)
model.fit(X_train_scaled, y_train)

# 6. ፋይሎቹን ሴቭ ማድረግ (ለ FastAPI የሚሆኑት እነዚህ ናቸው)
joblib.dump(model, 'backend/student_model.joblib')
joblib.dump(scaler, 'backend/scaler.joblib')

print("ሞዴሉ ሰልጥኖ አልቋል! ፋይሎቹ በ backend ፎልደር ውስጥ ተቀምጠዋል።")