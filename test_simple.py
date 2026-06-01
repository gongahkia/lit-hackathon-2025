import json
import google.generativeai as genai

def test_gemini_config():
    try:
        # Load API key from configuration file
        with open('classroom-ai.json', 'r') as f:
            config = json.load(f)
        
        print("✓ Configuration file loaded successfully")
        print(f"✓ API key found: {config['gemini_api_key'][:10]}...")
        
        # Configure Gemini API
        genai.configure(api_key=config['gemini_api_key'])
        print("✓ Gemini API configured successfully")
        
        # Initialize Gemini Pro Model
        model = genai.GenerativeModel('gemini-1.5-flash')
        print("✓ Model initialized successfully")
        
        # Test a simple generation
        response = model.generate_content("Say 'Hello, World!'")
        print("✓ Test generation successful")
        print(f"Response: {response.text}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing Gemini API configuration...")
    success = test_gemini_config()
    if success:
        print("\n✓ All tests passed! Backend should work correctly.")
    else:
        print("\n✗ Tests failed. Please check the configuration.") 