import json
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from wordcloud import WordCloud
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import string
import os
import re
from datetime import datetime
from collections import Counter, defaultdict
import google.generativeai as genai
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO
import base64

# --- SETTINGS ---
quiz_file_path = "quiz_response.json"
feedback_file_path = "dbtt_class_feedback.csv"
output_filename = "comprehensive_class_report.pdf"

# Configure Gemini API (you'll need to set your API key)

# --- Configure Gemini API globally ---
try:
    with open('classroom-ai.json', 'r') as f:
        config = json.load(f)
    genai.configure(api_key=config['gemini_api_key'])
except Exception as e:
    print(f"ERROR: Failed to configure Gemini API – {e}")
    # Optionally: exit early or raise


stop_words = set("""
a about above after again against all am an and any are aren't as at be because been before being below between
both but by can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from
further had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his
how how's i i'd i'll i'm i've if in into is isn't it it's its itself let's me more most mustn't my myself no nor
not of off on once only or other ought our ours ourselves out over own same shan't she she'd she'll she's should
shouldn't so some such than that that's the their theirs them themselves then there there's these they they'd
they'll they're they've this those through to too under until up very was wasn't we we'd we'll we're we've were
weren't what what's when when's where where's which while who who's whom why why's with won't would wouldn't you
you'd you'll you're you've your yours yourself yourselves
""".split())

def sanitize_filename(filename):
    """Convert a string into a safe filename by removing special characters."""
    safe_name = re.sub(r'[^a-zA-Z0-9]', '_', filename)
    safe_name = re.sub(r'_+', '_', safe_name)
    safe_name = safe_name.strip('_')
    return safe_name

def preprocess_text(text):
    """Preprocess text for word frequency analysis."""
    if pd.isna(text) or not text:
        return ""
    text = str(text).lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    return ' '.join([word for word in text.split() if word not in stop_words and len(word) > 2])

def analyze_quiz_with_ai(quiz_data):
    """Use Gemini to analyze quiz content and provide educational insights."""
    try:
        model = genai.GenerativeModel('gemini-2.5-pro')
        # Prepare student responses and questions for analysis
        questions = []
        responses = []
        for i, quiz in enumerate(quiz_data['quiz_questions'], 1):
            questions.append({
                "number": i,
                "question": quiz['question'],
                "options": quiz.get('options', {}),
                "correct": quiz.get('correct', ''),
                "explanation": quiz['explanation']
            })
            # If student responses are present in the JSON, collect them
            if 'responses' in quiz:
                responses.append({
                    "number": i,
                    "student_responses": quiz['responses']
                })

        analysis_prompt = f"""
        As an educational data analyst, analyze the following student responses and quiz questions. Focus on:
        - Patterns in student answers (common errors, misconceptions, strengths)
        - The effectiveness and clarity of each question
        - How student responses align with the intended learning objectives
        - Actionable recommendations for improving both questions and student understanding

        Questions:
        {json.dumps(questions, indent=2)}

        Student Responses:
        {json.dumps(responses, indent=2) if responses else 'No student responses available.'}

        Please structure your analysis with clear sections:
        1. Student Response Patterns
        2. Question Effectiveness
        3. Alignment with Learning Objectives
        4. Recommendations for Educators
        Format your response for direct inclusion in a report (no asterisks or markdown, use clear paragraphs and bullet points if needed).
        """
        response = model.generate_content(analysis_prompt)
        # Clean up asterisks and markdown from the AI output
        text = response.text
        # Remove leading asterisks and extra whitespace from lines
        lines = [line.lstrip('*').strip() for line in text.splitlines()]
        # Remove empty lines and join with double newlines for paragraph breaks
        cleaned = '\n\n'.join([line for line in lines if line])
        return cleaned
    except Exception as e:
        print(f"WARNING: Could not generate AI analysis: {e}")
        return "AI analysis unavailable. Please check your Gemini API configuration."

def analyze_feedback_with_ai(feedback_data, numeric_stats):
    """Use Gemini to analyze student feedback."""
    try:
        model = genai.GenerativeModel('gemini-2.5-pro')
        
        # Prepare feedback summary
        import numpy as np
        def make_json_serializable(obj):
            if isinstance(obj, dict):
                return {k: make_json_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [make_json_serializable(v) for v in obj]
            elif isinstance(obj, (np.integer, np.floating)):
                return obj.item()
            else:
                return obj

        feedback_summary = {}
        if feedback_data:
            for col, word_freq in feedback_data.items():
                top_words = list(word_freq.items())[:10] if hasattr(word_freq, 'items') else word_freq
                feedback_summary[col] = make_json_serializable(top_words)

        # Convert numeric_stats to serializable form if needed
        numeric_stats_json = None
        if numeric_stats is not None:
            try:
                numeric_stats_json = json.dumps(make_json_serializable(numeric_stats.to_dict()), indent=2)
            except Exception as e:
                print(f"WARNING: Could not serialize numeric_stats: {e}")
                numeric_stats_json = numeric_stats.to_string()
        else:
            numeric_stats_json = "No numeric data available"

        analysis_prompt = f"""
        As an educational expert, analyze this student feedback data and provide insights for course improvement:

        QUALITATIVE FEEDBACK THEMES:
        {json.dumps(feedback_summary, indent=2)}

        QUANTITATIVE RATINGS:
        {numeric_stats_json}

        Please provide analysis covering:

        1. STUDENT SATISFACTION ANALYSIS:
           - Overall satisfaction levels and trends
           - Areas of strength based on feedback
           - Areas needing improvement

        2. LEARNING EFFECTIVENESS:
           - Evidence of student learning and engagement
           - Concepts students found most/least clear
           - Suggestions for pedagogical improvements

        3. COURSE DESIGN INSIGHTS:
           - What's working well in the course structure?
           - What aspects need redesign or enhancement?
           - Balance between theory and practice

        4. ACTIONABLE RECOMMENDATIONS:
           - Specific changes to improve student experience
           - Teaching methods that would address concerns
           - Ways to build on successful elements

        5. FUTURE PLANNING:
           - Topics that need more time or different approach
           - Student preparation recommendations
           - Assessment and activity modifications

        Provide specific, actionable insights that an educator can implement.
        """
        response = model.generate_content(analysis_prompt)
        return response.text
        
    except Exception as e:
        print(f"WARNING: Could not generate feedback AI analysis: {e}")
        return "Feedback AI analysis unavailable. Please check your Gemini API configuration."

def create_visualization_charts(quiz_data, feedback_data=None):
    """Create educational visualization charts."""
    chart_paths = []
    
    try:
        # Set style for better-looking charts
        plt.style.use('seaborn-v0_8')
        
        # 1. Question Type Distribution
        question_types = defaultdict(int)
        for quiz in quiz_data['quiz_questions']:
            question_text = quiz['question'].lower()
            if 'what' in question_text:
                question_types['What'] += 1
            elif 'how' in question_text:
                question_types['How'] += 1
            elif 'why' in question_text:
                question_types['Why'] += 1
            elif 'which' in question_text:
                question_types['Which'] += 1
            elif 'when' in question_text:
                question_types['When'] += 1
            else:
                question_types['Other'] += 1
        
        if question_types:
            fig, ax = plt.subplots(figsize=(8, 6))
            types = list(question_types.keys())
            counts = list(question_types.values())
            colors_palette = plt.cm.Set3(range(len(types)))
            
            bars = ax.bar(types, counts, color=colors_palette)
            ax.set_title('Distribution of Question Types', fontsize=14, fontweight='bold')
            ax.set_ylabel('Number of Questions')
            ax.set_xlabel('Question Type')
            
            # Add value labels on bars
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{int(height)}', ha='center', va='bottom')
            
            plt.tight_layout()
            chart_path = 'question_types_chart.png'
            plt.savefig(chart_path, dpi=300, bbox_inches='tight')
            chart_paths.append(chart_path)
            plt.close()
        
        # 2. Question Complexity Analysis (based on explanation length and option complexity)
        if len(quiz_data['quiz_questions']) > 1:
            fig, ax = plt.subplots(figsize=(10, 6))
            
            question_nums = []
            complexity_scores = []
            
            for i, quiz in enumerate(quiz_data['quiz_questions'], 1):
                # Simple complexity metric based on explanation length and number of concepts
                explanation_words = len(quiz['explanation'].split())
                option_complexity = sum(len(opt.split()) for opt in quiz.get('options', {}).values())
                complexity = (explanation_words + option_complexity) / 10  # Normalize
                
                question_nums.append(f'Q{i}')
                complexity_scores.append(complexity)
            
            bars = ax.bar(question_nums, complexity_scores, color='lightblue', edgecolor='navy', alpha=0.7)
            ax.set_title('Question Complexity Analysis', fontsize=14, fontweight='bold')
            ax.set_ylabel('Complexity Score')
            ax.set_xlabel('Questions')
            ax.grid(axis='y', alpha=0.3)
            
            # Add value labels
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{height:.1f}', ha='center', va='bottom')
            
            plt.tight_layout()
            chart_path = 'question_complexity_chart.png'
            plt.savefig(chart_path, dpi=300, bbox_inches='tight')
            chart_paths.append(chart_path)
            plt.close()
    
    except Exception as e:
        print(f"WARNING: Could not generate charts: {e}")
    
    return chart_paths

def analyze_quiz_content(quiz_data):
    """Enhanced quiz content analysis."""
    analysis = {
        'total_questions': len(quiz_data['quiz_questions']),
        'question_types': defaultdict(int),
        'difficulty_indicators': [],
        'topic_coverage': [],
        'word_frequencies': {},
        'option_analysis': defaultdict(int),
        'cognitive_levels': defaultdict(int)
    }
    
    # Combine all text for word frequency analysis
    all_questions = []
    all_explanations = []
    all_options = []
    
    for quiz in quiz_data['quiz_questions']:
        # Collect text
        all_questions.append(quiz['question'])
        all_explanations.append(quiz['explanation'])
        
        # Analyze options
        options = quiz.get('options', {})
        analysis['option_analysis']['total_options'] += len(options)
        for key, option_text in options.items():
            all_options.append(option_text)
        
        # Question type analysis
        question_text = quiz['question'].lower()
        if 'what' in question_text:
            analysis['question_types']['What'] += 1
        elif 'how' in question_text:
            analysis['question_types']['How'] += 1
        elif 'why' in question_text:
            analysis['question_types']['Why'] += 1
        elif 'which' in question_text:
            analysis['question_types']['Which'] += 1
        elif 'when' in question_text:
            analysis['question_types']['When'] += 1
        else:
            analysis['question_types']['Other'] += 1
        
        # Simple cognitive level analysis based on question stems
        if any(word in question_text for word in ['analyze', 'compare', 'evaluate', 'assess']):
            analysis['cognitive_levels']['Analysis/Evaluation'] += 1
        elif any(word in question_text for word in ['apply', 'implement', 'use', 'demonstrate']):
            analysis['cognitive_levels']['Application'] += 1
        elif any(word in question_text for word in ['define', 'identify', 'list', 'recall']):
            analysis['cognitive_levels']['Knowledge/Comprehension'] += 1
        else:
            analysis['cognitive_levels']['Mixed/Other'] += 1
    
    # Generate word frequencies for different text types
    text_categories = {
        'Questions': ' '.join(all_questions),
        'Explanations': ' '.join(all_explanations),
        'Answer Options': ' '.join(all_options)
    }
    
    for category, text in text_categories.items():
        if text.strip():
            processed_text = preprocess_text(text)
            if processed_text:
                vectorizer = CountVectorizer()
                try:
                    matrix = vectorizer.fit_transform([processed_text])
                    word_freq = dict(zip(vectorizer.get_feature_names_out(), matrix.toarray()[0]))
                    analysis['word_frequencies'][category] = dict(
                        sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:30]
                    )
                except:
                    analysis['word_frequencies'][category] = {}
    
    return analysis

def load_feedback_data():
    """Load and analyze feedback CSV if available, and student JSON files if provided."""
    import glob
    import pandas as pd  # Ensure pandas is available for all uses in this function
    feedback_analysis = {}
    numeric_summary = None
    open_ended_cols = []
    numeric_cols = []
    # Load CSV feedback as before
    try:
        df = pd.read_csv(feedback_file_path, encoding="ISO-8859-1")
        if len(df.columns) >= 5:
            open_ended_cols = df.columns[:5]
            numeric_cols = df.columns[5:]
            df_cleaned = df.copy()
            for col in open_ended_cols:
                df_cleaned[col] = df_cleaned[col].apply(preprocess_text)
            for col in open_ended_cols:
                text = ' '.join(df_cleaned[col].dropna())
                if text.strip():
                    vectorizer = CountVectorizer()
                    try:
                        matrix = vectorizer.fit_transform([text])
                        word_freq = dict(zip(vectorizer.get_feature_names_out(), matrix.toarray()[0]))
                        feedback_analysis[col] = dict(
                            sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:20]
                        )
                    except:
                        feedback_analysis[col] = {}
            numeric_summary = df[numeric_cols].describe().round(2) if len(numeric_cols) > 0 else None
    except FileNotFoundError:
        print("INFO: No feedback CSV found. Generating quiz-only report.")
    except Exception as e:
        print(f"WARNING: Error loading feedback data: {e}")

    # --- NEW: Load student JSON files ---
    student_files = glob.glob("student_response_*.json")
    print(f"DEBUG: Found student response files: {student_files}")
    student_results = []
    for sf in student_files:
        try:
            with open(sf, "r", encoding="utf-8") as f:
                student_data = json.load(f)
                print(f"DEBUG: Loaded student data from {sf}: {student_data}")
                student_results.append(student_data)
        except Exception as e:
            print(f"WARNING: Could not load {sf}: {e}")

    # Aggregate student results for analysis
    if student_results:
        print(f"DEBUG: Aggregating {len(student_results)} student results...")
        # For each question, count correct/wrong
        question_stats = {}
        for student in student_results:
            for idx, res in enumerate(student.get('results', [])):
                qtext = res.get('question', f"Q{idx+1}")
                if qtext not in question_stats:
                    question_stats[qtext] = {'correct': 0, 'wrong': 0}
                if res.get('is_correct'):
                    question_stats[qtext]['correct'] += 1
                else:
                    question_stats[qtext]['wrong'] += 1
        print(f"DEBUG: Aggregated question stats: {question_stats}")
        # Add to feedback_analysis for reporting
        feedback_analysis['Student Quiz Performance'] = question_stats
        # Also create a numeric summary (as DataFrame)
        perf_df = pd.DataFrame.from_dict(question_stats, orient='index')
        print(f"DEBUG: Student performance DataFrame:\n{perf_df}")
        if not perf_df.empty:
            numeric_summary = perf_df.describe().round(2)
            print(f"DEBUG: Student performance summary:\n{numeric_summary}")

    return feedback_analysis, numeric_summary, open_ended_cols, numeric_cols

def create_enhanced_quiz_table(analysis):
    """Create an enhanced quiz analysis table."""
    table_data = [['Metric', 'Value', 'Educational Insight']]
    
    table_data.append(['Total Questions', str(analysis['total_questions']), 
                      'Good for 15-20 min assessment' if analysis['total_questions'] <= 5 else 'Extended assessment'])
    
    table_data.append(['Total Answer Options', str(analysis['option_analysis']['total_options']), 
                      'Standard 4-option multiple choice' if analysis['option_analysis']['total_options'] == analysis['total_questions'] * 4 else 'Varied option count'])
    
    # Question types with insights
    for q_type, count in analysis['question_types'].items():
        insight = {
            'What': 'Tests factual knowledge',
            'How': 'Tests procedural understanding',
            'Why': 'Tests conceptual reasoning',
            'Which': 'Tests discrimination/selection',
            'When': 'Tests temporal knowledge'
        }.get(q_type, 'Mixed cognitive demands')
        
        table_data.append([f'{q_type} Questions', str(count), insight])
    
    # Cognitive levels
    for level, count in analysis['cognitive_levels'].items():
        table_data.append([f'{level}', str(count), 'Bloom\'s taxonomy level'])
    
    return table_data

def generate_report():
    """Generate the comprehensive educational PDF report."""
    
    # Load quiz data
    try:
        with open(quiz_file_path, 'r', encoding='utf-8') as f:
            quiz_data = json.load(f)
    except FileNotFoundError:
        print(f"ERROR: Quiz response file not found: {quiz_file_path}")
        return
    except json.JSONDecodeError as e:
        print(f"ERROR: Error parsing quiz JSON: {e}")
        return
    
    # Analyze quiz content
    quiz_analysis = analyze_quiz_content(quiz_data)
    
    # Generate AI analysis
    print("Generating AI-powered educational insights...")
    ai_quiz_analysis = analyze_quiz_with_ai(quiz_data)
    
    # Load feedback data (optional)
    feedback_analysis, numeric_summary, open_ended_cols, numeric_cols = load_feedback_data()
    
    # Generate AI feedback analysis if feedback exists
    ai_feedback_analysis = ""
    if feedback_analysis and numeric_summary is not None:
        print("Analyzing student feedback with AI...")
        ai_feedback_analysis = analyze_feedback_with_ai(feedback_analysis, numeric_summary)
    
    # Create visualization charts
    print("Creating educational visualizations...")
    chart_paths = create_visualization_charts(quiz_data, feedback_analysis)
    
    # Create PDF document
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Enhanced styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=22,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=15,
        spaceBefore=20,
        keepWithNext=True,
        textColor=colors.darkblue,
        borderWidth=1,
        borderColor=colors.lightgrey,
        borderPadding=5
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubHeading',
        parent=styles['Heading3'],
        fontSize=14,
        spaceAfter=10,
        spaceBefore=15,
        keepWithNext=True,
        textColor=colors.darkgreen
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        alignment=TA_JUSTIFY,
        spaceBefore=6,
        spaceAfter=6
    )
    
    # Create story (content)
    story = []
    
    # Enhanced Title Page
    story.append(Paragraph("Educational Assessment Analysis Report", title_style))
    story.append(Spacer(1, 20))
    
    # Executive Summary Box
    summary_style = ParagraphStyle(
        'Summary',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        leftIndent=20,
        rightIndent=20,
        spaceBefore=10,
        spaceAfter=10,
        borderWidth=1,
        borderColor=colors.grey,
        borderPadding=10,
        backColor=colors.lightblue
    )
    
    exec_summary = f"""
    <b>EXECUTIVE SUMMARY</b><br/>
    Assessment Topic: {quiz_data.get('prompt', 'N/A')}<br/>
    Number of Questions: {quiz_data.get('num_quizzes', 'N/A')}<br/>
    Generated: {quiz_data.get('timestamp', 'N/A')[:19].replace('T', ' ') if quiz_data.get('timestamp') else 'N/A'}<br/>
    Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}<br/>
    <br/>
    This report provides comprehensive analysis of quiz content, educational effectiveness, 
    and actionable recommendations for educators.
    """
    
    story.append(Paragraph(exec_summary, summary_style))
    story.append(PageBreak())
    
    # Table of Contents
    story.append(Paragraph("Table of Contents", heading_style))
    toc_items = [
        "1. Quiz Content Analysis",
        "2. Educational Quality Assessment",
        "3. AI-Powered Pedagogical Insights", 
        "4. Visual Analytics",
        "5. Individual Question Analysis",
        "6. Student Feedback Analysis (if available)",
        "7. Recommendations for Improvement"
    ]
    
    for item in toc_items:
        story.append(Paragraph(item, normal_style))
    
    story.append(PageBreak())
    
    # 1. Quiz Content Analysis
    story.append(Paragraph("1. Quiz Content Analysis", heading_style))
    
    # Enhanced analysis table
    enhanced_table_data = create_enhanced_quiz_table(quiz_analysis)
    enhanced_table = Table(enhanced_table_data, colWidths=[150, 80, 250])
    enhanced_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    story.append(enhanced_table)
    story.append(Spacer(1, 20))
    
    # 2. Educational Quality Assessment
    story.append(PageBreak())
    story.append(Paragraph("2. Educational Quality Assessment", heading_style))
    
    # Key metrics summary
    quality_metrics = f"""
    <b>Content Coverage:</b> {len(quiz_analysis['word_frequencies'].get('Questions', {}))} unique concepts identified in questions<br/>
    <b>Explanation Depth:</b> {len(quiz_analysis['word_frequencies'].get('Explanations', {}))} pedagogical terms in explanations<br/>
    <b>Cognitive Diversity:</b> {len(quiz_analysis['cognitive_levels'])} different cognitive levels represented<br/>
    <b>Assessment Balance:</b> Questions distributed across {len(quiz_analysis['question_types'])} different question types
    """
    
    story.append(Paragraph(quality_metrics, normal_style))
    story.append(Spacer(1, 15))
    
    # 3. AI-Powered Insights
    story.append(Paragraph("3. AI-Powered Pedagogical Insights", heading_style))
    # Improved formatting: split into paragraphs and bullet points
    ai_paragraphs = [p.strip() for p in ai_quiz_analysis.split('\n\n') if p.strip()]
    for paragraph in ai_paragraphs:
        # If the paragraph looks like a bullet list, format as bullet points
        if paragraph.startswith('- '):
            bullets = [item.strip('- ').strip() for item in paragraph.split('\n') if item.strip()]
            for bullet in bullets:
                story.append(Paragraph(f'• {bullet}', normal_style))
                story.append(Spacer(1, 4))
        else:
            story.append(Paragraph(paragraph, normal_style))
            story.append(Spacer(1, 8))
    
    # 4. Visual Analytics
    story.append(PageBreak())
    story.append(Paragraph("4. Visual Analytics", heading_style))
    
    # Include charts
    for chart_path in chart_paths:
        if os.path.exists(chart_path):
            try:
                img = Image(chart_path, width=6*inch, height=4*inch)
                story.append(img)
                story.append(Spacer(1, 15))
            except Exception as e:
                print(f"WARNING: Could not include chart {chart_path}: {e}")
    
    # Word clouds with better formatting
    image_paths = []
    for category, word_freq in quiz_analysis['word_frequencies'].items():
        if word_freq:
            try:
                # Create more educational word cloud
                wc = WordCloud(
                    width=800, 
                    height=400, 
                    background_color='white',
                    colormap='viridis',
                    max_words=30
                ).generate_from_frequencies(word_freq)
                
                image_path = f"{sanitize_filename(category)}_educational_wordcloud.png"
                wc.to_file(image_path)
                image_paths.append(image_path)
                
                story.append(Paragraph(f"{category} - Key Educational Terms", subheading_style))
                img = Image(image_path, width=6*inch, height=3*inch)
                story.append(img)
                story.append(Spacer(1, 15))
            except Exception as e:
                print(f"WARNING: Could not generate word cloud for {category}: {e}")
    
    # 5. Individual Question Analysis
    story.append(PageBreak())
    story.append(Paragraph("5. Individual Question Analysis", heading_style))
    
    for i, quiz in enumerate(quiz_data['quiz_questions'], 1):
        question_elements = []
        
        # Question header with styling
        question_elements.append(Paragraph(f"<b>Question {i}</b>", subheading_style))
        question_elements.append(Paragraph(f"<b>Stem:</b> {quiz['question']}", normal_style))
        
        # Options with correct answer highlighted
        options = quiz.get('options', {})
        for key, option in options.items():
            if key == quiz.get('correct'):
                question_elements.append(Paragraph(f"<b>{key.upper()}:</b> {option} ✓ <i>(Correct Answer)</i>", 
                                                 ParagraphStyle('CorrectAnswer', parent=normal_style, textColor=colors.darkgreen)))
            else:
                question_elements.append(Paragraph(f"{key.upper()}: {option}", normal_style))
        
        # Educational explanation
        question_elements.append(Paragraph(f"<b>Educational Rationale:</b> {quiz['explanation']}", normal_style))
        question_elements.append(Spacer(1, 20))
        
        story.append(KeepTogether(question_elements))
    
    # 6. Student Feedback Analysis (if available)
    if feedback_analysis and numeric_summary is not None:
        story.append(PageBreak())
        story.append(Paragraph("6. Student Feedback Analysis", heading_style))
        
        # AI feedback analysis
        if ai_feedback_analysis:
            feedback_paragraphs = ai_feedback_analysis.split('\n\n')
            for paragraph in feedback_paragraphs:
                if paragraph.strip():
                    story.append(Paragraph(paragraph.strip(), normal_style))
                    story.append(Spacer(1, 8))
        
        # Quantitative summary with enhanced formatting
        story.append(Paragraph("Quantitative Feedback Summary", subheading_style))
        
        if not numeric_summary.empty:
            table_data = [['Metric', 'Mean', 'Std Dev', 'Min', 'Max', 'Interpretation']]
            for col in numeric_summary.columns:
                stats = numeric_summary[col]
                # Add interpretation based on mean scores
                if stats['mean'] >= 8.0:
                    interpretation = "Excellent"
                elif stats['mean'] >= 7.0:
                    interpretation = "Very Good"
                elif stats['mean'] >= 6.0:
                    interpretation = "Good"
                elif stats['mean'] >= 5.0:
                    interpretation = "Satisfactory"
                else:
                    interpretation = "Needs Improvement"
                
                table_data.append([
                    Paragraph(col, ParagraphStyle('TableCell', fontSize=8, leading=10)),
                    f"{stats['mean']:.2f}",
                    f"{stats['std']:.2f}",
                    f"{stats['min']:.2f}",
                    f"{stats['max']:.2f}",
                    interpretation
                ])
            
            feedback_table = Table(table_data, colWidths=[180, 50, 50, 40, 40, 80])
            feedback_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('ALIGN', (0, 1), (0, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            
            story.append(feedback_table)
    
    # 7. Recommendations
    story.append(PageBreak())
    story.append(Paragraph("7. Recommendations for Educational Improvement", heading_style))
    
    recommendations = f"""
    <b>IMMEDIATE ACTIONS:</b><br/>
    • Review questions with low cognitive complexity and consider adding higher-order thinking elements.<br/>
    • Ensure balanced representation across different question types to avoid over-emphasising recall-level items.<br/>
    • Verify that explanations provide clear learning pathways and explicitly address common misconceptions.<br/><br/>

    <b>MEDIUM-TERM ENHANCEMENTS (next course run):</b><br/>
    • Map every question to a specific learning objective and Bloom’s level to guarantee constructive alignment.<br/>
    • Create alternative versions of the quiz to enable formative use without compromising summative integrity.<br/>
    • Introduce short reflection prompts after difficult items to strengthen metacognitive skills.<br/><br/>

    <b>LONG-TERM STRATEGY:</b><br/>
    • Establish an item bank with analytics (difficulty, discrimination indices) to guide data-driven revisions.<br/>
    • Combine quiz analytics with classroom performance data to personalise remediation pathways.<br/>
    • Periodically solicit student feedback focused on assessment fairness and transparency, then iterate accordingly.
    """

    story.append(Paragraph(recommendations, normal_style))

    # ---------- BUILD THE PDF ----------
    try:
        print(f"Attempting to save PDF to: {os.path.abspath(output_filename)}")
        doc.build(story)
        print(f"PDF should now exist at: {os.path.abspath(output_filename)}")
        print(f"File exists? {os.path.exists(output_filename)}")
        print(f"SUCCESS: Report generated – {output_filename}")
    except Exception as e:
        print(f"ERROR: Failed to generate PDF: {e}")


if __name__ == "__main__":
    generate_report()
