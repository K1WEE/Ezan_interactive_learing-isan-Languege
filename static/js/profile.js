document.addEventListener('DOMContentLoaded', function() {
    // Sidebar toggle
    const body = document.querySelector('body');
    const sidebar = body.querySelector('nav.sidebar');
    const toggle = body.querySelector('.toggle');
    
    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('close');
    });

    // Profile edit functionality
    const editButtons = document.querySelectorAll('.edit-btn');
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const nameValue = document.getElementById('nameValue');
    const emailValue = document.getElementById('emailValue');
    const firstNameForm = document.getElementById('firstNameForm');
    const emailForm = document.getElementById('emailForm');
    const firstNameInput = document.querySelector('#firstNameForm input');
    const emailInput = document.querySelector('#emailForm input');
    
    // Password modal elements
    const passwordModal = document.getElementById('passwordModal');
    const modalClose = document.querySelector('.modal-close');
    const cancelPassword = document.getElementById('cancelPassword');
    const passwordForm = document.getElementById('passwordForm');
    
    // Track which fields are being edited
    let editingFields = {
        first_name: false,
        email: false
    };
    
    // Function to update UI when editing
    function updateEditingState() {
        const isEditing = editingFields.first_name || editingFields.email;
        saveChangesBtn.disabled = !isEditing;
        cancelBtn.disabled = !isEditing;
        
        // Disable other edit buttons while editing
        editButtons.forEach(btn => {
            if ((btn.dataset.field === 'first_name' && !editingFields.first_name) || 
                (btn.dataset.field === 'email' && !editingFields.email) ||
                btn.dataset.field === 'password') {
                btn.disabled = isEditing;
            }
        });
    }
    
    // Edit button click handlers
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const field = this.dataset.field;
            
            if (field === 'password') {
                // Show password modal
                passwordModal.style.display = 'flex';
                return;
            }
            
            if (field === 'first_name') {
                nameValue.style.display = 'none';
                firstNameForm.style.display = 'block';
                editingFields.first_name = true;
            } else if (field === 'email') {
                emailValue.style.display = 'none';
                emailForm.style.display = 'block';
                editingFields.email = true;
            }
            
            updateEditingState();
        });
    });
    
    // Form submit handler
    document.querySelector('.profile-info').addEventListener('submit', function(e) {
        if (!editingFields.first_name && !editingFields.email) {
            e.preventDefault();
            return;
        }
        
        // Add a loading indicator
        saveChangesBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Saving...';
        saveChangesBtn.disabled = true;
    });
    
    // Cancel button handler
    cancelBtn.addEventListener('click', function() {
        // Reset all forms and values
        if (editingFields.first_name) {
            nameValue.style.display = 'inline';
            firstNameForm.style.display = 'none';
            firstNameInput.value = nameValue.textContent.trim();
            editingFields.first_name = false;
        }
        
        if (editingFields.email) {
            emailValue.style.display = 'inline';
            emailForm.style.display = 'none';
            emailInput.value = emailValue.textContent.trim();
            editingFields.email = false;
        }
        
        // Clear any error messages
        document.querySelectorAll('.form-error').forEach(el => {
            el.textContent = '';
        });
        
        updateEditingState();
    });
    
    // Password modal close handlers
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            passwordModal.style.display = 'none';
            // Reset form
            passwordForm.reset();
            // Clear error messages
            document.querySelectorAll('#passwordModal .form-error').forEach(el => {
                el.textContent = '';
            });
        });
    }
    
    cancelPassword.addEventListener('click', function() {
        passwordModal.style.display = 'none';
        // Reset form
        passwordForm.reset();
        // Clear error messages
        document.querySelectorAll('#passwordModal .form-error').forEach(el => {
            el.textContent = '';
        });
    });
    
    // Close modal if clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === passwordModal) {
            passwordModal.style.display = 'none';
            // Reset form
            passwordForm.reset();
            // Clear error messages
            document.querySelectorAll('#passwordModal .form-error').forEach(el => {
                el.textContent = '';
            });
        }
    });
    
    // Handle password change form submission
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Clear previous error messages
        document.querySelectorAll('#passwordModal .form-error').forEach(el => {
            el.textContent = '';
        });
        
        // Get form data
        const formData = new FormData(this);
        
        // Send AJAX request
        fetch(this.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Close modal and show success message
                passwordModal.style.display = 'none';
                
                // Show done message
                showDoneMessage('Password updated successfully!');
                
                // Reset form
                passwordForm.reset();
            } else {
                // Display errors
                for (const [field, error] of Object.entries(data.errors)) {
                    let errorElement;
                    if (field === 'old_password') {
                        errorElement = document.getElementById('oldPasswordError');
                    } else if (field === 'new_password1') {
                        errorElement = document.getElementById('newPassword1Error');
                    } else if (field === 'new_password2') {
                        errorElement = document.getElementById('newPassword2Error');
                    }
                    
                    if (errorElement) {
                        errorElement.textContent = error;
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
    
    // Show success confirmation
    function showDoneMessage(message) {
        // Create done message element
        const doneMessage = document.createElement('div');
        doneMessage.className = 'done-message';
        doneMessage.innerHTML = `
            <div class="done-icon">
                <i class="bx bx-check"></i>
            </div>
            <p>${message}</p>
        `;
        
        // Append to body
        document.body.appendChild(doneMessage);
        
        // Show animation
        setTimeout(() => {
            doneMessage.classList.add('show');
        }, 100);
        
        // Remove after animation
        setTimeout(() => {
            doneMessage.classList.remove('show');
            setTimeout(() => {
                doneMessage.remove();
            }, 500);
        }, 3000);
    }
    
    // Auto-dismiss alerts after 5 seconds
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.remove();
            }, 500);
        });
    }, 5000);
});