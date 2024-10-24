// Function to save replacement pairs to storage
function saveReplacements(replacements) {
    chrome.storage.sync.set({ 'replacements': replacements }, function() {
        console.log('Replacements saved.');
    });
}

// Function to load replacement pairs from storage
function loadReplacements(callback) {
    browser.storage.sync.get('replacements').then(function(items) {
        callback(items.replacements || []);
    });
}

// Function to render the list of replacement pairs
function renderReplacements(replacements) {
    const list = document.getElementById('replacementList');
    list.innerHTML = '';

    replacements.forEach(function(replacement, index) {
        const item = document.createElement('li');
        item.className = 'replacement-item';

        const fromInput = document.createElement('input');
        fromInput.type = 'text';
        fromInput.value = replacement.fromURL;
        fromInput.placeholder = 'From URL';
        fromInput.disabled = true;

        const toInput = document.createElement('input');
        toInput.type = 'text';
        toInput.value = replacement.toURL;
        toInput.placeholder = 'To URL';
        toInput.disabled = true;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';

        deleteButton.addEventListener('click', function() {
            replacements.splice(index, 1);
            saveReplacements(replacements);
            renderReplacements(replacements);
        });

        item.appendChild(fromInput);
        item.appendChild(toInput);
        item.appendChild(deleteButton);

        list.appendChild(item);
    });
}

// Add event listener to the Add button
document.getElementById('addButton').addEventListener('click', function() {
    const fromURL = document.getElementById('fromURL').value.trim();
    const toURL = document.getElementById('toURL').value.trim();

    if (fromURL && toURL) {
        loadReplacements(function(replacements) {
            replacements.push({ fromURL: fromURL, toURL: toURL });
            saveReplacements(replacements);
            renderReplacements(replacements);

            // Clear input fields
            document.getElementById('fromURL').value = '';
            document.getElementById('toURL').value = '';
        });
    }
});

// Load and render replacements on page load
document.addEventListener('DOMContentLoaded', function() {
    loadReplacements(function(replacements) {
        renderReplacements(replacements);
    });
});
