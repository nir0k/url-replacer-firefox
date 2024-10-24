// Function to escape special characters in a string for use in a regular expression
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to replace URLs in text nodes
function replaceURLsInTextNode(node, replacements) {
    let text = node.textContent;
    let newText = text;
    let replaced = false;

    replacements.forEach(function(repl) {
        if (newText.includes(repl.fromURL)) {
            let escapedFromURL = escapeRegExp(repl.fromURL);
            let regex = new RegExp(escapedFromURL, 'g');
            newText = newText.replace(regex, repl.toURL);
            replaced = true;
            console.log(`Replaced ${repl.fromURL} with ${repl.toURL} in text node`);
        }
    });

    if (replaced && newText !== text) {
        node.textContent = newText;
        console.log('Replaced text in node:', newText);
    }
}

// Function to handle paste events
function handlePaste(event) {
    console.log('handlePaste called');

    // Get data from the clipboard
    let clipboardData = event.clipboardData || window.clipboardData;
    let pastedData = clipboardData.getData('Text');
    console.log('pastedData:', pastedData);

    // Get replacements from storage
    browser.storage.sync.get('replacements').then(function(items) {
        let replacements = items.replacements || [];

        let shouldReplace = false;

        // Check if any replacement applies
        replacements.forEach(function(replacement) {
            if (pastedData.includes(replacement.fromURL)) {
                shouldReplace = true;
            }
        });

        if (shouldReplace) {
            console.log('URL to replace found in pasted data');

            // Allow the paste to occur first
            // Delay replacement to let paste happen
            setTimeout(function() {
                if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                    // For input and textarea elements
                    let value = event.target.value;
                    console.log('Input value after paste:', value);

                    // Apply all replacements
                    replacements.forEach(function(repl) {
                        let escapedFromURL = escapeRegExp(repl.fromURL);
                        let regex = new RegExp(escapedFromURL, 'g');
                        if (regex.test(value)) {
                            console.log(`Replacing ${repl.fromURL} with ${repl.toURL} in input`);
                            value = value.replace(regex, repl.toURL);
                        }
                    });

                    event.target.value = value;
                    console.log('New input value:', event.target.value);
                } else if (event.target.isContentEditable) {
                    // For contentEditable elements
                    console.log('Processing contentEditable element');
                    let element = event.target;

                    // Function to recursively traverse and replace in text nodes
                    function traverse(node) {
                        if (node.nodeType === Node.TEXT_NODE) {
                            replaceURLsInTextNode(node, replacements);
                        } else {
                            node.childNodes.forEach(function(child) {
                                traverse(child);
                            });
                        }
                    }

                    traverse(element);
                    console.log('New element content:', element.innerHTML);
                } else {
                    console.log('Unable to determine element type for replacement');
                }
            }, 0); // Minimal delay
        } else {
            console.log('No replacements needed');
        }
    });
}

// Function to set up MutationObserver for contentEditable elements
function setupMutationObserver(element, replacements) {
    const observer = new MutationObserver(function(mutationsList) {
        mutationsList.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        replaceURLsInTextNode(node, replacements);
                    } else {
                        // If the added node is an element, traverse its children
                        node.childNodes.forEach(function(child) {
                            if (child.nodeType === Node.TEXT_NODE) {
                                replaceURLsInTextNode(child, replacements);
                            } else {
                                traverse(child, replacements);
                            }
                        });
                    }
                });
            }
        });
    });

    // Start observing the element for changes in its children
    observer.observe(element, { childList: true, subtree: true });

    console.log('MutationObserver set up for element:', element);
}

// Function to traverse nodes recursively (used in MutationObserver)
function traverse(node, replacements) {
    if (node.nodeType === Node.TEXT_NODE) {
        replaceURLsInTextNode(node, replacements);
    } else {
        node.childNodes.forEach(function(child) {
            traverse(child, replacements);
        });
    }
}

// Add event listeners to all text fields
document.addEventListener('focusin', function(event) {
    if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable
    ) {
        console.log('Adding paste event listener to element', event.target);
        event.target.addEventListener('paste', handlePaste);

        // Also set up MutationObserver
        browser.storage.sync.get('replacements').then(function(items) {
            let replacements = items.replacements || [];
            setupMutationObserver(event.target, replacements);
        });
    }
});

document.addEventListener('focusout', function(event) {
    if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable
    ) {
        console.log('Removing paste event listener from element', event.target);
        event.target.removeEventListener('paste', handlePaste);
        // Note: MutationObserver is not disconnected here for simplicity
    }
});
