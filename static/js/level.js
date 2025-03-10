const quizHeaderElement = document.getElementById("quiz-header");
const questionElement = document.getElementById("question");
const answerButtons = document.getElementById("answer-btns");
const nextButton = document.getElementById("next-btn");
const progressBar = document.querySelector(".progress-bar");
const questionCount = document.querySelector(".question-count");

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let currentLevel = null; // เก็บค่า level ของคำถามปัจจุบัน
let scoreSubmitted = false; // เพิ่มตัวแปรเพื่อเช็คว่าบันทึกคะแนนแล้วหรือยัง

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

// fecth json api 
async function fetchQuestions() {
    try {
        const response = await fetch('https://ezan-ezan.up.railway.app/api/questions/level/1/?format=json');
        const data = await response.json();
        questions = data;

        // chech is have questions
        if (questions.length > 0) {
            // store first level
            currentLevel = questions[0].level;
            startQuiz();
        } else {
            questionElement.innerHTML = "No question found in the system";
        }
    } catch (error) {
        console.error('Error fetching questions:', error);
        questionElement.innerHTML = "Unable to load question. Please try again.";
    }
}

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    scoreSubmitted = false;
    nextButton.innerHTML = "Next";
    showQuestion();
}

function showQuestion() {
    resetState();
    let currentQuestion = questions[currentQuestionIndex];
    let questionNo = currentQuestionIndex + 1;
    questionElement.innerHTML = questionNo + ". " + currentQuestion.word + " (" + currentQuestion.pronunciation + ")";
    quizHeaderElement.innerHTML = "Select the correct meaning.";

    // Update progress bar
    updateProgressBar();

    // Show choices button
    currentQuestion.answers.forEach(option => {
        const button = document.createElement("button");
        button.innerHTML = option.thai_text + " (" + option.english_text + ")";
        button.classList.add("btn");
        answerButtons.appendChild(button);
        if (option.is_correct) {
            button.dataset.correct = option.is_correct;
        }
        button.addEventListener("click", selectAnswer);
    });
}

function updateProgressBar() {
    // Calculate progress
    const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
    progressBar.style.width = progressPercentage + "%";
    questionCount.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;

    // Add a complete class when finished
    if (currentQuestionIndex === questions.length - 1) {
        progressBar.classList.add("complete");
    } else {
        progressBar.classList.remove("complete");
    }
}

// Remove the exceeded choices button
function resetState() {
    nextButton.style.display = "none";
    while (answerButtons.firstChild) {
        answerButtons.removeChild(answerButtons.firstChild);
    }
}

// Add class correct and incorrect to change background color
function selectAnswer(e) {
    const selectedBtn = e.target;
    const isCorrect = selectedBtn.dataset.correct === "true";
    if (isCorrect) {
        selectedBtn.classList.add("correct");
        score++;
    } else {
        selectedBtn.classList.add("incorrect");
    }

    // If you choose the correct answer other buttons will be disabled
    // If you choose the correct it will show green background
    // If you choose the wrong it will show red background and automatically show the correct answer
    Array.from(answerButtons.children).forEach(button => {
        if (button.dataset.correct === "true") {
            button.classList.add("correct");
        }
        button.disabled = true;
    });
    nextButton.style.display = "block";
}

// show score and auto save
async function showScore() {
    resetState();

    // บันทึกคะแนนอัตโนมัติ (ถ้ายังไม่ได้บันทึก)
    if (!scoreSubmitted) {
        // แสดงข้อความกำลังบันทึก
        questionElement.innerHTML = "Recording score...";

        // เรียกฟังก์ชันบันทึกคะแนน
        await saveScore();
    }

    // แสดงคะแนนและข้อความบันทึกแล้ว
    quizHeaderElement.innerHTML = "Level completed!";
    questionElement.innerHTML = `
        <div>Your score is ${score} out of ${questions.length} !</div>
        <br>
        <div class="score-saved">Score has been recorded.</div>
    `;

    nextButton.innerHTML = "Go to Home";
    nextButton.style.display = "block";
}

async function saveScore() {
    const playerName = window.playerName;
    const scoreData = {
        player_name: playerName,
        score: score,
        max_score: questions.length,
        level: currentLevel
    };

    const csrftoken = getCookie('csrftoken');

    try {
        const response = await fetch('https://ezan-ezan.up.railway.app/api/scores/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify(scoreData)
        });

        if (response.ok) {
            scoreSubmitted = true;
            return true;
        } else {
            console.error('Error saving score:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('Error saving score:', error);
        return false;
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

nextButton.addEventListener("click", () => {
    if (currentQuestionIndex < questions.length) {
        handleNextButton();
    } else {
        window.location.href = window.URLS;
    }
});

fetchQuestions();