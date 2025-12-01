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
def anthropic_proxy(request):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return Response({"error": "ANTHROPIC_API_KEY not set on server"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    try:
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            json=request.data,
            headers={
                "x-api-key": api_key,  # ← Changed from Authorization
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01",
            },
            timeout=60,
        )
        return Response(resp.json(), status=resp.status_code)
    except requests.RequestException as e:
        return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)
