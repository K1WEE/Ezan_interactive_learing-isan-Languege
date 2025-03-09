from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from .views import *

router = routers.DefaultRouter()
router.register(r'scores', ScoreViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'levels', LevelViewSet)


urlpatterns = [
    path('',include(router.urls)),
    path('questions/level/<int:level_id>/', QuestionsByLevelView.as_view(), name='questions-by-level'),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]