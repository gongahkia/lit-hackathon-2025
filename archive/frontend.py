import streamlit as st
import requests
import subprocess
import os
import sys

def format_option(opt):
    letter, text = opt
    return f"{letter}: {text}"

# Function to check backend health
def check_backend_health():
    try:
        response = requests.get("http://127.0.0.1:5011/", timeout=5)
        return response.status_code == 200
    except:
        return False

# Function to make the POST request to the backend using form-data
def get_quiz_data(prompt, num_quizzes, questions_str=None, file=None):
    url = "http://127.0.0.1:5011/generate-quiz"
    
    # Data to be sent in the form body
    data = {
        "prompt": prompt,
        "num_quizzes": num_quizzes  
    }
    
    # Include the questions string if provided
    if questions_str is not None:
        data["questions"] = questions_str
    
    # Prepare the files dictionary if a file is uploaded
    files = {}
    if file is not None:
        files['file'] = (file.name, file, file.type)
    
    try:
        with st.spinner("Generating quiz questions..."):
            response = requests.post(url, data=data, files=files, timeout=60)
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Backend error: {response.status_code} - {response.text}")
            return None
    except requests.exceptions.ConnectionError:
        st.error("❌ Cannot connect to backend. Please make sure the backend server is running on port 5011.")
        st.info("💡 To start the backend, run: `python backend.py`")
        return None
    except requests.exceptions.Timeout:
        st.error("⏰ Request timed out. The backend is taking too long to respond.")
        return None
    except Exception as e:
        st.error(f"❌ Error connecting to backend: {str(e)}")
        return None


def upload_student_questions(text_file):
    if text_file is not None:
        content = text_file.read().decode("utf-8")
        questions = content.splitlines()
        return questions
    return None

def generate_comprehensive_report():
    """Generate comprehensive report using generate_report.py"""
    try:
        # Debug: Print absolute path for quiz_response.json

        # Use project root for file paths
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        quiz_json_path = os.path.join(project_root, "quiz_response.json")
        feedback_csv_path = os.path.join(project_root, "dbtt_class_feedback.csv")
        print(f"[DEBUG] Checking for quiz_response.json at: {quiz_json_path}")

        # Retry logic for file existence (handle file system delays)
        import time
        max_attempts = 5
        for attempt in range(max_attempts):
            if os.path.exists(quiz_json_path) and os.path.getsize(quiz_json_path) > 0:
                break
            time.sleep(0.3)
        else:
            st.error(f"❌ No quiz response found at {quiz_json_path}. Please generate a quiz first.")
            return False

        # Check if feedback CSV exists
        if not os.path.exists(feedback_csv_path):
            st.error(f"❌ No feedback CSV found at {feedback_csv_path}. Please ensure dbtt_class_feedback.csv is available.")
            return False

        with st.spinner("📊 Generating comprehensive report..."):
            python_path = sys.executable
            result = subprocess.run(
                [python_path, os.path.join(project_root, "generate_report.py")],
                capture_output=True,
                text=True,
                timeout=120,
                cwd=project_root  # Set working directory to project root
            )

        # Always show debug output from report generation, even on failure
        st.markdown("---")
        st.subheader("🛠️ Report Generation Debug Output")
        if result.stdout:
            st.text_area("Report Generation Output", result.stdout, height=300)
        if result.stderr:
            st.text_area("Report Generation Errors", result.stderr, height=200)

        if result.returncode == 0:
            st.success("✅ Comprehensive report generated successfully!")
            st.info("📄 Report saved as: comprehensive_class_report.pdf")
            return True
        else:
            st.error(f"❌ Report generation failed. See debug output above.")
            return False

    except subprocess.TimeoutExpired:
        st.error("⏰ Report generation timed out. Please try again.")
        return False
    except Exception as e:
        st.error(f"❌ Error generating report: {str(e)}")
        return False

# Initialize session state variables if they don't exist.
if "page" not in st.session_state:
    st.session_state["page"] = "generator"
if "quiz_data" not in st.session_state:
    st.session_state["quiz_data"] = []
if "user_answers" not in st.session_state:
    st.session_state["user_answers"] = {}

# final results view
if st.session_state["page"] == "final":
    st.title("Quiz Results")
    if not st.session_state.quiz_data:
        st.error("No quiz data available. Please generate a quiz first.")
    else:
        quiz_data = st.session_state.quiz_data
        score = 0
        i = 0
        for quiz in quiz_data:
            st.subheader(f"Question {i+1}")
            st.write(f"**Question:** {quiz['question']}")
            options = quiz.get("options", {})
            for key, value in options.items():
                st.write(f"{key}: {value}")
            correct = quiz["correct"]
            user_answer = st.session_state.user_answers.get(i, None)
            if user_answer == correct:
                st.success(f"Your answer: {user_answer} (Correct)")
                score += 1
            else:
                st.error(f"Your answer: {user_answer} (Incorrect) — Correct answer: {correct}")
            st.write(f"Explanation: {quiz['explanation']}")
            st.markdown("---")
            i += 1
        st.write(f"**Your Score: {score} out of {len(quiz_data)}**")
    
    # Automatically save student response JSON to backend after quiz is done
    import requests
    import json
    if "student_response_saved" not in st.session_state:
        answers = {str(i+1): ans for i, ans in st.session_state["user_answers"].items()}
        payload = {
            "prompt": quiz_data[0].get("prompt", ""),
            "num_quizzes": len(quiz_data),
            "student_answers": json.dumps(answers),
            "student_id": os.environ.get("USER", "student")
        }
        try:
            resp = requests.post("http://127.0.0.1:5011/generate-quiz", data=payload, timeout=30)
            if resp.status_code == 200:
                st.session_state["student_response_saved"] = True
                st.success("✅ Your quiz response has been saved for analysis.")
            else:
                st.session_state["student_response_saved"] = False
                st.error(f"❌ Failed to save response: {resp.status_code} {resp.text}")
        except Exception as e:
            st.session_state["student_response_saved"] = False
            st.error(f"❌ Error saving response: {e}")

    st.markdown("---")
    st.subheader("📊 Generate Comprehensive Report")
    st.write("Create a detailed report analyzing the quiz content and class feedback.")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("Generate Report", type="primary"):
            generate_comprehensive_report()
    with col2:
        if st.button("Restart"):
            st.session_state["page"] = "generator"
            st.session_state["quiz_data"] = []
            st.session_state["user_answers"] = {}
            st.rerun()


# interactive quiz view
elif st.session_state["page"] == "quiz":
    st.title("Take the Quiz")
    if not st.session_state.get("quiz_data"):
        st.error("No quiz data available. Please generate a quiz first.")
    else:
        quiz_data = st.session_state.quiz_data
        i = 0
        for quiz in quiz_data:
            st.subheader(f"Question {i+1}")
            st.write(quiz["question"])
            options = quiz.get("options", {})
            # Use a tuple (letter, text) so that we can display full text while keeping the answer letter.
            selected_option = st.radio(
                f"Select your answer for question {i+1}:",
                options=list(options.items()),
                format_func=format_option,
                key=f"q{i}"
            )
            st.session_state.user_answers[i] = selected_option[0]
            i += 1

        if st.button("Submit Answers"):
            st.session_state["page"] = "final"
            st.rerun()
else:
    # Quiz generation view
    st.title("Quiz Generator")
    
    # Backend status indicator
    backend_status = check_backend_health()
    if backend_status:
        st.success("✅ Backend is running and ready")
    else:
        st.error("❌ Backend is not running")
        st.info("💡 Please start the backend server first: `python backend.py`")
        st.stop()
    
    prompt = st.text_input("Enter the quiz prompt", "quiz me about digital transformation")
    num_quizzes = st.number_input("Number of questions", min_value=1, max_value=10, value=3, step=1)
    
    # File uploader for student questions
    questions = st.file_uploader("Upload student questions")

    # File uploader for an optional file upload
    file = st.file_uploader("Upload a file (optional)")
    
    if st.button("Generate Quiz", type="primary"):
        if prompt and num_quizzes:
            questions = upload_student_questions(questions)
            quiz_data = get_quiz_data(prompt, num_quizzes, questions, file)
            if quiz_data:
                st.success(f"✅ Successfully generated {len(quiz_data)} quiz questions!")
                st.session_state.quiz_data = quiz_data
                st.session_state["page"] = "quiz"
                st.rerun()
            else:
                st.error("❌ Error generating quizzes. Please check the backend logs for details.")
        else:
            st.error("❌ Please provide both a prompt and a number of quizzes.")