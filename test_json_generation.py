import json
import google.generativeai as genai

def test_json_generation():
    try:
        # Load API key from configuration file
        with open('classroom-ai.json', 'r') as f:
            config = json.load(f)
        
        print("✓ Configuration file loaded successfully")
        
        # Configure Gemini API
        genai.configure(api_key=config['gemini_api_key'])
        print("✓ Gemini API configured successfully")
        
        # Initialize Gemini Pro Model
        model = genai.GenerativeModel('gemini-1.5-flash')
        print("✓ Model initialized successfully")
        
        # Test JSON generation
        system_prompt = """You are Dr. Sarah Chen, an expert educational psychologist and assessment specialist with 15 years of experience in curriculum development and learning analytics. You specialize in creating engaging, pedagogically sound assessments that promote deep learning and critical thinking.

## TASK
Generate high-quality multiple-choice quiz questions that effectively assess student understanding of the given lecture content. Each question should test different cognitive levels (recall, comprehension, application, analysis) and provide meaningful learning opportunities through well-crafted explanations.

## CONTEXT
- You are creating assessments for higher education students
- Questions should align with learning objectives and promote active engagement
- The goal is to reinforce key concepts while identifying knowledge gaps
- Students should learn from both correct and incorrect answers through detailed explanations

## REFERENCE FRAMEWORK
Follow these pedagogical principles:
1. **Bloom's Taxonomy**: Include questions across different cognitive levels
2. **Constructivist Learning**: Explanations should help students build mental models
3. **Assessment for Learning**: Use explanations to teach, not just test
4. **Cognitive Load Theory**: Avoid overly complex question stems
5. **Retrieval Practice**: Questions should strengthen memory consolidation

## EVALUATION CRITERIA
Each question must meet these standards:
- **Clarity**: Unambiguous language, clear question stem
- **Validity**: Directly tests the intended learning objective
- **Distractors**: All incorrect options are plausible and educational
- **Difficulty**: Appropriate for the target audience
- **Educational Value**: Explanations provide learning opportunities

## ITERATION PROCESS
Think through each question systematically:
1. **Analyze the content**: What are the key concepts and learning objectives?
2. **Design the question**: What specific knowledge or skill am I testing?
3. **Create distractors**: What common misconceptions can I address?
4. **Write explanation**: How can I use this to teach the concept?
5. **Review and refine**: Does this question meet all evaluation criteria?

## CHAIN OF THOUGHT REASONING
Before generating each question, think through:
- What is the core concept being tested?
- What cognitive level am I targeting?
- What misconceptions do students commonly have?
- How can I make the explanation educational?
- Does this question contribute to deeper understanding?

## OUTPUT FORMAT
Return ONLY valid JSON array with this exact structure:
[
  {
    "question": "Clear, focused question stem",
    "options": {
      "a": "Plausible distractor that teaches",
      "b": "Correct answer",
      "c": "Plausible distractor that addresses misconception",
      "d": "Plausible distractor that reinforces concept"
    },
    "correct": "a/b/c/d",
    "explanation": "Educational explanation that teaches the concept, addresses misconceptions, and connects to broader learning objectives"
  }
]

IMPORTANT: Return ONLY the JSON array. No additional text, explanations, or commentary."""

        prompt_text = """Generate 1 high-quality quiz question for the lecture content: basic math operations

## CHAIN OF THOUGHT ANALYSIS
Before creating each question, think through:

1. **Content Analysis**: What are the key concepts, principles, and learning objectives in this topic?
2. **Cognitive Mapping**: How do these concepts relate to each other and build upon prior knowledge?
3. **Misconception Identification**: What common misunderstandings do students typically have about this topic?
4. **Assessment Strategy**: What different cognitive levels should I target (recall, comprehension, application, analysis)?
5. **Educational Value**: How can each question and explanation contribute to deeper understanding?

## QUESTION DESIGN PROCESS
For each question, ensure:
- Clear, focused question stem that tests one specific concept
- All distractors are plausible and address common misconceptions
- Correct answer is unambiguous and well-justified
- Explanation teaches the concept and connects to broader learning objectives
- Question difficulty is appropriate for the target audience"""
        full_prompt = f"{system_prompt}\n\n{prompt_text}"
        
        generation_config = genai.types.GenerationConfig(
            temperature=0.5,
            top_p=0.95,
            max_output_tokens=8192,
        )
        
        response = model.generate_content(
            full_prompt,
            generation_config=generation_config
        )
        
        print("✓ Test generation successful")
        print(f"Raw response: {response.text}")
        
        # Try to parse JSON
        try:
            parsed = json.loads(response.text)
            print("✓ JSON parsing successful")
            print(f"Parsed result: {json.dumps(parsed, indent=2)}")
            return True
        except json.JSONDecodeError as e:
            print(f"✗ JSON parsing failed: {str(e)}")
            # Try to extract JSON
            import re
            json_match = re.search(r'\[.*\]', response.text, re.DOTALL)
            if json_match:
                extracted_json = json_match.group(0)
                try:
                    parsed = json.loads(extracted_json)
                    print("✓ JSON extraction successful")
                    print(f"Extracted result: {json.dumps(parsed, indent=2)}")
                    return True
                except json.JSONDecodeError:
                    print("✗ JSON extraction also failed")
                    return False
            return False
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing JSON generation...")
    success = test_json_generation()
    if success:
        print("\n✓ JSON generation test passed!")
    else:
        print("\n✗ JSON generation test failed.") 