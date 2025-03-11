from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm,PasswordChangeForm

class UserRegistrationForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'input-field',
            'placeholder': 'Email',
        })
    )
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']
        widgets = {
            'username': forms.TextInput(attrs={
                'class': 'input-field',
                'placeholder': 'Username',
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].widget = forms.PasswordInput(attrs={
            'class': 'input-field',
            'placeholder': 'Password',
            'id': 'password',
        })
        self.fields['password2'].widget = forms.PasswordInput(attrs={
            'class': 'input-field',
            'placeholder': 'Confirm Password',
            'id': 'confirmPassword',
        })
        
        for field in ['username', 'password1', 'password2']:
            self.fields[field].help_text = None
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('this email is already registered')
        return email
    def save(self, commit=True):
        user = super().save(commit=False)
        user.first_name = user.username  # Set first_name to username
        if commit:
            user.save()
        return user

class UserUpdateForm(forms.ModelForm):
    """Form to update user information"""
    class Meta:
        model = User
        fields = ['first_name', 'email']
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['first_name'].widget.attrs.update({'class': 'form-control'})
        self.fields['email'].widget.attrs.update({'class': 'form-control'})

class CustomPasswordChangeForm(PasswordChangeForm):
    """Custom password change form with styling"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['old_password'].widget.attrs.update({'class': 'form-control'})
        self.fields['new_password1'].widget.attrs.update({'class': 'form-control'})
        self.fields['new_password2'].widget.attrs.update({'class': 'form-control'})