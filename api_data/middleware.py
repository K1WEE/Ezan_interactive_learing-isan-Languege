
class APIAccessMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # ตรวจสอบเฉพาะ request ที่เข้าถึง API
        if request.path.startswith('/api/'):
            # ตรวจสอบว่าเป็น AJAX request หรือไม่
            is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
            # ตรวจสอบว่าเป็น admin หรือไม่
            is_admin = request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)
            
            # ถ้าไม่ใช่ AJAX request และไม่ใช่ admin ให้ปฏิเสธการเข้าถึง
            if not is_ajax and not is_admin:
                from django.http import HttpResponseForbidden
                return HttpResponseForbidden("API เข้าถึงได้เฉพาะจาก JavaScript หรือผู้ดูแลระบบเท่านั้น")
        
        response = self.get_response(request)
        return response