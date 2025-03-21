// DOM Elements
const sidebar = document.querySelector(".sidebar");
const toggle = document.querySelector(".toggle");
const levelSelect = document.getElementById("level-select");
const startBtn = document.getElementById("start-btn");
const flashcardGame = document.getElementById("flashcard-game");

// State variables
let incorrectWords = [];
let currentCardIndex = 0;
let notRememberedWords = [];
let userLevels = [];

// Toggle sidebar
toggle.addEventListener("click", () => {
    sidebar.classList.toggle("close");
});

// Initialize the flashcard interface
document.addEventListener("DOMContentLoaded", async function() {
    console.log("Flashcard page loaded");
    
    try {
        // Load user levels
        await loadUserLevels();
        
        // Setup event listeners
        levelSelect.addEventListener("change", handleLevelChange);
        startBtn.addEventListener("click", startGame);
        
    } catch (error) {
        console.error("Error initializing flashcard page:", error);
        showError("An error occurred while loading data. Please try again.");
    }
});

// Load user levels from API
async function loadUserLevels() {
    try {
        console.log("Loading user levels...");
        
        // First check if progressService is available
        if (window.progressService) {
            console.log("Using progressService to load levels");
            userLevels = await progressService.initLevelProgress();
        } else {
            // Fallback to direct API call
            console.log("Falling back to direct API call for levels");
            const response = await fetch("/api/progress/user_levels/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            userLevels = await response.json();
        }
        
        console.log("Loaded user levels:", userLevels);
        
        // Filter to only show completed levels (since only these can have incorrect questions)
        const completedLevels = userLevels.filter(level => level.is_completed);
        
        if (completedLevels.length === 0) {
            console.log("No completed levels found");
            showNoLevelsMessage();
            return;
        }
        
        // Populate level select dropdown
        populateLevelSelect(completedLevels);
        
    } catch (error) {
        console.error("Error loading levels:", error);
        showError("Unable to load level data. Please try again.");
    }
}

// Populate level select dropdown
function populateLevelSelect(levels) {
    // Clear any existing options except the default
    while (levelSelect.options.length > 1) {
        levelSelect.remove(1);
    }
    
    // Add each level as an option
    levels.forEach(level => {
        const option = document.createElement("option");
        option.value = level.id;
        
        // Get level name and number from wherever they are available
        const levelName = level.name || level.level_details?.name || `Level ${level.number}`;
        const levelNumber = level.number || level.level_details?.number || "";
        
        option.textContent = `${levelName} (Level ${levelNumber})`;
        levelSelect.appendChild(option);
    });
}

// Handle level selection change
function handleLevelChange() {
    const levelId = levelSelect.value;
    startBtn.disabled = levelId === "";
    
    // Reset game state
    incorrectWords = [];
    currentCardIndex = 0;
    notRememberedWords = [];
}

// Start flashcard game
async function startGame() {
    const levelId = levelSelect.value;
    
    if (!levelId) {
        return;
    }
    
    // Show loading state
    flashcardGame.innerHTML = `
        <div class="loader-container">
            <div class="loader"></div>
            <p>Loading vocabulary...</p>
        </div>
    `;
    
    // Fetch incorrect words for the selected level
    try {
        await loadIncorrectWords(levelId);
        
        if (incorrectWords.length === 0) {
            flashcardGame.innerHTML = `
                <div class="no-words">
                    <h2>No incorrect answer found</h2>
                    <p>You answered all questions correctly at this level or have not taken the test yet.<br>Try the quiz first to use the flashcards.</p>
                </div>
            `;
            return;
        }
        
        // Show first card
        showCard(currentCardIndex);
        
    } catch (error) {
        console.error("Error starting game:", error);
        showError("Unable to load vocabulary. Please try again.");
    }
}

// Load incorrect words from API
async function loadIncorrectWords(levelId) {
    try {
        console.log("Loading incorrect words for level:", levelId);
        
        // Try to use progressService if available
        if (window.progressService) {
            incorrectWords = await progressService.getIncorrectQuestions(levelId);
        } else {
            // Fallback to direct API call
            const response = await fetch(`/api/progress/incorrect_questions/?level_id=${levelId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            incorrectWords = await response.json();
        }
        
        console.log("Loaded incorrect words:", incorrectWords);
        return incorrectWords;
        
    } catch (error) {
        console.error("Error loading incorrect words:", error);
        throw error;
    }
}

// Show a flashcard
function showCard(index) {
    // If we've gone through all cards
    if (index >= incorrectWords.length) {
        if (notRememberedWords.length > 0) {
            // Start a new round with not remembered words
            incorrectWords = [...notRememberedWords];
            notRememberedWords = [];
            currentCardIndex = 0;
            
            flashcardGame.innerHTML = `
                <div class="round-message">
                    <h2>New round!</h2>
                    <p>Let's review the vocabulary that you still can't remember.</p>
                </div>
            `;
            
            // After a brief pause, show the first card of the new round
            setTimeout(() => {
                showCard(currentCardIndex);
            }, 1500);
            
            return;
        } else {
            // End of game
            showFinishScreen();
            return;
        }
    }
    
    const word = incorrectWords[index];
    
    // Find the correct answer
    const correctAnswer = word.answers.find(answer => answer.is_correct);
    
    if (!correctAnswer) {
        console.error("No correct answer found for word:", word);
        currentCardIndex++;
        showCard(currentCardIndex);
        return;
    }
    
    // Create flashcard HTML
    flashcardGame.innerHTML = `
        <div class="flashcard">
            <div class="card-inner">
                <div class="card-front">
                    <h2>${word.word}</h2>
                    <p class="pronunciation">(${word.pronunciation})</p>
                    <button class="flip-btn">See translation</button>
                </div>
                <div class="card-back">
                    <div class="translation">
                        <p class="thai">${correctAnswer.thai_text}</p>
                        <p class="english">${correctAnswer.english_text}</p>
                    </div>
                    <div class="buttons">
                        <button class="remembered-btn">Got it</button>
                        <button class="not-remembered-btn">Not yet</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="progress-info">
            <span class="current">${index + 1}</span>/<span class="total">${incorrectWords.length}</span>
        </div>
    `;
    
    // Add audio button if sound file is available
    if (word.sound_file_url) {
        const pronunciation = flashcardGame.querySelector(".pronunciation");
        const audioBtn = document.createElement("button");
        audioBtn.className = "audio-btn";
        audioBtn.innerHTML = '<i class="bx bx-volume-full"></i>';
        audioBtn.dataset.soundUrl = word.sound_file_url;
        pronunciation.appendChild(audioBtn);
        
        // Add event listener for audio button
        audioBtn.addEventListener("click", playWordAudio);
    }
    
    // Add event listeners
    const flipBtn = flashcardGame.querySelector(".flip-btn");
    const rememberedBtn = flashcardGame.querySelector(".remembered-btn");
    const notRememberedBtn = flashcardGame.querySelector(".not-remembered-btn");
    
    flipBtn.addEventListener("click", () => {
        const cardInner = flashcardGame.querySelector(".card-inner");
        cardInner.classList.add("flipped");
    });
    
    rememberedBtn.addEventListener("click", () => {
        currentCardIndex++;
        showCard(currentCardIndex);
    });
    
    notRememberedBtn.addEventListener("click", () => {
        notRememberedWords.push(word);
        currentCardIndex++;
        showCard(currentCardIndex);
    });
}

// Play word audio
function playWordAudio(event) {
    const soundUrl = event.currentTarget.dataset.soundUrl;
    if (soundUrl) {
        const audio = new Audio(soundUrl);
        audio.play();
    }
}

// Show finish screen
function showFinishScreen() {
    flashcardGame.innerHTML = `
        <div class="finish-screen">
            <h2>Excellent!</h2>
            <p>You have reviewed all the vocabulary.</p>
            <button class="restart-btn">Retry</button>
            <a href="/home/" class="home-btn">Return to home</a>
        </div>
    `;
    
    // Add event listener for restart button
    const restartBtn = flashcardGame.querySelector(".restart-btn");
    restartBtn.addEventListener("click", () => {
        // Reset game state
        currentCardIndex = 0;
        notRememberedWords = [];
        
        // Restart with the same level
        startGame();
    });
}

// Show error message
function showError(message) {
    flashcardGame.innerHTML = `
        <div class="error">
            <h2>Error</h2>
            <p>${message}</p>
        </div>
    `;
}

// Show no levels message
function showNoLevelsMessage() {
    levelSelect.innerHTML = '<option value="">-- No levels found --</option>';
    startBtn.disabled = true;
    
    flashcardGame.innerHTML = `
        <div class="no-words">
            <h2>There is no completed level yet.</h2>
            <p>You must play and complete at least one level before you can use Flashcards.</p>
            <a href="/home/" class="restart-btn">Back to Levels</a>
        </div>
    `;
}