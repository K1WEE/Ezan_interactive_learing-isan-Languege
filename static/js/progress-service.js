// Handle user progress tracking

class ProgressService {
    constructor() {
        this.apiBaseUrl = '/api/progress/';
        this.quizAnswers = [];
        this.currentLevel = null;
        this.levelsData = null; // ตัวแปรเก็บข้อมูล level
        console.log('ProgressService initialized');
    }

    // Initialize level progress
    async initLevelProgress() {
        try {
            console.log('Fetching user levels progress...');
            const response = await fetch(`${this.apiBaseUrl}user_levels/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            console.log('User levels response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const levels = await response.json();
            console.log('Fetched levels data:', levels);
            this.levelsData = levels; // เก็บข้อมูล level ไว้ใช้ภายใน service
            return levels;
        } catch (error) {
            console.error('Error fetching level progress:', error);
            return [];
        }
    }

    // Set current level
    setCurrentLevel(levelId) {
        console.log('Setting current level to:', levelId);
        this.currentLevel = levelId;
        this.quizAnswers = [];
    }

    // Record an answer
    recordAnswer(questionId, answerId, isCorrect) {
        console.log('Recording answer:', { questionId, answerId, isCorrect });
        this.quizAnswers.push({
            question_id: questionId,
            answer_id: answerId,
            is_correct: isCorrect
        });
    }

    // Submit answers for a level
    async submitQuiz() {
        if (!this.currentLevel || this.quizAnswers.length === 0) {
            console.error('No level or answers to submit', { 
                currentLevel: this.currentLevel, 
                answerCount: this.quizAnswers.length 
            });
            return null;
        }

        console.log('Submitting quiz:', {
            level_id: this.currentLevel,
            answers: this.quizAnswers
        });

        try {
            const csrfToken = this.getCsrfToken();
            console.log('CSRF Token:', csrfToken ? 'Present' : 'Missing');

            const response = await fetch(`${this.apiBaseUrl}submit_quiz/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    level_id: this.currentLevel,
                    answers: this.quizAnswers
                }),
                credentials: 'same-origin'  // Include cookies
            });

            console.log('Submit quiz response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Submit quiz result:', result);
            
            // Reset answers after submission
            this.quizAnswers = [];
            
            // เพิ่มข้อมูล level ถัดไป
            if (result.has_passed && this.levelsData) {
                const currentLevelIndex = this.levelsData.findIndex(level => level.id == this.currentLevel);
                if (currentLevelIndex >= 0 && currentLevelIndex < this.levelsData.length - 1) {
                    const nextLevel = this.levelsData[currentLevelIndex + 1];
                    result.next_level_id = nextLevel.id;
                    console.log(`Next level identified: ${nextLevel.id} (${nextLevel.name})`);
                }
            }
            
            return result;
        } catch (error) {
            console.error('Error submitting quiz:', error);
            throw error;  // Re-throw to allow proper handling in calling code
        }
    }

    // รีเฟรชข้อมูล level หลังจากส่ง quiz
    async refreshLevelData() {
        console.log('Refreshing level data...');
        try {
            // ดึงข้อมูล level ใหม่
            const levels = await this.initLevelProgress();
            
            // ตรวจสอบว่ามีการปลดล็อก lvel ใหม่
            const unlockedLevels = levels.filter(level => level.is_unlocked);
            console.log(`Found ${unlockedLevels.length} unlocked levels after refresh`);
            
            // อัปเดตข้อมูล lvel
            if (window.initializeLevels) {
                window.initializeLevels();
                console.log('Re-initialized levels display');
            }
            
            return levels;
        } catch (error) {
            console.error('Error refreshing level data:', error);
            throw error;
        }
    }

    // Get incorrect questions for review
    async getIncorrectQuestions(levelId = null) {
        let url = `${this.apiBaseUrl}incorrect_questions/`;
        if (levelId) {
            url += `?level_id=${levelId}`;
        }

        try {
            console.log('Fetching incorrect questions from:', url);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            console.log('Incorrect questions response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const questions = await response.json();
            console.log('Incorrect questions fetched:', questions.length);
            return questions;
        } catch (error) {
            console.error('Error fetching incorrect questions:', error);
            return [];
        }
    }

    // Get CSRF token from cookies
    getCsrfToken() {
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
}

// Create singleton instance
const progressService = new ProgressService();