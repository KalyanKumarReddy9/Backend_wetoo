const axios = require('axios');

// Simple rule-based responses for demo purposes
// In production, this would route to an AI service or more sophisticated chatbot
const ruleBasedResponses = {
  en: {
    'hello': 'Hello! How can I help you today?',
    'help': 'I can help you with: hospital visits, rides, groceries, companionship. What do you need?',
    'hospital': 'I can help arrange hospital visits. Please create a request in the app.',
    'ride': 'I can help arrange transportation. Please create a request in the app.',
    'grocery': 'I can help with grocery shopping. Please create a request in the app.',
    'companionship': 'I can help arrange companionship visits. Please create a request in the app.',
    'default': 'Thank you for your message. Please use the app to create specific service requests.'
  },
  te: {
    'hello': 'నమస్కారం! నేను మీకు ఎలా సహాయం చేయగలను?',
    'help': 'నేను మీకు సహాయం చేయగలను: ఆసుపత్రి సందర్శనలు, రైడ్‌లు, కిరాణా, స్నేహితత్వం. మీకు ఏమి కావాలి?',
    'hospital': 'నేను ఆసుపత్రి సందర్శనలను ఏర్పాటు చేయడానికి సహాయపడగలను. దయచేసి అప్లికేషన్‌లో అభ్యర్థనను సృష్టించండి.',
    'ride': 'నేను రవాణాను ఏర్పాటు చేయడానికి సహాయపడగలను. దయచేసి అప్లికేషన్‌లో అభ్యర్థనను సృష్టించండి.',
    'grocery': 'నేను కిరాణా షాపింగ్‌లో సహాయపడగలను. దయచేసి అప్లికేషన్‌లో అభ్యర్థనను సృష్టించండి.',
    'companionship': 'నేను స్నేహితత్వ సందర్శనలను ఏర్పాటు చేయడానికి సహాయపడగలను. దయచేసి అప్లికేషన్‌లో అభ్యర్థనను సృష్టించండి.',
    'default': 'మీ సందేశానికి ధన్యవాదాలు. దయచేసి నిర్దిష్ట సేవా అభ్యర్థనలను సృష్టించడానికి అప్లికేషన్‌ను ఉపయోగించండి.'
  }
};

async function chatMessage(req, res) {
  try {
    const { message, lang = 'en' } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Check if we have a face service URL configured
    const faceServiceUrl = process.env.FACE_SERVICE_URL;
    
    if (faceServiceUrl) {
      // Route to external face service if available
      try {
        const response = await axios.post(`${faceServiceUrl}/chat`, {
          message,
          lang,
          userId: req.user?.sub,
          userRole: req.user?.role
        }, {
          timeout: 5000
        });
        
        return res.json({
          reply: response.data?.reply || 'I received your message but the service is temporarily unavailable.',
          source: 'face-service'
        });
      } catch (error) {
        console.error('Face service error:', error.message);
        // Fallback to rule-based responses
      }
    }

    // Fallback to rule-based responses
    const responses = ruleBasedResponses[lang] || ruleBasedResponses.en;
    const lowerMessage = message.toLowerCase();
    
    let reply = responses.default;
    
    // Find matching response
    for (const [key, response] of Object.entries(responses)) {
      if (key !== 'default' && lowerMessage.includes(key)) {
        reply = response;
        break;
      }
    }

    return res.json({
      reply,
      source: 'rule-based',
      lang
    });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ 
      message: 'Chat service temporarily unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { chatMessage };
