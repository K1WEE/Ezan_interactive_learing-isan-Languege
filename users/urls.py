from django.urls import path
from .views import *
from django.contrib.auth.decorators import login_required

urlpatterns = [
    path('', index_view , name='index'),
    path('register/', register_view, name='register'),
    path('login/', login_view, name='login'),
    path('home/', login_required(home_view), name='home'),
    path('logout/', logout_view, name='logout'),
    path('profile/', profile_view, name='profile'),
    path('learn/', learn_view, name='learn'),
    path('profile/change-password/', change_password, name='change_password'),
    path('flashcard/', flashcard_view, name='flashcard'),
]