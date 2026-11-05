import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [mode, setMode] = useState('form');
  
  const [studentInfo, setStudentInfo] = useState({
    studentId: '',
    studentName: '',
    nameLanguage: 'amharic'
  });
  
  const [formData, setFormData] = useState({
    Hours_Studied: '',
    Attendance: '',
    Parental_Involvement: '',
    Access_to_Resources: '',
    Extracurricular_Activities: '',
    Sleep_Hours: '',
    Previous_Scores: ''
  });

  const [prediction, setPrediction] = useState(null);
  const [activeTab, setActiveTab] = useState('Hours_Studied');
  const [previousResult, setPreviousResult] = useState(null);

  // የቀድሞ ውጤት ለማስታወስ ቁልፍ (እያንዳንዱ ተማሪ የራሱ ይሆናል)
  const getStorageKey = (studentId) => `student_result_${studentId}`;

  const handleStudentChange = (e) => {
    setStudentInfo({ ...studentInfo, [e.target.name]: e.target.value });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) });
  };

  const handlePredict = async () => {
    if (!studentInfo.studentId || !studentInfo.studentName) {
      alert("እባክዎ የተማሪ መለያ እና ስም ያስገቡ!");
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:8000/predict', formData);
      const newPrediction = response.data.predicted_score;
      setPrediction(newPrediction);
      
      // የቀድሞ ውጤት ከ localStorage አምጣ
      const storageKey = getStorageKey(studentInfo.studentId);
      const savedResult = localStorage.getItem(storageKey);
      
      if (savedResult) {
        const parsedResult = JSON.parse(savedResult);
        setPreviousResult(parsedResult);
      } else {
        setPreviousResult(null);
      }
      
      setMode('result');
    } catch (error) {
      console.error("Error predicting:", error);
      alert("Python ሰርቨሩ አልተነሳም ወይም ችግር አለ!");
    }
  };

  // ወደ ቅፅ ስንመለስ አዲሱን ውጤት ማስቀመጥ (ይህ ቁልፍ ነው!)
  const handleBack = () => {
    // አዲሱን ውጤት በ localStorage ውስጥ አስቀምጥ
    if (prediction !== null && studentInfo.studentId) {
      const storageKey = getStorageKey(studentInfo.studentId);
      const resultData = {
        score: prediction,
        date: new Date().toLocaleString(),
        studentName: studentInfo.studentName
      };
      localStorage.setItem(storageKey, JSON.stringify(resultData));
      console.log("Saved to localStorage:", storageKey, resultData); // ለመፈተሽ
    }
    setMode('form');
  };

  // ምክር ለማመንጨት ተግባር
  const getRecommendations = () => {
    const recommendations = [];
    const isAmharic = studentInfo.nameLanguage === 'amharic';
    
    // ከቀድሞ ውጤት ጋር ማወዳደር
    if (previousResult !== null) {
      const progress = (prediction - previousResult.score).toFixed(2);
      if (progress > 0) {
        recommendations.push(isAmharic ?
          `🎉 እንኳን ደስ ያለዎት! ውጤትዎ ከቀድሞው ውጤት (${previousResult.score}%) በ${progress}% አሻሽሏል!` :
          `🎉 Congratulations! Your score has improved by ${progress}% from your previous score (${previousResult.score}%)!`);
      } else if (progress < 0) {
        recommendations.push(isAmharic ?
          `⚠️ ውጤትዎ ከቀድሞው ውጤት (${previousResult.score}%) በ${Math.abs(progress)}% ቀንሷል።` :
          `⚠️ Your score has decreased by ${Math.abs(progress)}% from your previous score (${previousResult.score}%).`);
      } else {
        recommendations.push(isAmharic ?
          `➖ ውጤትዎ ከቀድሞው ውጤት (${previousResult.score}%) ጋር ተመሳሳይ ነው።` :
          `➖ Your score is the same as your previous score (${previousResult.score}%).`);
      }
    } else {
      recommendations.push(isAmharic ?
        `📝 ይህ የመጀመሪያ ውጤትዎ ነው! ቀጥሎ ሲተነብዩ እድገትዎን ማየት ይችላሉ።` :
        `📝 This is your first result! You will see your progress next time.`);
    }
    
    // በጥናት ሰዓት ላይ ምክር
    if (formData.Hours_Studied < 15) {
      recommendations.push(isAmharic ? 
        '📚 የጥናት ሰዓትዎን ወደ 15-20 ሰዓት በሳምንት ለማሳደግ ይሞክሩ።' : 
        '📚 Try to increase your study hours to 15-20 hours per week.');
    } else if (formData.Hours_Studied > 25) {
      recommendations.push(isAmharic ?
        '⚠️ ብዙ ጥናት ጥሩ ቢሆንም፣ ለእረፍት ጊዜ መስጠት አይርሱ።' :
        '⚠️ While studying a lot is good, don\'t forget to take breaks.');
    } else {
      recommendations.push(isAmharic ?
        '✅ የጥናት ሰዓትዎ ጥሩ ነው! ይቀጥሉ።' :
        '✅ Your study hours are good! Keep it up.');
    }
    
    // በመገኘት ላይ ምክር
    if (formData.Attendance < 75) {
      recommendations.push(isAmharic ?
        '🏫 መገኘትዎ ዝቅተኛ ነው። ክፍልን በመደበኛነት ይከታተሉ።' :
        '🏫 Your attendance is low. Attend classes regularly.');
    } else if (formData.Attendance >= 90) {
      recommendations.push(isAmharic ?
        '🌟 በጣም ጥሩ መገኘት! ይህንን ይቀጥሉ።' :
        '🌟 Excellent attendance! Keep this up.');
    }
    
    // በእንቅልፍ ላይ ምክር
    if (formData.Sleep_Hours < 6) {
      recommendations.push(isAmharic ?
        '😴 የእንቅልፍ ሰዓትዎ በቂ አይደለም! ቢያንስ 7-8 ሰዓት ይተኛሉ።' :
        '😴 Your sleep hours are insufficient! Get at least 7-8 hours of sleep.');
    } else if (formData.Sleep_Hours > 9) {
      recommendations.push(isAmharic ?
        '💤 ብዙ እንቅልፍ ያደርጋሉ። ጥናትዎን ለማራመድ ተጨማሪ ጊዜ ይመድቡ።' :
        '💤 You sleep a lot. Allocate more time for studying.');
    } else {
      recommendations.push(isAmharic ?
        '😊 የእንቅልፍ ሰዓትዎ በጣም ጥሩ ነው!' :
        '😊 Your sleep schedule is very good!');
    }
    
    return recommendations;
  };

  const inputFields = [
    { id: 'Hours_Studied', label: 'የጥናት ሰዓት (በሳምንት)', hint: 'በሳምንት በአማካይ ስንት ሰዓት ያጠናሉ?' },
    { id: 'Attendance', label: 'የገጽታ መገኘት (Attendance %)', hint: 'ከ 0 እስከ 100 ባለው መቶኛ ያስገቡ።' },
    { id: 'Parental_Involvement', label: 'የወላጆች ተሳትፎ (0-2)', hint: '0=ዝቅተኛ፣ 1=መካከለኛ፣ 2=ከፍተኛ ተሳትፎ።' },
    { id: 'Access_to_Resources', label: 'የትምህርት ግብዓቶች (0-2)', hint: '0=ዝቅተኛ፣ 1=መካከለኛ፣ 2=ከፍተኛ ተደራሽነት።' },
    { id: 'Extracurricular_Activities', label: 'ተጨማሪ እንቅስቃሴዎች (0-1)', hint: 'በክለቦች ወይም ስፖርት የሚሳተፉ ከሆነ 1፣ ካልሆነ 0 ያስገቡ።' },
    { id: 'Sleep_Hours', label: 'የእንቅልፍ ሰዓት', hint: 'በቀን በአማካይ ስንት ሰዓት ይተኛሉ?' },
    { id: 'Previous_Scores', label: 'ያለፈው ውጤት (Previous Score)', hint: 'ያለፈው ሴሚስተር አማካይ ውጤትዎ ስንት ነበር?' }
  ];

  const currentField = inputFields.find(f => f.id === activeTab);

  // ==================== የውጤት ገፅ ====================
  if (mode === 'result') {
    const isAmharic = studentInfo.nameLanguage === 'amharic';
    const recommendations = getRecommendations();
    const hasPrevious = previousResult !== null;
    const progress = hasPrevious ? (prediction - previousResult.score).toFixed(2) : null;
    
    return (
      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
        
        <button onClick={handleBack} style={{ position: 'absolute', top: '20px', left: '20px', padding: '12px 24px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>
          ← {isAmharic ? 'ወደ መጀመሪያ ገፅ ተመለስ' : 'Back to Home'}
        </button>

        <div style={{ backgroundColor: '#1a237e', color: 'white', padding: '15px 30px', borderRadius: '15px', display: 'inline-block', marginBottom: '30px' }}>
          <strong>{isAmharic ? '👨‍🎓 ተማሪ' : '👨‍🎓 Student'}</strong> {studentInfo.studentName} ({studentInfo.studentId})
        </div>

        <h1 style={{ color: '#1a237e', marginBottom: '30px' }}>🎉 {isAmharic ? 'የውጤት ዘገባ' : 'Result Report'} 🎉</h1>

        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', maxWidth: '500px', margin: '0 auto 30px auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#333' }}>{isAmharic ? 'የተተነበየው ውጤት' : 'Predicted Score'}</h2>
          <div style={{ fontSize: '72px', fontWeight: 'bold', color: '#28a745', margin: '20px 0', padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '15px' }}>
            {prediction}%
          </div>
        </div>

        {/* የእድገት ክፍል - ከቀድሞ ውጤት ጋር ማወዳደር */}
        {hasPrevious && (
          <div style={{
            margin: '0 auto 30px auto',
            padding: '20px',
            borderRadius: '15px',
            maxWidth: '500px',
            backgroundColor: progress > 0 ? '#e8f5e9' : (progress < 0 ? '#ffebee' : '#fff3e0'),
            borderLeft: `5px solid ${progress > 0 ? '#4caf50' : (progress < 0 ? '#f44336' : '#ff9800')}`
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>
              {isAmharic ? '📈 ከቀድሞ ውጤት ጋር ማወዳደር' : '📈 Comparison with Previous Result'}
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                  {isAmharic ? 'የቀድሞ ውጤት' : 'Previous Score'}
                </p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9800', margin: '5px 0' }}>
                  {previousResult.score}%
                </p>
                <p style={{ fontSize: '12px', color: '#999' }}>
                  {previousResult.date}
                </p>
              </div>
              <div style={{ fontSize: '30px' }}>
                {progress > 0 ? '📈' : (progress < 0 ? '📉' : '➡️')}
              </div>
              <div>
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                  {isAmharic ? 'አሁን ያለው ውጤት' : 'Current Score'}
                </p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745', margin: '5px 0' }}>
                  {prediction}%
                </p>
              </div>
            </div>
            <div style={{
              marginTop: '15px',
              padding: '10px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.7)'
            }}>
              <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: progress > 0 ? '#2e7d32' : (progress < 0 ? '#c62828' : '#ef6c00') }}>
                {progress > 0 ? `🎉 +${progress}% ${isAmharic ? 'ማሻሻያ' : 'Improvement'}` : 
                 progress < 0 ? `⚠️ ${progress}% ${isAmharic ? 'መቀነስ' : 'Decrease'}` : 
                 `➖ ${isAmharic ? 'ምንም ለውጥ የለም' : 'No Change'}`}
              </p>
            </div>
          </div>
        )}

        {/* ማክሮዎች */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '15px', width: '250px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '40px' }}>📚</div>
            <h3 style={{ color: '#1a237e' }}>{isAmharic ? 'የጥናት ሰዓት' : 'Study Hours'}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3f51b5' }}>{formData.Hours_Studied} {isAmharic ? 'ሰዓት/ሳምንት' : 'hrs/week'}</p>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '15px', width: '250px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '40px' }}>📊</div>
            <h3 style={{ color: '#1a237e' }}>{isAmharic ? 'መገኘት' : 'Attendance'}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3f51b5' }}>{formData.Attendance}%</p>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '15px', width: '250px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '40px' }}>👨‍👩‍👧</div>
            <h3 style={{ color: '#1a237e' }}>{isAmharic ? 'የወላጆች ተሳትፎ' : 'Parent Involvement'}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3f51b5' }}>
              {formData.Parental_Involvement === 0 ? (isAmharic ? 'ዝቅተኛ' : 'Low') : formData.Parental_Involvement === 1 ? (isAmharic ? 'መካከለኛ' : 'Medium') : (isAmharic ? 'ከፍተኛ' : 'High')}
            </p>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '15px', width: '250px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '40px' }}>💻</div>
            <h3 style={{ color: '#1a237e' }}>{isAmharic ? 'ግብዓቶች' : 'Resources'}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3f51b5' }}>
              {formData.Access_to_Resources === 0 ? (isAmharic ? 'ዝቅተኛ' : 'Low') : formData.Access_to_Resources === 1 ? (isAmharic ? 'መካከለኛ' : 'Medium') : (isAmharic ? 'ከፍተኛ' : 'High')}
            </p>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '15px', width: '250px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '40px' }}>⚽</div>
            <h3 style={{ color: '#1a237e' }}>{isAmharic ? 'ተጨማሪ እንቅስቃሴ' : 'Extracurricular'}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3f51b5' }}>
              {formData.Extracurricular_Activities === 1 ? (isAmharic ? 'አዎ' : 'Yes') : (isAmharic ? 'አይ' : 'No')}
            </p>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '15px', width: '250px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '40px' }}>😴</div>
            <h3 style={{ color: '#1a237e' }}>{isAmharic ? 'የእንቅልፍ ሰዓት' : 'Sleep Hours'}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3f51b5' }}>{formData.Sleep_Hours} {isAmharic ? 'ሰዓት/ቀን' : 'hrs/day'}</p>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '15px', width: '250px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '40px' }}>📝</div>
            <h3 style={{ color: '#1a237e' }}>{isAmharic ? 'ያለፈው ውጤት' : 'Previous Score'}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3f51b5' }}>{formData.Previous_Scores}%</p>
          </div>
        </div>

        {/* ምክር ክፍል */}
        <div style={{ backgroundColor: '#fff3e0', padding: '25px', borderRadius: '15px', maxWidth: '800px', margin: '30px auto', textAlign: 'left', borderLeft: '5px solid #ff9800' }}>
          <h3 style={{ color: '#e65100', marginBottom: '15px' }}>💡 {isAmharic ? 'ምክሮች እና አስተያየቶች' : 'Recommendations & Feedback'}</h3>
          <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#333', margin: 0, paddingLeft: '20px' }}>
            {recommendations.map((rec, index) => (
              <li key={index} style={{ marginBottom: '10px' }}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // ==================== የመጀመሪያ ገፅ ====================
  return (
    <div className="App" style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      
      <h1 style={{ color: '#1a237e', marginBottom: '30px' }}>የተማሪ ውጤት መተንበያ ሲስተም</h1>

      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px', maxWidth: '500px', margin: '0 auto 30px auto', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <h3 style={{ color: '#1a237e', marginBottom: '20px' }}>👨‍🎓 የተማሪ መረጃ ያስገቡ</h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => setStudentInfo({ ...studentInfo, nameLanguage: 'amharic' })}
            style={{
              padding: '8px 20px',
              backgroundColor: studentInfo.nameLanguage === 'amharic' ? '#1a237e' : '#ddd',
              color: studentInfo.nameLanguage === 'amharic' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            አማርኛ
          </button>
          <button
            type="button"
            onClick={() => setStudentInfo({ ...studentInfo, nameLanguage: 'english' })}
            style={{
              padding: '8px 20px',
              backgroundColor: studentInfo.nameLanguage === 'english' ? '#1a237e' : '#ddd',
              color: studentInfo.nameLanguage === 'english' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            English
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            name="studentId"
            placeholder={studentInfo.nameLanguage === 'amharic' ? "የተማሪ መለያ (ለምሳሌ: STU-001)" : "Student ID (e.g., STU-001)"}
            value={studentInfo.studentId}
            onChange={handleStudentChange}
            style={{ padding: '12px', borderRadius: '10px', border: '2px solid #ddd', fontSize: '16px' }}
          />
          <input
            type="text"
            name="studentName"
            placeholder={studentInfo.nameLanguage === 'amharic' ? "ሙሉ ስም (ለምሳሌ: አለማየሁ ተሾመ)" : "Full Name (e.g., Alemayehu Teshome)"}
            value={studentInfo.studentName}
            onChange={handleStudentChange}
            style={{ padding: '12px', borderRadius: '10px', border: '2px solid #ddd', fontSize: '16px' }}
          />
        </div>
      </div>

      <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '320px' }}>
          {inputFields.map((field) => (
            <button
              key={field.id}
              onClick={() => setActiveTab(field.id)}
              style={{
                padding: '18px',
                textAlign: 'left',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === field.id ? '#1a237e' : '#fff',
                color: activeTab === field.id ? '#fff' : '#333',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                fontWeight: '600',
                fontSize: '15px'
              }}
            >
              {field.label}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '20px', width: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#333', marginBottom: '10px' }}>{currentField.label}</h3>
          <div style={{ backgroundColor: '#e8eaf6', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', color: '#3f51b5' }}>
            💡 {currentField.hint}
          </div>
          <input
            type="number"
            name={activeTab}
            value={formData[activeTab]}
            onChange={handleChange}
            autoFocus
            style={{ width: '100%', padding: '15px', fontSize: '24px', borderRadius: '12px', border: '2px solid #ddd', textAlign: 'center' }}
          />
          <button onClick={handlePredict} style={{ marginTop: '30px', padding: '18px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', width: '100%' }}>
            {studentInfo.nameLanguage === 'amharic' ? 'ውጤቱን ተንብይ' : 'Predict Result'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;