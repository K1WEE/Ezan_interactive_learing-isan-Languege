from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers, renderers  # เพิ่ม renderers ตรงนี้
from .views import *

class DefaultRouterWithoutBrowsableAPI(routers.DefaultRouter):
    """
    Router ที่ปิดการแสดง browsable API
    """
    def get_api_root_view(self, *args, **kwargs):
        view = super().get_api_root_view(*args, **kwargs)
        view.cls.renderer_classes = [renderers.JSONRenderer]
        return view

router = DefaultRouterWithoutBrowsableAPI()
router.register(r'scores', ScoreViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'levels', LevelViewSet)
router.register(r'vocabulary', VocabularyViewSet)  

urlpatterns = [
    path('', include(router.urls)),
    path('questions/level/<int:level_id>/', QuestionsByLevelView.as_view(), name='questions-by-level'),
    path('questions/level/<int:level_id>/', QuestionsByLevelView.as_view(), name='questions-by-level'),
    # path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]  # ลบวงเล็บปิดที่ซ้ำตรงนี้