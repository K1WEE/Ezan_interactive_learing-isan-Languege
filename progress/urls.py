from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserProgressViewSet, QuestionAttemptViewSet

router = DefaultRouter()
router.register(r'progress', UserProgressViewSet, basename='progress')
router.register(r'attempts', QuestionAttemptViewSet, basename='attempts')

urlpatterns = [
    path('', include(router.urls)),
]