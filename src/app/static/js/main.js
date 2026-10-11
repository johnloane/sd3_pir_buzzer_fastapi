const heartBeatRate = 1000;
let aliveTimestamp = Date.now();

// Wait for the DOM to load before grabbing elements
document.addEventListener("DOMContentLoaded", () => {
    const connectionBadge = document.getElementById("connection_badge");
    const motionBadge = document.getElementById("motion_badge");
    const buzzerSwitch = document.getElementById("buzzer");

    // Attach event listener to the switch
    buzzerSwitch.addEventListener("change", (e) => {
        const state = e.target.checked ? "on" : "off";
        sendEvent(`${e.target.id}-${state}`);
    });

    // Start background loops
    setTimeout(() => checkConnectionTimeout(connectionBadge, motionBadge), heartBeatRate);
    pollServer(motionBadge);
});

function checkConnectionTimeout(connectionBadge, motionBadge) {
    const currentTime = Date.now();
    
    // If the server hasn't responded within the heartbeat window + 1 second
    if (currentTime - aliveTimestamp > heartBeatRate + 1000) {
        updateBadge(connectionBadge, "Offline", "bg-danger", "bg-success");
        updateBadge(motionBadge, "Unknown", "bg-secondary", "bg-primary", "bg-success", "bg-danger");
    } else {
        updateBadge(connectionBadge, "Online", "bg-success", "bg-danger", "bg-secondary");
    }
    
    setTimeout(() => checkConnectionTimeout(connectionBadge, motionBadge), heartBeatRate);
}

function pollServer(motionBadge) {
    fetch('/keep_alive')
        .then(response => {
            if (!response.ok) throw new Error("Server error");
            aliveTimestamp = Date.now();
            return response.json();
        })
        .then(data => {
            // Updated to handle 1 or 0 integers from the backend
            if (data.motion === 1) {
                updateBadge(motionBadge, "Motion Detected", "bg-danger", "bg-success", "bg-secondary");
            } else {
                updateBadge(motionBadge, "Clear", "bg-success", "bg-danger", "bg-secondary");
            }
        })
        .catch(error => {
            console.error("Polling failed:", error);
        })
        .finally(() => {
            setTimeout(() => pollServer(motionBadge), heartBeatRate);
        });
}

function sendEvent(value) {
    fetch(`/status=${value}`, { method: "POST" })
        .catch(error => console.error("Failed to send command:", error));
}

// Utility function to safely swap Bootstrap background classes
function updateBadge(element, text, classToAdd, ...classesToRemove) {
    if (element.textContent !== text) {
        element.textContent = text;
    }
    classesToRemove.forEach(cls => element.classList.remove(cls));
    element.classList.add(classToAdd);
}
