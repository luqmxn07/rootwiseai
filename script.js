const apiKey = "c2ae9e8fd3467d8c69bb143b83cfb999"; // WeatherStack API key

const themeSwitch = document.getElementById("themeSwitch");
const modeLabel = document.getElementById("modeLabel");

themeSwitch.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode");
  document.body.classList.toggle("light-mode");
  modeLabel.textContent = document.body.classList.contains("dark-mode") ? "Light Mode" : "Dark Mode";
});

let mapInstance = null;
let markerInstance = null;

async function fetchWeather() {
  const location = document.getElementById("locationInput").value.trim();
  if (!location) return alert("Please enter a location!");
  try {
    await getWeatherData(location);
  } catch (err) {
    alert("Error fetching weather data.");
    console.error(err);
  }
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const query = `${lat},${lon}`;
          await getWeatherData(query, "Current Location");
        } catch (err) {
          alert("Error getting current location weather.");
        }
      },
      () => alert("Location access denied.")
    );
  } else {
    alert("Geolocation not supported.");
  }
}

async function getWeatherData(query, label = "Location") {
  try {
    const res = await fetch(`http://api.weatherstack.com/current?access_key=${apiKey}&query=${query}`);
    const json = await res.json();

    if (!json || !json.current) return alert("Invalid response from WeatherStack.");

    const weather = json.current;
    const locationName = json.location.name;

    const data = {
      temp: weather.temperature,
      humidity: weather.humidity,
      wind: weather.wind_speed,
      rain: weather.precip,
      aqi: Math.floor(Math.random() * 150), // No AQI support in free tier
      disaster: "None",
      forecast: [weather.temperature - 1, weather.temperature, weather.temperature + 1]
    };

    updateUI(data);
    initMap(json.location.lat, json.location.lon);
    saveToHistory(label || locationName);
  } catch (err) {
    alert("Failed to fetch weather.");
    console.error(err);
  }
}

function updateUI(data) {
  document.getElementById("temp").textContent = Math.round(data.temp);
  document.getElementById("humidity").textContent = data.humidity;
  document.getElementById("wind").textContent = data.wind;
  document.getElementById("rain").textContent = data.rain;
  document.getElementById("aqi").textContent = data.aqi;

  const alertBox = document.getElementById("disasterAlert");
  const alertText = document.getElementById("disasterText");
  alertBox.style.display = data.disaster !== "None" ? "block" : "none";
  alertText.textContent = data.disaster;

  evaluateActivity(data);
  renderAQIChart(data);
  renderForecast(data.forecast);
}

function evaluateActivity(data) {
  const statusIcon = document.getElementById("statusIcon");
  const statusText = document.getElementById("statusText");
  const suggestion = document.getElementById("suggestion");

  if (data.disaster !== "None" || data.aqi > 150 || data.rain > 20 || data.temp > 35 || data.temp < 5 || data.wind > 30) {
    statusIcon.textContent = "⚠️";
    statusText.textContent = "Risky";
    suggestion.textContent = "Better to stay indoors or go at a safer time.";
  } else {
    statusIcon.textContent = "✅";
    statusText.textContent = "Good";
    suggestion.textContent = "Perfect day for running or cycling!";
  }
}

function renderAQIChart(data) {
  const ctx = document.getElementById("aqiChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["AQI"],
      datasets: [{
        label: "AQI",
        data: [data.aqi],
        backgroundColor: data.aqi > 150 ? "#dc3545" : "#28a745"
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 300 } }
    }
  });
}

function renderForecast(data) {
  const ctx = document.getElementById("forecastChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Morning", "Afternoon", "Evening"],
      datasets: [{
        label: "Temperature (°C)",
        data,
        borderColor: "#007bff",
        tension: 0.4,
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: false } }
    }
  });
}

function initMap(lat = 22.75, lon = 88.37) {
  if (mapInstance !== null) {
    mapInstance.setView([lat, lon], 13);
    if (markerInstance) {
      markerInstance.setLatLng([lat, lon]);
    } else {
      markerInstance = L.marker([lat, lon]).addTo(mapInstance).bindPopup("You are here!").openPopup();
    }
    return;
  }

  mapInstance = L.map("map").setView([lat, lon], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(mapInstance);

  markerInstance = L.marker([lat, lon]).addTo(mapInstance).bindPopup("You are here!").openPopup();
}

function saveToHistory(loc) {
  const ul = document.getElementById("activityHistory");
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleString()} - ${loc}`;
  ul.prepend(li);
}
