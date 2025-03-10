from rest_framework import permissions

class IsSuperuserOrReadOnly(permissions.BasePermission):
    """
    อนุญาตให้ superuser เท่านั้นที่สามารถแก้ไขข้อมูลได้ (POST, PUT, DELETE)
    ส่วนการอ่านข้อมูล (GET) ต้องล็อกอินแล้วเท่านั้น
    """
    def has_permission(self, request, view):
        # ต้อง authenticate ก่อนเสมอ
        if not request.user.is_authenticated:
            return False
        
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest' # post only javascript requests
            
        # อนุญาตให้ดูข้อมูลได้ (GET, HEAD, OPTIONS) หากล็อกอินแล้ว
        if request.method in permissions.SAFE_METHODS:
            return True

        if request.method == 'POST' and is_ajax:
            return True
            
        # สำหรับการแก้ไข อนุญาตเฉพาะ superuser
        return request.user.is_superuser