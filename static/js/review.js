// DOM elements
const levelNameElement = document.getElementById('level-name');
const levelScoreElement = document.getElementById('level-score');
const levelMaxScoreElement = document.getElementById('level-max-score');
const levelPercentageElement = document.getElementById('level-percentage');
const loadingElement = document.getElementById('loading');
const noQuestionsElement = document.getElementById('no-questions');
const questionsContainerElement = document.getElementById('questions-container');
const retryButton = document.getElementById('retry-btn');
const backButton = document.getElementById('back-btn');

// Get level ID from URL
const urlParams = new URLSearchParams(window.location.search);
const levelId = urlParams.get('level');

// Get CSRF token from cookies
function getCsrfToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, 'csrftoken='.length) === 'csrftoken=') {
                cookieValue = decodeURIComponent(cookie.substring('csrftoken='.length));
                break;
            }
        }
    }
    return cookieValue;
}

// Initialize the review page
async function initReview() {
    if (!levelId) {
        showError('No level specified. Please go back and select a level.');
        return;
    }
    
    console.log("Initializing review for level:", levelId);
    
    try {
        // Fetch from base API endpoint
        const response = await fetch(`/api/progress/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        console.log("Progress API response status:", response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const allProgress = await response.json();
        console.log("All progress data:", allProgress);
        
        // ค้นหาข้อมูล level ที่ต้องการ
        const levelProgress = allProgress.find(progress => 
            progress.level == levelId || progress.level_details?.id == levelId
        );
        
        if (levelProgress) {
            console.log("Found level progress:", levelProgress);
            
            // Update level info
            levelNameElement.textContent = levelProgress.level_details?.name || `Level ${levelProgress.level}`;
            levelScoreElement.textContent = levelProgress.score;
            levelMaxScoreElement.textContent = levelProgress.max_score;
            levelPercentageElement.textContent = `${Math.round(levelProgress.percentage_score)}%`;
            
            // Fetch incorrect questions
            await loadIncorrectQuestions(levelId);
        } else {
            console.error("Level progress not found in response for level ID:", levelId);
            showError('Level information not found. Please try again.');
        }
    } catch (error) {
        console.error('Error loading review:', error);
        showError('Failed to load review data. Please try again later.');
    }
}

// Load incorrect questions directly
async function loadIncorrectQuestions(levelId) {
    try {
        console.log("Loading incorrect questions for level:", levelId);
        const response = await fetch(`/api/progress/incorrect_questions/?level_id=${levelId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        console.log("Incorrect questions response status:", response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const questions = await response.json();
        console.log("Incorrect questions loaded:", questions);
        
        // Hide loading
        loadingElement.style.display = 'none';
        
        if (!questions || questions.length === 0) {
            // Show no questions message
            console.log("No incorrect questions found");
            noQuestionsElement.style.display = 'block';
        } else {
            // Render questions
            console.log("Rendering questions:", questions.length);
            questionsContainerElement.style.display = 'block';
            renderQuestions(questions);
        }
    } catch (error) {
        console.error('Error loading incorrect questions:', error);
        showError('Failed to load questions. Please try again later.');
    }
}

// Render questions
function renderQuestions(questions) {
    questionsContainerElement.innerHTML = '';
    
    questions.forEach((question, index) => {
        // Create question card
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        
        // Find correct answer
        const correctAnswer = question.answers.find(answer => answer.is_correct);
        
        if (!correctAnswer) {
            console.error("No correct answer found for question:", question);
            return; // Skip this question
        }
        
        // Create question HTML
        questionCard.innerHTML = `
            <div class="question-number">${index + 1}</div>
            <div class="question-content">
                <h3 class="question-word">${question.word} <span class="pronunciation">(${question.pronunciation})</span></h3>
                
            </div>
        `;// <div class="correct-answer">
                //     <div class="answer-label">Correct answer:</div>
                //     <div class="answer-text">${correctAnswer.thai_text} (${correctAnswer.english_text})</div>
                // </div>
        
        questionsContainerElement.appendChild(questionCard);
    });
}

// Show error
function showError(message) {
    loadingElement.style.display = 'none';
    questionsContainerElement.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
        </div>
    `;
    questionsContainerElement.style.display = 'block';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing review");
    initReview();
    
    // Retry button
    retryButton.addEventListener('click', function() {
        console.log("Retry button clicked. Level ID:", levelId);
        localStorage.setItem('currentLevelId', levelId);
        
        // Navigate to quiz page
        const quizUrl = window.URLS && window.URLS.level ? window.URLS.level : '/quiz/';
        window.location.href = quizUrl;
    });
    
    // Back button
    backButton.addEventListener('click', function() {
        console.log("Back button clicked");
        const homeUrl = window.URLS && window.URLS.home ? window.URLS.home : '/';
        window.location.href = '/';
    });
});