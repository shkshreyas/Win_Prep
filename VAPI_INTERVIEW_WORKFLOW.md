# Enhanced Interview Workflow

## Real-time Interview Analysis Workflow

```json
{
  "name": "AI Interview with Real-time Analysis",
  "version": "2.0.0",
  "states": {
    "welcome": {
      "messages": [
        {
          "role": "assistant",
          "content": "Hello {username}! I'll be conducting your interview today. I'll ask you questions and provide real-time feedback. Ready to begin?"
        }
      ],
      "transitions": {
        "on_ready": "question_intro",
        "on_not_ready": "reschedule"
      }
    },
    "question_intro": {
      "messages": [
        {
          "role": "assistant",
          "content": "I'll now ask you the first question. Take your time to think before answering."
        }
      ],
      "transitions": {
        "next": "ask_question"
      }
    },
    "ask_question": {
      "messages": [
        {
          "role": "assistant",
          "content": "{current_question}"
        }
      ],
      "transitions": {
        "on_answer": "process_answer",
        "on_timeout": "handle_timeout"
      }
    },
    "process_answer": {
      "actions": [
        {
          "type": "analyze_response",
          "params": {
            "question": "{current_question}",
            "response": "{last_response}",
            "context": "{interview_context}"
          }
        }
      ],
      "transitions": {
        "has_followup": "ask_followup",
        "next_question": "transition_question",
        "complete": "wrap_up"
      }
    },
    "ask_followup": {
      "messages": [
        {
          "role": "assistant",
          "content": "{followup_question}"
        }
      ],
      "transitions": {
        "on_answer": "process_answer"
      }
    },
    "transition_question": {
      "messages": [
        {
          "role": "assistant",
          "content": "Thank you for that response. Let's move on to the next question."
        }
      ],
      "transitions": {
        "next": "ask_question"
      }
    },
    "wrap_up": {
      "messages": [
        {
          "role": "assistant",
          "content": "Thank you for completing the interview. I've analyzed your responses and will provide comprehensive feedback shortly."
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
      "settings": {
        "stability": 0.7,
        "similarity_boost": 0.7,
        "style": 0.7,
        "use_speaker_boost": true
      }
    },
    "speech_recognition": {
      "provider": "whisper",
      "language": "en-US",
      "model": "whisper-1"
    }
  }
}
```

## Integration with Gemini

The workflow integrates with Gemini AI in three ways:

1. **Real-time Response Analysis**

   - Analyzes each answer immediately after it's given
   - Provides scores and brief feedback
   - Determines if follow-up questions are needed

2. **Follow-up Generation**

   - Generates contextual follow-up questions based on response quality
   - Ensures complete understanding of candidate's knowledge

3. **Final Assessment**
   - Comprehensive analysis of entire interview
   - Detailed feedback across multiple categories
   - Specific improvement recommendations

## Webhook Configuration

```json
{
  "endpoints": {
    "analyze_response": "/api/interview/analyze",
    "generate_followup": "/api/interview/followup",
    "create_feedback": "/api/interview/feedback"
  },
  "headers": {
    "Authorization": "Bearer ${NEXT_PUBLIC_VAPI_WEB_TOKEN}",
    "Content-Type": "application/json"
  }
}
```
