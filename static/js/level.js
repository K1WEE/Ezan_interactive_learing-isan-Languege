const quizHeaderElement = document.getElementById("quiz-header");
const questionElement = document.getElementById("question");
const answerButtons = document.getElementById("answer-btns");
const nextButton = document.getElementById("next-btn");
const progressBar = document.querySelector(".progress-bar");
const questionCount = document.querySelector(".question-count");

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let progressSubmitted = false;
let questionAttempts = [];

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// fetch json api 
async function fetchQuestions() {
    // แสดงสถานะกำลังโหลด
    questionElement.innerHTML = '<div class="loading-message">Loading questions...</div>';
    
    try {
        // ใช้ URL parameter ก่อน localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const urlLevelId = urlParams.get('level');
        const storedLevelId = localStorage.getItem('currentLevelId');
        const levelId = urlLevelId || storedLevelId;
        
        console.log('Level ID from URL:', urlLevelId);
        console.log('Level ID from localStorage:', storedLevelId);
        console.log('Using Level ID:', levelId);
        
        if (!levelId) {
            console.error('No level ID found');
            questionElement.innerHTML = "Error: Level information not found. Please return to the main page and select a new level.";
            return;
        }
        
        // บันทึกลง localStorage
        localStorage.setItem('currentLevelId', levelId);
        
        // กำหนด timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 วินาที timeout
        
        console.log('Fetching questions for level:', levelId); 
        const response = await fetch(`/api/questions/level/${levelId}/?format=json`, {
            signal: controller.signal,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });
        clearTimeout(timeoutId);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        console.log('Number of questions:', data.length);
        questions = data;

        // check if have questions
        if (questions && questions.length > 0) {
            startQuiz();
        } else {
            questionElement.innerHTML = "No questions found for this level. Please check if there are any questions in the database.";
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Fetch timeout, request took too long');
            questionElement.innerHTML = "Loading data took too long. Please try again.";
        } else {
            console.error('Error fetching questions:', error);
            questionElement.innerHTML = `Unable to load questions: ${error.message}`;
        }
        
        nextButton.innerHTML = "Return to home";
        nextButton.style.display = "block";
    }
}

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    progressSubmitted = false;
    questionAttempts = [];
    nextButton.innerHTML = "Next";
    showQuestion();
}

// Reset the state of answer buttons
function resetState() {
    nextButton.style.display = "none";
    while(answerButtons.firstChild) {
        answerButtons.removeChild(answerButtons.firstChild);
    }
}

// Update progress bar
function updateProgressBar() {
    // Update the question counter text
    questionCount.textContent = `Question ${currentQuestionIndex + 1}/${questions.length}`;
    
    // Update the progress bar width
    const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
    progressBar.style.width = `${progressPercentage}%`;
}

function showQuestion() {
    resetState();
    let currentQuestion = questions[currentQuestionIndex];
    
    // ตรวจสอบว่า currentQuestion มีอยู่
    if (!currentQuestion) {
        console.error('Current question is undefined', { currentQuestionIndex, questions });
        questionElement.innerHTML = "There was an error in displaying the question.";
        return;
    }
    
    let questionNo = currentQuestionIndex + 1;
    
    let questionHTML = `${questionNo}. ${currentQuestion.word} <span class="pronunciation">(${currentQuestion.pronunciation})</span>`;
    
    // เพิ่มปุ่มเล่นเสียง
    if (currentQuestion.sound_file_url) {
        questionHTML += `
            <button class="sound-button" data-sound="${currentQuestion.sound_file_url}" type="button">
                <i class="bx bx-volume-full"></i>
            </button>
        `;
    }
    
    questionElement.innerHTML = questionHTML;
    quizHeaderElement.innerHTML = "Select the correct meaning.";

    // Update progress bar
    updateProgressBar();

    // Show choices button
    if (currentQuestion.answers && currentQuestion.answers.length > 0) {
        currentQuestion.answers.forEach(option => {
            const button = document.createElement("button");
            button.innerHTML = option.thai_text + " (" + option.english_text + ")";
            button.classList.add("btn");
            button.dataset.answerId = option.id;
            if (option.is_correct) {
                button.dataset.correct = option.is_correct;
            }
            button.addEventListener("click", selectAnswer);
            answerButtons.appendChild(button);
        });
    } else {
        console.error('No answers found for question', currentQuestion);
        answerButtons.innerHTML = "<p>No answer options found for this question.</p>";
    }
    
    // เพิ่ม event listener ปุ่มเล่นเสียง
    setupSoundButtons();
}

function selectAnswer(e) {
    const selectedBtn = e.target;
    const isCorrect = selectedBtn.dataset.correct === "true";
    const answerId = selectedBtn.dataset.answerId;
    const currentQuestion = questions[currentQuestionIndex];

    // Add to question attempts
    questionAttempts.push({
        question_id: currentQuestion.id,
        answer_id: answerId,
        is_correct: isCorrect
    });

    // Track progress in progressService if available
    if (window.progressService) {
        progressService.recordAnswer(currentQuestion.id, answerId, isCorrect);
    }

    if (isCorrect) {
        selectedBtn.classList.add("correct");
        score++;
    } else {
        selectedBtn.classList.add("incorrect");
        // Show correct answer
        const buttons = answerButtons.querySelectorAll(".btn");
        buttons.forEach(button => {
            if (button.dataset.correct === "true") {
                button.classList.add("correct");
            }
        });
    }

    // Disable all buttons after selection
    Array.from(answerButtons.children).forEach(button => {
        button.disabled = true;
    });

    // Show next button
    nextButton.style.display = "block";
    
    // If last question, change next button text
    if (currentQuestionIndex === questions.length - 1) {
        nextButton.innerHTML = "Finish";
    }
}

function handleNextButton() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showScore();
    }
}

function showScore() {
    resetState();
    const percentage = Math.round((score / questions.length) * 100);
    const levelId = localStorage.getItem('currentLevelId');
    
    questionElement.innerHTML = `Your score: ${score} out of ${questions.length} (${percentage}%)`;
    
    if (percentage >= 80) {
        quizHeaderElement.innerHTML = "Congratulations!";
    } else {
        quizHeaderElement.innerHTML = "Good effort, keep practicing!";
    }
    
    // Submit progress to the server
    if (!progressSubmitted) {
        console.log("Attempting to submit progress...");
        
        if (window.progressService) {
            console.log("Using progressService to submit quiz");
            progressService.submitQuiz()
                .then(result => {
                    console.log('Progress submitted successfully:', result);
                    progressSubmitted = true;
                    
                    // If passed and next level is unlocked, show a message
                    if (result && result.has_passed) {
                        const nextLevelMsg = document.createElement('p');
                        nextLevelMsg.className = 'next-level-message';
                        nextLevelMsg.innerHTML = 'You unlocked the next level!';
                        document.querySelector('.quiz').appendChild(nextLevelMsg);
                        
                        refreshLevelData(result);
                    }
                })
                .catch(error => {
                    console.error('Error submitting progress via progressService:', error);
                    // Fallback to traditional method if progressService fails
                    submitDirectly(score, questions.length, levelId);
                });
        } else {
            console.log("progressService not available, using direct submission");
            submitDirectly(score, questions.length, levelId);
        }
    }
    
    nextButton.innerHTML = "Return to Home";
    nextButton.style.display = "block";
}

function refreshLevelData(result) {
    console.log("Refreshing level data after quiz submission");
    
    // เพิ่ม loading
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-spinner';
    loadingIndicator.id = 'refresh-spinner';
    document.querySelector('.quiz').appendChild(loadingIndicator);
    
    // ตั้งค่า timeout
    setTimeout(() => {
        if (window.progressService) {
            // เรียกให้ progressService รีเฟรชข้อมูล
            progressService.refreshLevelData()
                .then(() => {
                    console.log("Level data refreshed successfully");
                    // ลบตัวแสดงการโหลด
                    const spinner = document.getElementById('refresh-spinner');
                    if (spinner) spinner.remove();
                    
                    // เพิ่มปุ่ม level ถัดไป
                    if (result && result.has_passed && result.next_level_id) {
                        const nextLevelBtn = document.createElement('button');
                        nextLevelBtn.className = 'btn';
                        nextLevelBtn.style.backgroundColor = '#4CAF50';
                        nextLevelBtn.style.marginTop = '20px';
                        nextLevelBtn.innerHTML = 'Go to Next Level';
                        nextLevelBtn.addEventListener('click', () => {
                            // เก็บ ID level ถัดไปใน localStorage
                            localStorage.setItem('currentLevelId', result.next_level_id);
                            const levelUrl = (typeof window.URLS === 'string') ? 
                                `${window.URLS}?level=${result.next_level_id}` : 
                                `/quiz/?level=${result.next_level_id}`;
                            window.location.href = levelUrl;
                        });
                        document.querySelector('.quiz').appendChild(nextLevelBtn);
                    }
                })
                .catch(err => {
                    console.error("Error refreshing level data:", err);
                    const spinner = document.getElementById('refresh-spinner');
                    if (spinner) spinner.remove();
                });
        }
    }, 1500); // รอ 1.5 วิ
}

// แก้ submitDirectly
function submitDirectly(score, totalQuestions, levelId) {
    console.log("Submitting directly with:", {
        levelId: levelId,
        answers: questionAttempts,
        score: score,
        totalQuestions: totalQuestions
    });
    
    fetch('/api/progress/submit_quiz/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            level_id: levelId,
            answers: questionAttempts
        })
    })
    .then(response => {
        console.log("Direct submission response status:", response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Progress submitted directly successfully:', data);
        progressSubmitted = true;
        
        // If passed and next level is unlocked, show a message
        if (data && data.has_passed) {
            const nextLevelMsg = document.createElement('p');
            nextLevelMsg.className = 'next-level-message';
            nextLevelMsg.innerHTML = 'You unlocked the next level!';
            document.querySelector('.quiz').appendChild(nextLevelMsg);
            
            refreshLevelData(data);
        }
    })
    .catch(error => {
        console.error('Error submitting progress directly:', error);
        // Legacy approach as last resort
        submitTraditionalScore(score, totalQuestions, levelId);
    });
}

// Legacy approach for score submission
function submitTraditionalScore(score, totalQuestions, levelId) {
    if (!levelId) return;
    
    console.log("Using traditional score submission as last resort");
    
    const data = {
        player_name: window.playerName || 'Anonymous',
        score: score,
        max_score: totalQuestions,
        level: levelId
    };
    
    console.log("Submitting traditional score with:", data);
    
    fetch('/api/scores/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log("Traditional score submission response status:", response.status);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Score submitted via traditional method successfully:', data);
    })
    .catch(error => {
        console.error('Error submitting traditional score:', error);
        // Show error message to user
        const errorMsg = document.createElement('p');
        errorMsg.className = 'error-message';
        errorMsg.innerHTML = 'Could not save your progress. Please try again later.';
        document.querySelector('.quiz').appendChild(errorMsg);
    });
}

nextButton.addEventListener("click", () => {
    if (currentQuestionIndex < questions.length) {
        handleNextButton();
    } else {
        const homeUrl = (typeof window.URLS === 'string') ? window.URLS : '/home/';
        window.location.href = homeUrl;
    }
});

// เพิ่มการโหลด progress service
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // ตรวจสอบว่ามี progress service
    if (window.progressService) {
        console.log('Progress service found, fetching questions...');
        fetchQuestions();
    } else {
        console.log('Progress service not found, loading script...');
        
        // สร้าง script tag โหลด progress-service.js
        const script = document.createElement('script');
        script.src = '/static/js/progress-service.js';
        script.onload = function() {
            console.log('Progress service script loaded');
            fetchQuestions();
        };
        script.onerror = function() {
            console.error('Failed to load progress service script');
            questionElement.innerHTML = "Unable to load script. Please refresh the page.";
            fetchQuestions();
        };
        
        document.head.appendChild(script);
    }
});

function setupSoundButtons() {
    document.querySelectorAll('.sound-button').forEach(button => {
        button.addEventListener('click', playQuestionSound);
    });
}

function playQuestionSound(e) {
    e.preventDefault(); // กัน submit form
    e.stopPropagation(); // กันไม่ให้ event ทำงานซ้อนกัน
    
    const button = e.currentTarget;
    const soundUrl = button.dataset.sound;
    
    if (soundUrl) {
        button.classList.add('playing');
        
        const audio = new Audio(soundUrl);
        
        audio.onended = function() {
            button.classList.remove('playing');
        };
        
        audio.onerror = function() {
            console.error('Error playing sound');
            button.classList.remove('playing');
        };
        
        audio.play().catch(error => {
            console.error('Error playing sound:', error);
            button.classList.remove('playing');
        });
    }
}