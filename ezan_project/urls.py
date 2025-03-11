
from django.contrib import admin
from django.urls import path,include
from django.urls import include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('users.urls')),
    path('api/', include('api_data.urls')),
    path('quiz/', include('quiz.urls')),
    path('api/', include('progress.urls')),
    path('progress/', include('progress.urls_views')),
    path('social-auth/', include('social_django.urls', namespace='social')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)