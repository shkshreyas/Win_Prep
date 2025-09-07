# VAPI Integration Guide for AI Mock Interviews

## Environment Variables Required

```env
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_web_token
NEXT_PUBLIC_VAPI_WORKFLOW_ID=your_workflow_id
NEXT_PUBLIC_BASE_URL=your_base_url
```

## Workflow Requirements

### Basic Setup

- **Name**: AI Interview Assistant
- **Description**: An AI-powered interview conductor that handles technical and behavioral interviews
- **Language**: English
- **Voice Type**: Professional, natural-sounding

### API Integration

- **Webhook URL**: `{NEXT_PUBLIC_BASE_URL}/api/vapi/generate`
- **Method**: POST
- **Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${NEXT_PUBLIC_VAPI_WEB_TOKEN}"
  }
  ```

## Workflow JSON Configuration

```json
{
  "name": "AI Interview Assistant",
  "version": "1.0.0",
  "workflow_id": "${NEXT_PUBLIC_VAPI_WORKFLOW_ID}",
  "initial_state": "welcome",
  "states": {
    "welcome": {
      "messages": [
        {
          "role": "assistant",
          "content": "Hello! I'll be conducting your interview today for the {role} position. This interview will focus on {type} questions. Are you ready to begin?"
        }
      ],
      "transitions": {
        "on_ready": "introduction",
        "on_not_ready": "reschedule"
      }
    },
    "introduction": {
      "messages": [
        {
          "role": "assistant",
          "content": "Great! I'll be asking you {amount} questions related to {role} at {level} level. The tech stack we'll be discussing includes {techstack}. Let's begin with the first question."
        }
      ],
      "transitions": {
        "next": "questions"
      }
    },
    "questions": {
      "messages": [
        {
          "role": "assistant",
          "content": "{current_question}"
        }
      ],
      "transitions": {
        "on_answer": "evaluate_progress",
        "on_timeout": "handle_timeout",
        "on_error": "error_handling"
      },
      "settings": {
        "timeout": 120,
        "max_retries": 2
      }
    },
    "evaluate_progress": {
      "conditions": {
        "all_questions_asked": "conclusion",
        "has_next_question": "questions"
      }
    },
    "handle_timeout": {
      "messages": [
        {
          "role": "assistant",
          "content": "I notice you're taking some time. Would you like me to repeat the question or move to the next one?"
        }
      ],
      "transitions": {
        "on_repeat": "questions",
        "on_next": "evaluate_progress"
      }
    },
    "error_handling": {
      "messages": [
        {
          "role": "assistant",
          "content": "I apologize, but I'm having trouble understanding. Could you please rephrase your answer?"
        }
      ],
      "transitions": {
        "on_retry": "questions",
        "on_skip": "evaluate_progress"
      }
    },
    "conclusion": {
      "messages": [
        {
          "role": "assistant",
          "content": "Thank you for completing the interview. Your responses have been recorded and will be analyzed. Do you have any questions for me?"
        }
      ],
      "transitions": {
        "on_questions": "answer_questions",
        "on_no_questions": "farewell"
      }
    },
    "farewell": {
      "messages": [
        {
          "role": "assistant",
          "content": "Thank you for your time today. You'll receive feedback on your interview performance shortly. Good luck with your job search!"
        }
      ],
      "transitions": {
        "end": true
      }
    }
  },
  "settings": {
    "voice": {
      "provider": "elevenlabs",
      "voice_id": "professional",
      "settings": {
        "stability": 0.7,
        "similarity_boost": 0.7
      }
    },
    "speech_recognition": {
      "language": "en-US",
      "model": "whisper-1"
    },
    "conversation": {
      "max_turns": 50,
      "response_timeout": 30
    }
  },
  "error_handling": {
    "max_retries": 3,
    "fallback_message": "I apologize, but we're experiencing technical difficulties. Please try again in a moment."
  }
}
```

## Variable Definitions

### Required Input Variables

- `role`: Job role being interviewed for
- `level`: Experience level (Junior/Mid/Senior)
- `techstack`: Array of required technical skills
- `type`: Interview focus (technical/behavioral)
- `amount`: Number of questions to ask
- `userid`: Unique identifier for the candidate

### Generated Variables

- `current_question`: Currently active question from the questions array
- `questions_asked`: Counter for tracking progress
- `interview_duration`: Total time spent in interview

## Webhook Integration

### Request Format

```json
{
  "type": "string",
  "role": "string",
  "level": "string",
  "techstack": "string",
  "amount": "number",
  "userid": "string"
}
```

### Response Format

```json
{
  "success": true,
  "data": {
    "id": "string",
    "questions": ["string"],
    "role": "string",
    "type": "string",
    "level": "string",
    "techstack": ["string"],
    "userId": "string",
    "finalized": true,
    "coverImage": "string",
    "createdAt": "string"
  }
}
```

## Testing Checklist

1. Basic Flow Testing:

   - [ ] Welcome message displays correctly
   - [ ] Questions are generated and asked sequentially
   - [ ] Responses are recorded properly
   - [ ] Conclusion flow works as expected

2. Error Handling:

   - [ ] Timeout handling works
   - [ ] Network disconnection recovery
   - [ ] Invalid input handling
   - [ ] API error handling

3. Integration Testing:

   - [ ] Firebase storage integration
   - [ ] Webhook communication
   - [ ] Environment variable configuration
   - [ ] Response formatting

4. User Experience:
   - [ ] Voice quality and clarity
   - [ ] Natural conversation flow
   - [ ] Appropriate response timing
   - [ ] Clear error messages

## Security Considerations

1. Token Security:

   - Store VAPI tokens securely
   - Rotate tokens periodically
   - Use environment variables

2. Data Protection:

   - Encrypt sensitive data
   - Implement proper access controls
   - Follow data retention policies

3. API Security:
   - Implement rate limiting
   - Validate all inputs
   - Use HTTPS for all communications
