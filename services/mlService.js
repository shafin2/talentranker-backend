import axios from 'axios';

const ML_API_URL = 'https://ahmadmahmood447.pythonanywhere.com/api';

/**
 * Rank a single CV against a JD using ML model
 * @param {string} jdText - Job description text
 * @param {string} resumeText - Resume/CV text
 * @returns {Promise<Object>} Prediction result { prediction, confidence }
 */
export const rankCV = async (jdText, resumeText) => {
  try {
    console.log('🔄 Sending request to ML API...');
    console.log(`📝 JD text length: ${jdText.length} chars`);
    console.log(`📄 Resume text length: ${resumeText.length} chars`);
    
    const response = await axios.post(
      ML_API_URL,
      {
        jd: jdText,
        resume: resumeText
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log('✅ ML API Response:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.result) {
      const result = {
        prediction: response.data.result.prediction,
        confidence: parseFloat(response.data.result.confidence.toFixed(2))
      };
      console.log(`🎯 Prediction: ${result.prediction} (${result.confidence}% confidence)`);
      return result;
    }

    throw new Error('Invalid response from ML model');
  } catch (error) {
    console.error('❌ ML API Error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('ML model request timeout');
    }
    
    if (error.response) {
      throw new Error(`ML model error: ${error.response.status}`);
    }
    
    throw new Error('Failed to get prediction from ML model');
  }
};

/**
 * Rank multiple CVs against a JD
 * @param {string} jdText - Job description text
 * @param {Array} cvs - Array of CV objects with { id, filename, content }
 * @returns {Promise<Array>} Array of ranking results
 */
export const rankMultipleCVs = async (jdText, cvs) => {
  const results = [];
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Starting batch ranking: ${cvs.length} CVs`);
  console.log('='.repeat(60) + '\n');
  
  for (let i = 0; i < cvs.length; i++) {
    const cv = cvs[i];
    console.log(`\n[${i + 1}/${cvs.length}] Processing: ${cv.filename}`);
    try {
      const prediction = await rankCV(jdText, cv.content);
      results.push({
        cvId: cv.id,
        filename: cv.filename,
        prediction: prediction.prediction,
        confidence: prediction.confidence
      });
      console.log(`✅ Success: ${cv.filename} - ${prediction.prediction} (${prediction.confidence}%)`);
    } catch (error) {
      console.error(`❌ Error ranking CV ${cv.filename}:`, error.message);
      results.push({
        cvId: cv.id,
        filename: cv.filename,
        prediction: 'Error',
        confidence: 0,
        error: error.message
      });
    }
  }

  // Sort by confidence (highest first), then by prediction (Relevant first)
  results.sort((a, b) => {
    if (a.prediction === 'Relevant' && b.prediction !== 'Relevant') return -1;
    if (a.prediction !== 'Relevant' && b.prediction === 'Relevant') return 1;
    return b.confidence - a.confidence;
  });

  return results;
};
