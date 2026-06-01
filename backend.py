from flask import Flask, jsonify, request, send_file
import json
import os
import re
from datetime import datetime
from flask_cors import CORS
import google.generativeai as genai
from werkzeug.utils import secure_filename
import generate_report

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx', 'doc', 'pptx', 'ppt', 'xls', 'xlsx', 'csv', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'ico', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate(prompt, num_quizzes, questions=None, pdf_path=None):
    try:
        # Load API key from configuration file
        with open('classroom-ai.json', 'r') as f:
            config = json.load(f)
        
        # Configure Gemini API
        genai.configure(api_key=config['gemini_api_key'])
        
        # Initialize Gemini Pro Model
        model = genai.GenerativeModel('gemini-2.5-pro')
        
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
"""

        # Prepare content parts with chain of thought reasoning
        prompt_text = f"""Generate {num_quizzes} high-quality quiz questions for the lecture content: {prompt}

## QUESTION DESIGN PROCESS
For each question, ensure:
- Clear, focused question stem that tests one specific concept
- All distractors are plausible and address common misconceptions
- Correct answer is unambiguous and well-justified
- Explanation teaches the concept and connects to broader learning objectives
- Question difficulty is appropriate for the target audience

## OUTPUT FORMAT
Return ONLY valid JSON array with this exact structure:
[
  {{
    "question": "Clear, focused question stem",
    "options": {{
      "a": "Plausible distractor that teaches",
      "b": "Correct answer",
      "c": "Plausible distractor that addresses misconception",
      "d": "Plausible distractor that reinforces concept"
    }},
    "correct": "a/b/c/d",
    "explanation": "Educational explanation that teaches the concept, addresses misconceptions, and connects to broader learning objectives"
  }}
]

IMPORTANT: Return ONLY the JSON array. No additional text, explanations, or commentary.

## CONTENT INTEGRATION
If student questions were provided, incorporate those concepts and address any knowledge gaps they reveal.
"""
        
        if questions:
            prompt_text += f"\n\n## STUDENT QUESTIONS TO ADDRESS\n{questions}\n\nEnsure your questions cover these concepts and address any misconceptions revealed in the student questions."
        
        # Create the full prompt with system instruction
        full_prompt = f"{system_prompt}\n\n{prompt_text}"
        
        # Add PDF content if provided
        generation_config = genai.types.GenerationConfig(
            temperature=0.5,
            top_p=0.95,
            max_output_tokens=8192,
        )
        
        # Generate content
        if pdf_path and os.path.exists(pdf_path):
            with open(pdf_path, 'rb') as pdf_file:
                pdf_content = pdf_file.read()
                response = model.generate_content(
                    [full_prompt, {"mime_type": "application/pdf", "data": pdf_content}],
                    generation_config=generation_config
                )
        else:
            response = model.generate_content(
                full_prompt,
                generation_config=generation_config
            )

        response_text = response.text
        
        # Try to extract JSON if the response contains extra text
        import re
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(0)
        
        return response_text

    except Exception as e:
        raise Exception(f"Error in generate function: {str(e)}")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({'status': 'Backend is running', 'message': 'Server is healthy'})

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    try:
        # Handle text data
        data = request.form
        if not data or 'prompt' not in data or 'num_quizzes' not in data:
            return jsonify({'error': 'Missing prompt or num_quizzes in request'}), 400

        prompt = data['prompt']
        num_quizzes = int(data['num_quizzes'])
        
        # Read questions if provided (treating it as a simple string)
        questions = None
        if 'questions' in data:
            questions = data['questions']

        # Handle PDF file if uploaded
        pdf_path = None
        if 'file' in request.files:
            file = request.files['file']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(pdf_path)
            else:
                return jsonify({'error': 'Invalid file type.'}), 400
        
        print(f"PDF path: {pdf_path}")
        print(f"Prompt: {prompt}")
        print(f"Number of quizzes: {num_quizzes}")
        
        try:
            result = generate(prompt, num_quizzes, questions, pdf_path)
            # Clean up uploaded file if it exists
            if pdf_path and os.path.exists(pdf_path):
                os.remove(pdf_path)
            
            # Debug: Print the raw response
            print(f"Raw AI response: {result}")
            
            # Try to parse JSON
            try:
                parsed_result = json.loads(result)
                # Save quiz response to JSON file for report generation
                quiz_data = {
                    "prompt": prompt,
                    "num_quizzes": num_quizzes,
                    "questions": questions,
                    "quiz_questions": parsed_result,
                    "timestamp": datetime.now().isoformat()
                }
                with open("quiz_response.json", "w", encoding="utf-8") as f:
                    json.dump(quiz_data, f, indent=2, ensure_ascii=False)
                    f.flush()
                    os.fsync(f.fileno())
                print(f"✅ Quiz response saved to quiz_response.json (flushed)")

                # --- NEW: Save student quiz result (correct/wrong) ---
                # Expecting student answers in the request (as JSON string or dict)
                student_answers = None
                if 'student_answers' in data:
                    try:
                        student_answers = data['student_answers']
                        if isinstance(student_answers, str):
                            student_answers = json.loads(student_answers)
                    except Exception as e:
                        print(f"Could not parse student_answers: {e}")

                if student_answers:
                    # Compare student answers to correct answers
                    student_result = {
                        "student_id": data.get('student_id', f"student_{datetime.now().strftime('%Y%m%d%H%M%S')}")
                    }
                    results = []
                    for idx, q in enumerate(parsed_result):
                        qid = str(idx+1)
                        correct = q.get('correct')
                        student_answer = student_answers.get(qid) if isinstance(student_answers, dict) else None
                        results.append({
                            "question": q.get('question'),
                            "student_answer": student_answer,
                            "correct_answer": correct,
                            "is_correct": student_answer == correct
                        })
                    student_result['results'] = results
                    # Save to a uniquely named file
                    student_id = student_result['student_id']
                    student_file = f"student_response_{student_id}.json"
                    with open(student_file, "w", encoding="utf-8") as sf:
                        json.dump(student_result, sf, indent=2, ensure_ascii=False)
                        sf.flush()
                        os.fsync(sf.fileno())
                    print(f"✅ Student quiz result saved to {student_file}")

                return jsonify({
                    "quiz_questions": parsed_result,
                    "raw_response": result
                })

            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {str(e)}")
                print(f"Response content: {result}")
                return jsonify({'error': f'Invalid JSON response from AI. Raw response: {result[:200]}...'}), 500
        except Exception as e:
            return jsonify({'error': f'Error in generate function: {str(e)}'}), 500
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/generate-report', methods=['POST'])
def generate_report_endpoint():
    try:
        generate_report.generate_report()
        return jsonify({'success': True, 'message': 'Report generated successfully'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/download/report', methods=['GET', 'HEAD'])
def download_report():
    report_path = os.path.abspath('comprehensive_class_report.pdf')
    if not os.path.exists(report_path):
        return jsonify({'error': 'Report not found'}), 404
    return send_file(report_path, as_attachment=True, mimetype='application/pdf')

if __name__ == '__main__':
    app.run(port=5011)