const passwordField = document.querySelector('input[type="password"]');
const toggleButton = document.querySelector('.password-toggle');

// Hide and show password field
toggleButton.addEventListener('click', () => {
    const type = passwordField.type === 'password' ? 'text' : 'password';
    passwordField.type = type;
    toggleButton.querySelector('img').src = `/static/images/${type === 'password' ? 'eyeopen.png' : 'eyeclose.png'}`;
});
