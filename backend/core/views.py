import os
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt

@api_view(['GET'])
def health_check(request):
    return Response({"status": "Backend is running!"})

@csrf_exempt
@api_view(['POST'])
def gemini_chat(request):
    """
    FREE Gemini API endpoint
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        return Response(
            {"error": "GEMINI_API_KEY not set on server"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    try:
        # Get messages from request
        messages = request.data.get('messages', [])
        
        if not messages:
            return Response(
                {"error": "No messages provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the last user message
        last_message = messages[-1]['content']
        
        # Call Gemini API
        gemini_url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}'
        
        payload = {
            'contents': [{
                'parts': [{
                    'text': last_message
                }]
            }]
        }
        
        response = requests.post(gemini_url, json=payload, timeout=30)
        
        if response.status_code != 200:
            return Response(
                {"error": f"Gemini API error: {response.text}"}, 
                status=response.status_code
            )
        
        data = response.json()
        
        # Extract the response text
        text = data['candidates'][0]['content']['parts'][0]['text']
        
        # Return in the same format as Anthropic for compatibility
        return Response({
            'content': [{'text': text}]
        })
        
    except requests.RequestException as e:
        return Response(
            {"error": f"Request error: {str(e)}"}, 
            status=status.HTTP_502_BAD_GATEWAY
        )
    except (KeyError, IndexError) as e:
        return Response(
            {"error": f"Invalid response format: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )