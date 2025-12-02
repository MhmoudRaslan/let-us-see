import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"Using API key: {api_key[:15]}..." if api_key else "No API key found!")

# ✅ Using the correct model name
url = f'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={api_key}'

payload = {
    'contents': [{
        'parts': [{
            'text': 'Say hello in one sentence!'
        }]
    }]
}

try:
    response = requests.post(url, json=payload)
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        text = data['candidates'][0]['content']['parts'][0]['text']
        print(f"\n✅ SUCCESS! Gemini says: {text}")
    else:
        print(f"❌ Error: {response.text}")
except Exception as e:
    print(f"❌ Exception: {e}")