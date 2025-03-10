// For show / hide menubar
const body = document.querySelector("body"),
    sidebar = document.querySelector(".sidebar"),
    toggle = document.querySelector(".toggle");

toggle.addEventListener("click", () => {
    sidebar.classList.toggle("close");
});

// Store the vocabulary data globally so we can access it for sorting and filtering
let vocabularyData = [];

// For fetch vocabulary
fetch('/static/data/ezan_words.json')
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        // Store the data globally
        vocabularyData = data;
        
        // Initial display of all data
        displayVocabulary(vocabularyData);
        
        // After data is loaded, set up search and sort
        setupSearchAndSort();
    })
    .catch(function(error) {
        console.error("Error fetching vocabulary:", error);
    });

// Function to display vocabulary items in the table
function displayVocabulary(data) {
    const placeholder = document.querySelector("#data-output");
    let out = "";
    
    data.forEach(function (vocabulary) {
        out += `
            <tr>
                <td>
                    <p class="category ${vocabulary.Category.toLowerCase()}">${vocabulary.Category}</p>
                </td>
                <td>${vocabulary.Word}</td>
                <td>${vocabulary.Pronunciation}</td>
                <td>${vocabulary.Thai}</td>
                <td>${vocabulary.Eng}</td>
            </tr>
        `;
    });

    placeholder.innerHTML = out;
}

// Setup search and sort functionality after data is loaded
function setupSearchAndSort() {
    const search = document.querySelector(".input_group input");
    const table_headings = document.querySelectorAll("thead th");
    
    // Add event listener for search input
    search.addEventListener("input", function() {
        searchVocabulary(this.value);
    });
    
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
}

// Search function that filters the original data and redisplays
function searchVocabulary(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    
    // If search term is empty, show all data
    if (searchTerm === "") {
        displayVocabulary(vocabularyData);
        return;
    }
    
    // Filter the vocabulary data based on search term
    const filteredData = vocabularyData.filter(item => {
        return (
            item.Category.toLowerCase().includes(searchTerm) ||
            item.Word.toLowerCase().includes(searchTerm) ||
            item.Pronunciation.toLowerCase().includes(searchTerm) ||
            item.Thai.toLowerCase().includes(searchTerm) ||
            item.Eng.toLowerCase().includes(searchTerm)
        );
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