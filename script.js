let gridSize = 16;
let color = "#000000";
let tool = "pen";
let isDrawing = false;
let pixels = [];

let undoStack = [];
let redoStack = [];

document.getElementById("colorPicker").addEventListener("input", (e) => {
    color = e.target.value;
});

function setTool(selectedTool) {
    tool = selectedTool;
}

function setGridSize(size) {
    gridSize = size;
    createCanvas();
    adjustCameraForGridSize();
}

function adjustCameraForGridSize() {
    // Adjust camera position based on grid size
    switch(gridSize) {
        case 8:
            camera.position.set(6, 6, 25); // Adjusted for better 8x8 view
            break;
        case 16:
            camera.position.set(7, 7, 35); // Adjusted for better 16x16 view
            break;
        case 32:
            camera.position.set(8, 8, 45); // Keep the working 32x32 settings
            break;
    }
    camera.lookAt(0, 0, 0);
    
    // Force an immediate update of the 3D preview
    update3DPreview();
}

function createCanvas() {
    const pixelCanvas = document.getElementById("pixelCanvas");
    pixelCanvas.innerHTML = "";
    pixelCanvas.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    pixelCanvas.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    pixels = [];
    undoStack = [];
    redoStack = [];

    for (let i = 0; i < gridSize * gridSize; i++) {
        const pixel = document.createElement("div");
        pixel.classList.add("pixel");
        pixel.style.backgroundColor = "transparent";

        pixel.addEventListener("mousedown", (e) => {
            e.preventDefault(); // Prevent default to avoid text selection
            isDrawing = true;
            saveState();
            handlePixelClick(e.target, i);
        });

        pixel.addEventListener("mouseover", (e) => {
            e.preventDefault(); // Prevent default to avoid text selection
            if (isDrawing) {
                handlePixelClick(e.target, i);
            }
        });

        pixelCanvas.appendChild(pixel);
        pixels.push(pixel);
    }

    // Add mouseup and mouseleave events to the document
    document.addEventListener("mouseup", () => {
        isDrawing = false;
    });

    // Prevent drawing when mouse leaves the canvas
    pixelCanvas.addEventListener("mouseleave", () => {
        isDrawing = false;
    });

    saveState();
}

function handlePixelClick(pixel, index) {
    if (tool === "pen") {
        pixel.style.backgroundColor = color;
    } else if (tool === "eraser") {
        pixel.style.backgroundColor = "transparent";
    } else if (tool === "fill") {
        fillArea(index);
    }
}

function fillArea(index) {
    const targetColor = pixels[index].style.backgroundColor;
    if (targetColor === color || !pixels[index]) return;

    const queue = [index];
    const visited = new Set();

    while (queue.length > 0) {
        const currentIndex = queue.shift();
        if (visited.has(currentIndex)) continue;

        const currentPixel = pixels[currentIndex];
        if (!currentPixel || currentPixel.style.backgroundColor !== targetColor) continue;

        currentPixel.style.backgroundColor = color;
        visited.add(currentIndex);

        const neighbors = getNeighbors(currentIndex);
        queue.push(...neighbors);
    }
}

function getNeighbors(index) {
    const neighbors = [];
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    if (row > 0) neighbors.push(index - gridSize);
    if (row < gridSize - 1) neighbors.push(index + gridSize);
    if (col > 0) neighbors.push(index - 1);
    if (col < gridSize - 1) neighbors.push(index + 1);

    return neighbors;
}

function clearCanvas() {
    if (confirm("Are you sure you want to clear the canvas? This cannot be undone.")) {
        createCanvas();
        update3DPreview();
    }
}

function saveMaker() {
    let makerTitle = document.getElementById("makerTitle").value.trim();

    if (!makerTitle) {
        alert("Please enter a Maker title!");
        return;
    }
    if (makerTitle.includes(" ")) {
        alert("Maker title cannot contain spaces!");
        return;
    }

    const pixelCanvas = document.getElementById("pixelCanvas");
    const pixels = pixelCanvas.querySelectorAll('.pixel');

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = gridSize;
    exportCanvas.height = gridSize;
    const ctx = exportCanvas.getContext("2d");

    for (let i = 0; i < gridSize * gridSize; i++) {
        const pixel = pixels[i];
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;

        ctx.fillStyle = pixel.style.backgroundColor || "#ffffff";
        ctx.fillRect(col, row, 1, 1);
    }

    const link = document.createElement("a");
    link.href = exportCanvas.toDataURL("image/png");
    link.download = `${makerTitle}.png`;
    link.click();
}

function createTpack() {
    let title = document.getElementById("tpackTitle").value.trim();

    if (!title) {
        alert("Please enter a Tpack title!");
        return;
    }
    if (title.includes(" ")) {
        alert("Tpack title cannot contain spaces!");
        return;
    }

    const folders = ["css", "models", "Skyboxes", "textures"];
    const zip = new JSZip();
    const mainFolder = zip.folder(title);

    folders.forEach(folder => {
        mainFolder.folder(folder);
    });

    zip.generateAsync({ type: "blob" }).then(content => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${title}.zip`;
        link.click();
    });
}

function saveState() {
    const state = Array.from(document.querySelectorAll('.pixel')).map(pixel => pixel.style.backgroundColor || "transparent");
    undoStack.push(state);
    redoStack = [];
}

function restoreState(state) {
    if (!state) return;

    const pixels = document.querySelectorAll('.pixel');
    state.forEach((color, index) => {
        pixels[index].style.backgroundColor = color;
    });
}

function undo() {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        restoreState(undoStack[undoStack.length - 1]);
    }
}

function redo() {
    if (redoStack.length > 0) {
        const state = redoStack.pop();
        undoStack.push(state);
        restoreState(state);
    }
}

document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.key === "z") {
        event.preventDefault();
        undo();
    }
    if (event.ctrlKey && event.key === "y") {
        event.preventDefault();
        redo();
    }
});

function attachPixelEventListeners() {
    document.querySelectorAll('.pixel').forEach(pixel => {
        pixel.addEventListener("mousedown", function() {
            saveState();
        });
    });
}

function triggerImageUpload() {
    document.getElementById('imageInput').click();
}

function previewImage(event) {
    const imagePreview = document.getElementById('imagePreview');
    const imageHolder = document.getElementById('imageHolder');
    const dragText = imageHolder.querySelector('span');

    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            dragText.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

const imageHolder = document.getElementById('imageHolder');
imageHolder.addEventListener('dragover', (event) => {
    event.preventDefault();
    imageHolder.classList.add('dragover');
});

imageHolder.addEventListener('drop', (event) => {
    event.preventDefault();
    imageHolder.classList.remove('dragover');

    const file = event.dataTransfer.files[0];
    previewImage({ target: { files: [file] } });
});

createCanvas();


// Load items from items.txt
async function loadItems() {
    try {
        const response = await fetch("items.txt");
        const text = await response.text();
        const items = text.split("\n").map(item => item.trim()).filter(item => item);
        
        const itemsList = document.getElementById("itemsList");
        itemsList.innerHTML = ""; 

        items.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            li.addEventListener("click", () => copyToClipboard(item));
            itemsList.appendChild(li);
        });
    } catch (error) {
        console.error("Error loading items:", error);
    }
}

// Copy item to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const copyMessage = document.getElementById("copyMessage");
        copyMessage.style.display = "block";

        setTimeout(() => {
            copyMessage.style.display = "none";
        }, 1000);
    });
}

// Filter items in the list
function filterItems() {
    const searchValue = document.getElementById("searchBar").value.toLowerCase();
    const items = document.querySelectorAll("#itemsList li");

    items.forEach(item => {
        if (item.textContent.toLowerCase().includes(searchValue)) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }
    });
}

// Load items on page load
document.addEventListener("DOMContentLoaded", loadItems);


let scene, camera, renderer, voxelGroup, block;
let mode = "item"; // Default mode

// Initialize 3D Preview
function init3DPreview() {
    const previewContainer = document.getElementById("previewContainer");
    previewContainer.innerHTML = ""; // Clear previous preview

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(300, 300); // Adjust size
    previewContainer.appendChild(renderer.domElement);

    // Set initial camera position based on default grid size
    adjustCameraForGridSize();

    // Lighting
    const light = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(light);

    voxelGroup = new THREE.Group();
    scene.add(voxelGroup);

    animate3DPreview();
}

// Function to Convert Pixel Canvas to 3D Voxels
function update3DPreview() {
    if (!voxelGroup) return; // Guard clause to prevent errors
    
    voxelGroup.clear();

    if (mode === "item") {
        pixels.forEach((pixel, index) => {
            if (pixel.style.backgroundColor !== "transparent") {
                const row = Math.floor(index / gridSize);
                const col = index % gridSize;

                const voxel = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshStandardMaterial({ color: pixel.style.backgroundColor })
                );

                // Adjust scale based on grid size
                const scale = gridSize === 32 ? 0.5 : gridSize === 16 ? 0.75 : 1;
                voxel.scale.set(scale, scale, scale);
                
                const xPos = (col - gridSize / 2) * scale;
                const yPos = (gridSize / 2 - row) * scale;
                voxel.position.set(xPos, yPos, 0);
                
                voxelGroup.add(voxel);
            }
        });
    } else {
        createBlockWithDrawing();
    }
}

// Function to Create Cube with Drawings
function createBlockWithDrawing() {
    voxelGroup.clear();

    const cubeSize = gridSize / 2;
    const blockGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

    const materials = [];
    for (let i = 0; i < 6; i++) {
        const texture = new THREE.CanvasTexture(generateCanvasTexture());
        materials.push(new THREE.MeshBasicMaterial({ map: texture }));
    }

    block = new THREE.Mesh(blockGeometry, materials);
    voxelGroup.add(block);
}

// Function to Generate Canvas Texture from Pixel Grid
function generateCanvasTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = gridSize;
    canvas.height = gridSize;
    const ctx = canvas.getContext("2d");

    pixels.forEach((pixel, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        ctx.fillStyle = pixel.style.backgroundColor || "#000000";
        ctx.fillRect(col, row, 1, 1);
    });

    return canvas;
}

// Animation loop
function animate3DPreview() {
    requestAnimationFrame(animate3DPreview);
    voxelGroup.rotation.y += 0.01; // Slow rotation
    renderer.render(scene, camera);
}

// Mode Switch Buttons
document.getElementById("showItem").addEventListener("click", () => {
    mode = "item";
    update3DPreview();
});

document.getElementById("showBlock").addEventListener("click", () => {
    mode = "block";
    update3DPreview();
});

// Update 3D preview on pixel changes
document.getElementById("pixelCanvas").addEventListener("click", update3DPreview);

// Initialize 3D preview on page load
init3DPreview();
