// ปรับปรุงส่วนของการอัปเดตข้อมูลระดับในไฟล์ home.js

// For show / hide menubar
const body = document.querySelector("body"),
    sidebar = document.querySelector(".sidebar"),
    toggle = document.querySelector(".toggle");

toggle.addEventListener("click", () => {
    sidebar.classList.toggle("close");
});

// For level rendering and progress tracking
const levelsContainer = document.getElementById('levelsContainer');

// เพิ่มตัวแปรสำหรับเก็บข้อมูลระดับ
let currentLevels = [];

// Initialize progress and levels
async function initializeLevels() {
    // Show loading state
    levelsContainer.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        // Fetch user progress from the API
        const levels = await progressService.initLevelProgress();
        
        // เก็บข้อมูลระดับไว้ใช้ภายหลัง
        currentLevels = levels;
        
        console.log("Fetched levels:", levels);
        
        if (levels.length === 0) {
            levelsContainer.innerHTML = '<p class="no-levels">No levels available yet. Check back later!</p>';
            return;
        }
        
        // หาระดับที่ปลดล็อกล่าสุด (ด้วยเลขระดับสูงสุด)
        let highestUnlockedLevel = levels.filter(level => level.is_unlocked)
            .sort((a, b) => {
                // ใช้ number จาก level object หรือ level_details ถ้ามี
                const aNum = a.number || (a.level_details && a.level_details.number) || 0;
                const bNum = b.number || (b.level_details && b.level_details.number) || 0;
                return bNum - aNum; // เรียงจากมากไปน้อย
            })[0];
        
        console.log("Highest unlocked level:", highestUnlockedLevel);
        
        // ถ้าไม่พบระดับที่ปลดล็อก ใช้ระดับแรก
        const currentLevel = highestUnlockedLevel || levels[0];
        
        // อัปเดต subtitle
        updateProgressSubtitle(currentLevel);
        
        // Clear loading state
        levelsContainer.innerHTML = '';
        
        // Render each level
        levels.forEach(level => {
            renderLevelButton(level);
        });
    } catch (error) {
        console.error('Error initializing levels:', error);
        levelsContainer.innerHTML = '<p class="error">Failed to load levels. Please try again later.</p>';
    }
}

// แยกฟังก์ชันอัปเดต subtitle
function updateProgressSubtitle(currentLevel) {
    const progressSubtitle = document.querySelector('.progress-subtitle');
    if (progressSubtitle && currentLevel) {
        // แสดงข้อมูลให้เห็นในคอนโซล
        console.log("Updating subtitle with level:", currentLevel);
        
        // ดึงข้อมูล level name และ number
        const levelName = currentLevel.level_details?.name || 
                         currentLevel.name || 
                         'Beginner';
        const levelNumber = currentLevel.number || 
                           (currentLevel.level_details && currentLevel.level_details.number) || 
                           1;
        
        // อัปเดตข้อความ
        const newText = `${levelName} Stage: Level ${levelNumber}`;
        console.log("New subtitle text:", newText);
        progressSubtitle.textContent = newText;
    }
}

// Render a level button with progress information
function renderLevelButton(level) {
    const levelElement = document.createElement('div');
    levelElement.className = 'level-item';
    levelElement.dataset.levelId = level.id;
    
    const isLocked = !level.is_unlocked;
    const isCurrent = !level.is_completed && level.is_unlocked;
    const isCompleted = level.is_completed;
    
    // Display progress for completed levels
    let progressIndicator = '';
    if (isCompleted) {
        const progressClass = level.has_passed ? 'passed' : 'failed';
        progressIndicator = `
            <div class="progress-indicator ${progressClass}">
                <span class="progress-text">${Math.round(level.percentage_score)}%</span>
            </div>
        `;
    }
    
    // Determine button state and class
    let buttonClass = 'level-button';
    if (isLocked) buttonClass += ' locked';
    if (isCurrent) buttonClass += ' current';
    if (isCompleted) buttonClass += ' completed';
    if (level.has_passed) buttonClass += ' passed';
    
    // Create level button HTML
    levelElement.innerHTML = `
        <button class="${buttonClass}" data-level-id="${level.id}" data-level-number="${level.number}">
            ${level.number}
            ${progressIndicator}
        </button>
        <p class="level-name">${level.name}</p>
    `;
    
    // Add "Start" button for current level
    if (isCurrent) {
        const startButton = document.createElement('button');
        startButton.className = 'start-button';
        startButton.textContent = 'Start!';
        startButton.dataset.levelId = level.id;
        levelElement.querySelector('.level-button').appendChild(startButton);
    }
    
    // Add "Review" button for completed levels
    if (isCompleted) {
        const reviewButton = document.createElement('button');
        reviewButton.className = 'review-button';
        reviewButton.textContent = 'Review';
        reviewButton.dataset.levelId = level.id;
        levelElement.appendChild(reviewButton);
    }
    
    levelsContainer.appendChild(levelElement);
}

function setupEventListeners() {
    // Start level button
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('start-button') || 
            (e.target.classList.contains('level-button') && !e.target.classList.contains('locked'))) {
            
            // Get the level ID from the button or its parent
            const levelId = e.target.dataset.levelId || (e.target.closest('.level-button') ? e.target.closest('.level-button').dataset.levelId : null);
            
            console.log('Button clicked with level ID:', levelId);
            
            if (!levelId) {
                console.error('No level ID found in button data attribute');
                alert('An error occurred: No checkpoint information found. Please try again.');
                return;
            }
            
            // บันทึก level ID ใน localStorage
            localStorage.setItem('currentLevelId', levelId);
            console.log('Stored level ID in localStorage:', levelId);
            
            // Set current level in progress service if available
            if (window.progressService) {
                progressService.setCurrentLevel(levelId);
            }
            
            // Navigate to quiz page with level ID parameter
            window.location.href = `${window.URLS.level}?level=${levelId}`;
        }
    });
    
    // Review button
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('review-button')) {
            const levelId = e.target.dataset.levelId;
            
            if (!levelId) {
                console.error('No level ID found in review button');
                return;
            }
            
            // Navigate to review page
            window.location.href = `${window.URLS.review}?level=${levelId}`;
        }
    });
    
    // เพิ่ม event listener สำหรับการฟังเหตุการณ์การอัปเดตสถานะระดับ
    window.addEventListener('levelStatusChanged', function(e) {
        console.log('Level status changed event received:', e.detail);
        // รีเฟรชข้อมูลระดับเมื่อมีการเปลี่ยนแปลงสถานะ
        initializeLevels();
    });
}

// เพิ่มฟังก์ชันสำหรับอัปเดตสถานะระดับเฉพาะตัว (ไม่ต้องโหลดใหม่ทั้งหมด)
function updateLevelStatus(levelId, newStatus) {
    console.log(`Updating level ${levelId} with new status:`, newStatus);
    
    // หาระดับที่ต้องการอัปเดต
    const levelElement = document.querySelector(`.level-item[data-level-id="${levelId}"]`);
    if (!levelElement) {
        console.warn(`Level element with ID ${levelId} not found`);
        return;
    }
    
    // อัปเดตสถานะการปลดล็อก
    if (newStatus.is_unlocked !== undefined) {
        const button = levelElement.querySelector('.level-button');
        if (newStatus.is_unlocked) {
            button.classList.remove('locked');
        } else {
            button.classList.add('locked');
        }
    }
    
    // อัปเดตสถานะการเสร็จสิ้น
    if (newStatus.is_completed !== undefined) {
        const button = levelElement.querySelector('.level-button');
        if (newStatus.is_completed) {
            button.classList.add('completed');
            
            // เพิ่มปุ่ม Review ถ้ายังไม่มี
            if (!levelElement.querySelector('.review-button')) {
                const reviewButton = document.createElement('button');
                reviewButton.className = 'review-button';
                reviewButton.textContent = 'Review';
                reviewButton.dataset.levelId = levelId;
                levelElement.appendChild(reviewButton);
            }
            
            // อัปเดตตัวแสดงความก้าวหน้า
            if (newStatus.percentage_score !== undefined) {
                let progressIndicator = levelElement.querySelector('.progress-indicator');
                const progressClass = newStatus.has_passed ? 'passed' : 'failed';
                
                if (!progressIndicator) {
                    progressIndicator = document.createElement('div');
                    progressIndicator.className = `progress-indicator ${progressClass}`;
                    progressIndicator.innerHTML = `<span class="progress-text">${Math.round(newStatus.percentage_score)}%</span>`;
                    button.appendChild(progressIndicator);
                } else {
                    progressIndicator.className = `progress-indicator ${progressClass}`;
                    progressIndicator.querySelector('.progress-text').textContent = `${Math.round(newStatus.percentage_score)}%`;
                }
            }
        } else {
            button.classList.remove('completed');
            // ลบปุ่ม Review ถ้ามี
            const reviewButton = levelElement.querySelector('.review-button');
            if (reviewButton) {
                reviewButton.remove();
            }
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load the progress service script
    const script = document.createElement('script');
    script.src = '/static/js/progress-service.js';
    script.onload = function() {
        // Initialize levels after progress service is loaded
        initializeLevels();
        setupEventListeners();
        
        // เพิ่มฟังก์ชัน initializeLevels ให้กับ window object เพื่อให้สามารถเรียกใช้จากที่อื่นได้
        window.initializeLevels = initializeLevels;
        window.updateLevelStatus = updateLevelStatus;
    };
    document.head.appendChild(script);
});