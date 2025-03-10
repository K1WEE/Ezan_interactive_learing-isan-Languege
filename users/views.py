from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout,update_session_auth_hash
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from .forms import *

# Create your views here.
def login_view(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        rememberMe = request.POST.get('rememberMe') 
        if user is not None:
            login(request, user)
            if rememberMe : 
                request.session.set_expiry(1209600) 
            else :
                request.session.set_expiry(0)
            return redirect('home')
        else :
            messages.error(request, 'Invalid username or password')
            return redirect('login')
    return render(request, 'accounts/login.html')

def register_view(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        
        if form.is_valid():
            user = form.save()
            #  auto login
            login(request, user)
            messages.success(request, 'สร้างบัญชีสำเร็จ!')
            request.session.set_expiry(1800)
            return redirect('home')
        else:
            # display error message
            for field,errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"{error}")
    else:
        form = UserRegistrationForm()
    return render(request, 'accounts/register.html', {'form': form})

def home_view(request):
    return render(request, 'home.html')

def index_view(request):
    if request.user.is_authenticated :
        return home_view(request)
    return render(request, 'index.html')

def logout_view(request):
    logout(request)
    return redirect('login')

@login_required
def profile_view(request):
    """View for displaying and updating user profile"""
    if request.method == 'POST':
        if 'password_update' in request.POST:
            # Handle password update
            password_form = CustomPasswordChangeForm(request.user, request.POST)
            if password_form.is_valid():
                user = password_form.save()
                update_session_auth_hash(request, user)  # Important to maintain the user's session
                messages.success(request, 'Your password was successfully updated!')
                return redirect('profile')
            else:
                messages.error(request, 'Please correct the errors below.')
                return render(request, 'profile.html', {'password_form': password_form})
        else:
            # Handle profile info update
            user_form = UserUpdateForm(request.POST, instance=request.user)
            if user_form.is_valid():
                user_form.save()
                messages.success(request, 'Your profile has been updated!')
                return redirect('profile')
            else:
                messages.error(request, 'Please correct the errors below.')
    else:
        # Initialize forms
        user_form = UserUpdateForm(instance=request.user)
        password_form = CustomPasswordChangeForm(request.user)
    
    return render(request, 'accounts/profile.html', {
        'user_form': user_form,
        'password_form': password_form
    })

@login_required
def change_password(request):
    """View for handling password change via AJAX"""
    if request.method == 'POST':
        form = CustomPasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            return JsonResponse({'status': 'success', 'message': 'Password updated successfully!'})
        else:
            errors = {field: error[0] for field, error in form.errors.items()}
            return JsonResponse({'status': 'error', 'errors': errors})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def learn_view(request):
    return render(request, 'learn.html')