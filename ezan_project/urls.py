
from django.contrib import admin
from django.urls import path,include
from django.urls import include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('users.urls')),
    path('api/', include('api_data.urls')),
    path('quiz/', include('quiz.urls')),
    path('api/', include('progress.urls')),
    path('progress/', include('progress.urls_views')),
    path('social-auth/', include('social_django.urls', namespace='social')),
    
    # เพิ่ม URL pattern สำหรับไฟล์ media ที่จะทำงานทั้งใน development และ production
    path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT}),
]

# ยังคงใช้ static function สำหรับ development แต่จะไม่มีผลในโหมด production
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)