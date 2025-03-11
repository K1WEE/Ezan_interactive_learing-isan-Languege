
// ฟังก์ชันดึง CSRF token จาก cookie
function getCsrfToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, 'csrftoken='.length) === 'csrftoken=') {
                cookieValue = decodeURIComponent(cookie.substring('csrftoken='.length));
                break;
            }
        }
    }
    return cookieValue;
}

// ฟังก์ชันสำหรับเรียกใช้ API
async function fetchAPI(url, options = {}) {
    const csrftoken = getCsrfToken();
    
    const defaultOptions = {
        credentials: 'same-origin',  // ส่ง cookies
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',  // บ่งชี้ว่าเป็น AJAX request
            'X-CSRFToken': csrftoken
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };
    
    return fetch(url, mergedOptions);
}

// Export ฟังก์ชันเพื่อให้ไฟล์อื่นเรียกใช้
window.fetchAPI = fetchAPI;
window.getCsrfToken = getCsrfToken;