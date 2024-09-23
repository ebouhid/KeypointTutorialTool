let isAnnotating = false;
let isEditing = false;
let annotations = [];
let currentKeypoint = null;
let isDragging = false;
let selectedKeypointDiv = null;

const imageContainer = document.getElementById('image-container');
const toggleModeButton = document.getElementById('toggle-mode');
const toggleEditModeButton = document.getElementById('toggle-edit-mode');
const tooltip = document.getElementById('tooltip');
const keypointForm = document.getElementById('keypoint-form');
const saveKeypointButton = document.getElementById('save-keypoint');
const saveAnnotationsButton = document.getElementById('save-annotations');
const loadAnnotationsInput = document.getElementById('load-annotations');

const image = document.getElementById('image');
image.addEventListener('load', () => {
    adjustKeypointListHeight();
});

// Function to adjust keypoint list height
function adjustKeypointListHeight() {
    const imageHeight = image.clientHeight;
    const keypointListContainer = document.getElementById('keypoint-list-container');
    
    // Subtract some padding or margin if necessary (e.g., 20px)
    keypointListContainer.style.height = `${imageHeight - 20}px`;
}

// Also call the function on window resize to keep things responsive
window.addEventListener('resize', adjustKeypointListHeight);

// Toggle annotation mode
toggleModeButton.addEventListener('click', () => {
    isAnnotating = !isAnnotating;
    isEditing = false;  // Disable editing when annotating
    if (isAnnotating) {
        toggleModeButton.textContent = "Exit Annotation Mode";
        toggleEditModeButton.classList.add('hidden');
        console.log("Annotation mode enabled");
    } else {
        toggleModeButton.textContent = "Toggle Annotation Mode";
        toggleEditModeButton.classList.remove('hidden');
        console.log("Annotation mode disabled");
    }
});

// Toggle edit mode
toggleEditModeButton.addEventListener('click', () => {
    isEditing = !isEditing;
    isAnnotating = false;  // Disable annotation when editing
    if (isEditing) {
        toggleEditModeButton.textContent = "Exit Edit Mode";
        console.log("Edit mode enabled");
    } else {
        toggleEditModeButton.textContent = "Toggle Edit Mode";
        console.log("Edit mode disabled");
        deselectKeypoint();  // Deselect any selected keypoint
    }
});

// Add annotations or select keypoints
imageContainer.addEventListener('click', (event) => {
    if (isAnnotating && !event.target.classList.contains('keypoint')) {
        // Add new keypoint
        const rect = imageContainer.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        console.log("Adding new keypoint:", { x, y });
        keypointForm.classList.remove('hidden');
        currentKeypoint = { x, y };
        keypointForm.style.top = `${event.clientY}px`;
        keypointForm.style.left = `${event.clientX}px`;
    } else if (isEditing && event.target.classList.contains('keypoint')) {
        // Edit existing keypoint
        console.log("Editing keypoint:", event.target);
        selectKeypoint(event.target);
    }
});

function renderKeypoints() {
    // Clear any existing keypoints from the image
    document.querySelectorAll('.keypoint').forEach(kp => kp.remove());

    annotations.forEach(keypoint => {
        const keypointDiv = document.createElement('div');
        keypointDiv.classList.add('keypoint');
        keypointDiv.style.left = `${keypoint.x}px`;
        keypointDiv.style.top = `${keypoint.y}px`;
        keypointDiv.dataset.name = keypoint.name;
        keypointDiv.dataset.description = keypoint.description;

        // Add hover event for showing tooltip
        keypointDiv.addEventListener('mouseenter', (event) => {
            showTooltip(event, keypoint.name, keypoint.description);
        });

        // Add event for hiding tooltip
        keypointDiv.addEventListener('mouseleave', hideTooltip);

        // Add click event to highlight the keypoint and its list entry
        keypointDiv.addEventListener('click', () => {
            highlightKeypoint(keypoint.name);
        });

        // Add keypoint to the image container
        document.getElementById('image-container').appendChild(keypointDiv);
    });
}



// Select keypoint to edit
function selectKeypoint(keypointDiv) {
    deselectKeypoint();  // Deselect any currently selected keypoint

    selectedKeypointDiv = keypointDiv;
    selectedKeypointDiv.classList.add('editing');
    console.log("Selected keypoint for editing:", selectedKeypointDiv);

    // Find keypoint using the unique name
    const keypointName = selectedKeypointDiv.dataset.name;
    const keypoint = annotations.find(k => k.name === keypointName);

    if (keypoint) {
        // Fill the form with the keypoint's current data
        document.getElementById('keypoint-name').value = keypoint.name;
        document.getElementById('keypoint-description').value = keypoint.description;
        keypointForm.classList.remove('hidden');
        console.log("Filled form with keypoint data");
    } else {
        console.error("Keypoint not found in annotations for editing");
    }
}

function updateKeypointList() {
    const keypointList = document.getElementById('keypoint-list');
    keypointList.innerHTML = ''; // Clear the list before updating

    annotations.forEach(keypoint => {
        const listItem = document.createElement('li');
        listItem.textContent = keypoint.name;
        listItem.addEventListener('click', () => highlightKeypoint(keypoint.name));
        keypointList.appendChild(listItem);
    });
}

function highlightKeypoint(keypointName) {
    // Deselect any currently selected keypoint
    deselectKeypoint();

    // Find the keypoint by name
    const keypointDiv = Array.from(document.querySelectorAll('.keypoint')).find(
        kp => kp.dataset.name === keypointName
    );

    if (keypointDiv) {
        // Highlight the selected keypoint
        keypointDiv.classList.add('highlighted');
        console.log(`Highlighted keypoint: ${keypointName}`);

        // Optionally scroll into view (if needed)
        keypointDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        console.error("Keypoint not found for highlighting");
    }
}

// Add some CSS to style the highlighted keypoint
const style = document.createElement('style');
style.innerHTML = `
    .keypoint.highlighted {
        border: 2px solid red;
        box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
    }
`;
document.head.appendChild(style);


// Deselect keypoint
function deselectKeypoint() {
    if (selectedKeypointDiv) {
        selectedKeypointDiv.classList.remove('editing');
    }
    selectedKeypointDiv = null;
    keypointForm.classList.add('hidden');
    console.log("Deselected keypoint");
}

// Drag keypoint to move it
imageContainer.addEventListener('mousedown', (event) => {
    if (isEditing && event.target.classList.contains('keypoint')) {
        isDragging = true;
        selectedKeypointDiv = event.target;
        console.log("Started dragging keypoint");
    }
});

imageContainer.addEventListener('mousemove', (event) => {
    if (isDragging && selectedKeypointDiv) {
        const rect = imageContainer.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        selectedKeypointDiv.style.left = `${x}px`;
        selectedKeypointDiv.style.top = `${y}px`;
        console.log("Dragging keypoint to new position:", { x, y });
    }
});

imageContainer.addEventListener('mouseup', () => {
    if (isDragging && selectedKeypointDiv) {
        const keypoint = annotations.find(
            k => k.name === selectedKeypointDiv.dataset.name
        );

        if (keypoint) {
            keypoint.x = parseFloat(selectedKeypointDiv.style.left);
            keypoint.y = parseFloat(selectedKeypointDiv.style.top);
            console.log("Updated keypoint position:", keypoint);
        }

        isDragging = false;
        console.log("Stopped dragging keypoint");
    }
});

// Save keypoint
saveKeypointButton.addEventListener('click', () => {
    const name = document.getElementById('keypoint-name').value;
    const description = document.getElementById('keypoint-description').value;

    if (name && description) {
        if (selectedKeypointDiv) {
            // Update existing keypoint
            selectedKeypointDiv.dataset.name = name;
            selectedKeypointDiv.dataset.description = description;

            const keypoint = annotations.find(k => k.name === selectedKeypointDiv.dataset.name);
            keypoint.name = name;
            keypoint.description = description;
            console.log("Updated keypoint:", keypoint);
        } else if (currentKeypoint) {
            // Save new keypoint
            currentKeypoint.name = name;
            currentKeypoint.description = description;
            annotations.push(currentKeypoint);
            console.log("Saved new keypoint:", currentKeypoint);

            // Create new keypoint div
            const keypointDiv = document.createElement('div');
            keypointDiv.classList.add('keypoint');
            keypointDiv.style.top = `${currentKeypoint.y}px`;
            keypointDiv.style.left = `${currentKeypoint.x}px`;
            keypointDiv.dataset.name = currentKeypoint.name;
            keypointDiv.dataset.description = currentKeypoint.description;

            imageContainer.appendChild(keypointDiv);
            addTooltipListeners(keypointDiv);
        }

        // Clear form
        deselectKeypoint();
        currentKeypoint = null;
        document.getElementById('keypoint-name').value = '';
        document.getElementById('keypoint-description').value = '';

        // Update keypoint list
        updateKeypointList();
    }
});

// Save annotations to file
saveAnnotationsButton.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(annotations)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.json';
    a.click();
    URL.revokeObjectURL(url);
    console.log("Annotations saved to file");
});

// Load annotations from file
loadAnnotationsInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const contents = e.target.result;
        annotations = JSON.parse(contents); // Load the annotations array
        renderKeypoints(); // Render them on the image
        updateKeypointList(); // Update the list with the keypoints
    };

    reader.readAsText(file);
});


// Add tooltips
function addTooltipListeners(keypoint) {
    keypoint.addEventListener('mouseenter', function() {
        tooltip.innerHTML = `<strong>${this.dataset.name}</strong>: ${this.dataset.description}`;
        tooltip.style.display = 'block';
        tooltip.style.top = `${this.offsetTop - 20}px`;
        tooltip.style.left = `${this.offsetLeft + 15}px`;
        console.log("Displayed tooltip for keypoint");
    });

    keypoint.addEventListener('mouseleave', function() {
        tooltip.style.display = 'none';
        console.log("Hid tooltip for keypoint");
    });
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = 'none';
}

function showTooltip(event, name, description) {
    const tooltip = document.getElementById('tooltip');
    tooltip.innerHTML = `<strong>${name}</strong><br>${description}`;
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
}

function highlightKeypoint(keypointName) {
    // Clear previous highlights from keypoints
    document.querySelectorAll('.keypoint').forEach(kp => kp.classList.remove('highlighted'));

    // Clear previous highlights from the list
    document.querySelectorAll('#keypoint-list li').forEach(li => li.classList.remove('highlighted'));

    // Highlight the selected keypoint on the image
    const keypointDiv = document.querySelector(`.keypoint[data-name="${keypointName}"]`);
    if (keypointDiv) {
        keypointDiv.classList.add('highlighted');
    }

    // Highlight the corresponding entry in the keypoint list
    const listItem = Array.from(document.querySelectorAll('#keypoint-list li'))
        .find(li => li.textContent === keypointName);
    if (listItem) {
        listItem.classList.add('highlighted');
    }
}
