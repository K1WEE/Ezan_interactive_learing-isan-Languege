const passwordFields = document.querySelectorAll('input[type="password"]');
const toggleButtons = document.querySelectorAll('.password-toggle');

// Hide and show password field
toggleButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
        const field = passwordFields[index];
        const type = field.type === 'password' ? 'text' : 'password';
        field.type = type;
        button.querySelector('img').src = `/static/images/${type === 'password' ? 'eyeopen.png' : 'eyeclose.png'}`;
    });
});