// For show / hide menubar
const body = document.querySelector("body"),
    sidebar = document.querySelector(".sidebar"),
    toggle = document.querySelector(".toggle");

toggle.addEventListener("click", () => {
    sidebar.classList.toggle("close");
});

// For level button
const levels = [
    { number: 1, unlocked: true, current: true },
    { number: 2, unlocked: false },
    { number: 3, unlocked: false },
    { number: 4, unlocked: false },
    { number: 5, unlocked: false },
    { number: 6, unlocked: false },
    { number: 7, unlocked: false },
    { number: 8, unlocked: false },
    { number: 9, unlocked: false },
    { number: 10, unlocked: false }
];

const levelsContainer = document.getElementById('levelsContainer');

let currentLevelIndex = 0;

function showLevel() {

    let currentLevel = levels[currentLevelIndex];

    levels.forEach(level => {
        const levelElement = document.createElement('button');
        levelElement.className = `level-button ${!level.unlocked ? 'locked' : ''} ${level.current ? 'current' : ''}`;
        levelElement.innerHTML = level.number;

        if (level.current) {
            levelElement.innerHTML += `
            <button class="start-button">
                Start!
            </button>`;
        }

        levelsContainer.appendChild(levelElement);
    });

    document.querySelectorAll('.start-button').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            window.location.href = window.URLS.level;
        });
    });

    document.querySelectorAll('.level-button').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            window.location.href = window.URLS.level;
        });
    });
}


showLevel();