from django.urls import path
from .views import *

urlpatterns = [
    path('', quiz_view, name='quiz'),
]