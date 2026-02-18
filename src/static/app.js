document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // helper for showing temporary messages
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  // remove a participant via API
  async function removeParticipant(activity, email) {
    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activity)}/participant?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await resp.json();
      if (resp.ok) {
        showMessage(result.message, "success");
        fetchActivities(); // refresh data
      } else {
        showMessage(result.detail || "Failed to remove participant", "error");
      }
    } catch (err) {
      console.error("Error removing participant:", err);
      showMessage("Network error while removing participant", "error");
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build a little list of signed‑up students (names with remove icons)
        const participantsHtml = details.participants.length
          ? `<ul class="participants-list">
               ${details.participants.map(p => `<li>${p}<span class="remove-icon" data-activity="${name}" data-email="${p}">✖</span></li>`).join("")}
             </ul>`
          : `<p class="no-participants">No participants yet</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p><strong>Participants:</strong></p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // event delegation for remove icons
  activitiesList.addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-icon")) {
      const activity = event.target.dataset.activity;
      const email = event.target.dataset.email;
      removeParticipant(activity, email);
    }
  });

  // Initialize app
  fetchActivities();
});
