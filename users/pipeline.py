def set_user_first_name(backend, user, response, *args, **kwargs):
    """
    Pipeline เพื่อตั้งค่าชื่อผู้ใช้จากข้อมูล Google
    """
    if backend.name == 'google-oauth2':
        if not user.first_name and response.get('given_name'):
            user.first_name = response.get('given_name')
            user.save()
        
        if not user.email and response.get('email'):
            user.email = response.get('email')
            user.save()
    
    return None