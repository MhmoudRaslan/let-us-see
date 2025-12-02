import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')

# List all available models
url = f'https://generativelanguage.googleapis.com/v1/models?key={api_key}'

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}\n")
    
    if response.status_code == 200:
        data = response.json()
        print("Available models:")
        print("=" * 50)
        
        for model in data.get('models', []):
            name = model.get('name', '')
            supported_methods = model.get('supportedGenerationMethods', [])
            
            # Only show models that support generateContent
            if 'generateContent' in supported_methods:
                print(f"✅ {name}")
                print(f"   Methods: {', '.join(supported_methods)}\n")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Exception: {e}")