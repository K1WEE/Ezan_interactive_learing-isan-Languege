// For show / hide menubar
const body = document.querySelector("body"),
    sidebar = document.querySelector(".sidebar"),
    toggle = document.querySelector(".toggle");

toggle.addEventListener("click", () => {
    sidebar.classList.toggle("close");
});

// Store the vocabulary data globally so we can access it for sorting and filtering
let vocabularyData = [];
// เพิ่มตัวแปรสำหรับแสดงสถานะการโหลด
const tableBody = document.querySelector("#data-output");

// แสดงตัวโหลดระหว่างรอข้อมูล
tableBody.innerHTML = `
    <tr>
        <td colspan="5" style="text-align: center; padding: 40px;">
            <div style="display: inline-block; width: 50px; height: 50px; border: 5px solid #f3f3f3; 
                  border-top: 5px solid #FF7BAC; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 20px;">กำลังโหลดข้อมูลคำศัพท์...</p>
        </td>
    </tr>
`;

// CSS animation for spinner
const style = document.createElement('style');
style.innerHTML = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// For fetch vocabulary from API
fetch('/api/vocabulary/', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
})
.then(function (response) {
    if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.status);
    }
    return response.json();
})
.then(function (data) {
    console.log('Data loaded from API:', data);
    
    // แปลงข้อมูลจาก API ให้เข้ากับรูปแบบเดิม
    vocabularyData = data.map(item => ({
        Category: item.category,
        Word: item.word,
        Pronunciation: item.pronunciation,
        Thai: item.thai_translation,
        Eng: item.english_translation,
        SoundFileUrl: item.sound_file_url
    }));
    
    // Initial display of all data
    displayVocabulary(vocabularyData);
    
    // After data is loaded, set up search and sort
    setupSearchAndSort();
})
.catch(function(error) {
    console.error("Error fetching vocabulary:", error);
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 40px; color: #dc3545;">
                <i class="bx bx-error-circle" style="font-size: 48px;"></i>
                <p style="margin-top: 20px;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                <p>${error.message}</p>
                <button id="retryButton" style="margin-top: 20px; padding: 8px 16px; background-color: #FF7BAC; 
                       color: white; border: none; border-radius: 4px; cursor: pointer;">
                    ลองใหม่
                </button>
            </td>
        </tr>
    `;
    
    // เพิ่มปุ่มลองใหม่
    document.getElementById('retryButton')?.addEventListener('click', function() {
        window.location.reload();
    });
});

// Function to display vocabulary items in the table
function displayVocabulary(data) {
    let out = "";
    
    if (data.length === 0) {
        out = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    <i class="bx bx-search" style="font-size: 48px; color: #666;"></i>
                    <p style="margin-top: 20px; color: #666;">ไม่พบคำศัพท์ที่ตรงกับการค้นหา</p>
                </td>
            </tr>
        `;
    } else {
        data.forEach(function (vocabulary) {
            // สร้างปุ่มเล่นเสียงถ้ามีไฟล์เสียง
            let soundButton = '';
            if (vocabulary.SoundFileUrl) {
                soundButton = `
                    <button class="sound-button" data-sound="${vocabulary.SoundFileUrl}">
                        <i class="bx bx-volume-full"></i>
                    </button>
                `;
            }
            
            out += `
                <tr>
                    <td>
                        <p class="category ${vocabulary.Category.toLowerCase()}">${vocabulary.Category}</p>
                    </td>
                    <td>${vocabulary.Word} ${soundButton}</td>
                    <td>${vocabulary.Pronunciation}</td>
                    <td>${vocabulary.Thai}</td>
                    <td>${vocabulary.Eng}</td>
                </tr>
            `;
        });
    }

    tableBody.innerHTML = out;
    
    // เพิ่ม event listener สำหรับปุ่มเล่นเสียง
    setupSoundButtons();
}

// เพิ่มฟังก์ชันสำหรับตั้งค่าปุ่มเล่นเสียง
function setupSoundButtons() {
    document.querySelectorAll('.sound-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const soundUrl = this.dataset.sound;
            if (soundUrl) {
                // เพิ่ม class playing ให้ปุ่มเพื่อแสดงว่ากำลังเล่นเสียง
                this.classList.add('playing');
                
                const audio = new Audio(soundUrl);
                
                // เมื่อเสียงเล่นจบ ลบ class playing ออก
                audio.onended = () => {
                    this.classList.remove('playing');
                };
                
                // เมื่อเกิดข้อผิดพลาด ลบ class playing ออกเช่นกัน
                audio.onerror = () => {
                    console.error('Error playing sound');
                    this.classList.remove('playing');
                };
                
                audio.play().catch(error => {
                    console.error('Error playing sound:', error);
                    this.classList.remove('playing');
                });
            }
        });
    });
}

// Setup search and sort functionality after data is loaded
function setupSearchAndSort() {
    const search = document.querySelector(".input_group input");
    const table_headings = document.querySelectorAll("thead th");
    const categoryFilter = document.getElementById("category-filter");
    
    // Add event listener for search input
    search.addEventListener("input", function() {
        applyFilters();
    });
    
    // Add event listener for category filter
    if (categoryFilter) {
        categoryFilter.addEventListener("change", function() {
            applyFilters();
        });
    }
    
    // Add event listeners for column headers
    table_headings.forEach((head, i) => {
        let sort_asc = true;
        head.onclick = () => {
            // Remove active class from all headers
            table_headings.forEach(h => h.classList.remove("active"));
            // Add active class to clicked header
            head.classList.add("active");
            
            // Toggle sort direction
            head.classList.toggle("asc", sort_asc);
            sort_asc = !(head.classList.contains("asc"));
            
            // Get the column name to sort by
            const columnIndex = i;
            sortVocabulary(columnIndex, sort_asc);
        };
    });
    
    // ฟังก์ชันสำหรับการใช้ทั้งตัวกรองและการค้นหาพร้อมกัน
    function applyFilters() {
        const searchTerm = search.value.toLowerCase();
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        
        // กรองข้อมูลตามเงื่อนไขทั้งหมด
        const filteredData = vocabularyData.filter(item => {
            // เงื่อนไขการค้นหา
            const matchesSearch = 
                searchTerm === '' || 
                item.Category.toLowerCase().includes(searchTerm) ||
                item.Word.toLowerCase().includes(searchTerm) ||
                item.Pronunciation.toLowerCase().includes(searchTerm) ||
                item.Thai.toLowerCase().includes(searchTerm) ||
                item.Eng.toLowerCase().includes(searchTerm);
            
            // เงื่อนไขการกรองตามหมวดหมู่
            const matchesCategory = 
                selectedCategory === '' || 
                item.Category === selectedCategory;
            
            // ต้องตรงตามเงื่อนไขทั้งหมด
            return matchesSearch && matchesCategory;
        });
        
        // แสดงผลลัพธ์
        displayVocabulary(filteredData);
        
        // Apply alternating row background for better readability
        document.querySelectorAll("tbody tr").forEach((row, i) => {
            row.style.backgroundColor = (i % 2 === 0) ? "transparent" : "#0000000b";
            // Add animation delay for smoother appearance
            row.style.setProperty("--delay", i / 25 + "s");
        });
    }
}

// ไม่จำเป็นต้องใช้ฟังก์ชัน searchVocabulary อีกต่อไป เนื่องจากถูกแทนด้วย applyFilters ในฟังก์ชัน setupSearchAndSort แล้ว
// แต่เราจะเก็บไว้เพื่อความเข้ากันได้กับโค้ดเดิม
function searchVocabulary(searchTerm) {
    const categoryFilter = document.getElementById("category-filter");
    const selectedCategory = categoryFilter ? categoryFilter.value : '';
    
    searchTerm = searchTerm.toLowerCase();
    
    // กรองข้อมูลตามเงื่อนไขทั้งหมด
    const filteredData = vocabularyData.filter(item => {
        // เงื่อนไขการค้นหา
        const matchesSearch = 
            searchTerm === '' || 
            item.Category.toLowerCase().includes(searchTerm) ||
            item.Word.toLowerCase().includes(searchTerm) ||
            item.Pronunciation.toLowerCase().includes(searchTerm) ||
            item.Thai.toLowerCase().includes(searchTerm) ||
            item.Eng.toLowerCase().includes(searchTerm);
        
        // เงื่อนไขการกรองตามหมวดหมู่
        const matchesCategory = 
            selectedCategory === '' || 
            item.Category === selectedCategory;
        
        // ต้องตรงตามเงื่อนไขทั้งหมด
        return matchesSearch && matchesCategory;
    });
    
    // Display filtered data
    displayVocabulary(filteredData);
    
    // Apply alternating row background for better readability
    document.querySelectorAll("tbody tr").forEach((row, i) => {
        row.style.backgroundColor = (i % 2 === 0) ? "transparent" : "#0000000b";
        // Add animation delay for smoother appearance
        row.style.setProperty("--delay", i / 25 + "s");
    });
}

// Sort function that sorts the data and redisplays
function sortVocabulary(columnIndex, ascending) {
    // Map column index to property name
    const propertyMap = {
        0: "Category",
        1: "Word",
        2: "Pronunciation",
        3: "Thai",
        4: "Eng"
    };
    
    const property = propertyMap[columnIndex];
    
    // If property doesn't exist, do nothing
    if (!property) return;
    
    // Sort the data
    const sortedData = [...vocabularyData].sort((a, b) => {
        const aValue = a[property].toLowerCase();
        const bValue = b[property].toLowerCase();
        
        if (ascending) {
            return aValue.localeCompare(bValue);
        } else {
            return bValue.localeCompare(aValue);
        }
    });
    
    // Display sorted data
    displayVocabulary(sortedData);
    
    // Add active class to sorted column cells
    document.querySelectorAll("td").forEach(td => td.classList.remove("active"));
    document.querySelectorAll(`tbody tr`).forEach((row) => {
        row.querySelectorAll("td")[columnIndex].classList.add("active");
    });
}