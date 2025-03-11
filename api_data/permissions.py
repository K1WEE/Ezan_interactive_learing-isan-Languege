# ใน api_data/permissions.py

from rest_framework import permissions

class IsAuthenticatedAjaxOrAdmin(permissions.BasePermission):
    """
    อนุญาตให้เข้าถึง API ได้เฉพาะกรณีที่:
    1. เป็น admin/superuser
    2. เป็น AJAX request จาก JavaScript ในเว็บไซต์
    """
    def has_permission(self, request, view):
        # ต้อง authenticate ก่อนเสมอ
        if not request.user.is_authenticated:
            return False
        
        # admin/superuser สามารถเข้าถึงได้ทุกประเภท request
        if request.user.is_superuser or request.user.is_staff:
            return True
            
        # ตรวจสอบว่าเป็น AJAX request หรือไม่
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        # อนุญาตให้ดูข้อมูลได้ (GET) หากเป็น AJAX request
        if request.method in permissions.SAFE_METHODS and is_ajax:
            return True
            
        # สำหรับการแก้ไข (POST, PUT, DELETE) ต้องเป็น AJAX request
        return request.method == 'POST' and is_ajax