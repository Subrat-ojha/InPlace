let map = L.map('map').setView([20.5937, 78.9629], 5); // Default: India

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Function to search for a city
async function searchCity(city) {
    try {
        let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city}`);
        let data = await response.json();

        if (data.length === 0) {
            alert("City not found!");
            return;
        }

        let cityLat = parseFloat(data[0].lat);
        let cityLon = parseFloat(data[0].lon);

        // Move map to searched city
        map.setView([cityLat, cityLon], 13);

        console.log(`City found: ${cityLat}, ${cityLon}`); // Debugging

        // Fetch tourist places
        fetchTouristPlaces(cityLat, cityLon);
    } catch (error) {
        console.error("Error fetching city data:", error);
    }
}

// Function to fetch tourist places using Overpass API
async function fetchTouristPlaces(lat, lon) {
    let overpassQuery = `
        [out:json];
        (
          node["tourism"="attraction"](around:5000, ${lat}, ${lon});
          node["tourism"="museum"](around:5000, ${lat}, ${lon});
          node["tourism"="viewpoint"](around:5000, ${lat}, ${lon});
          node["amenity"="restaurant"](around:5000, ${lat}, ${lon});
        );
        out;
    `;

    let overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    try {
        let response = await fetch(overpassUrl);
        let data = await response.json();

        if (data.elements.length === 0) {
            alert("No tourist places found.");
            return;
        }

        console.log("Tourist places found:", data.elements.length); // Debugging

        // Clear previous markers
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        // Add markers for tourist places
        data.elements.forEach(place => {
            if (place.lat && place.lon) {
                let placeName = place.tags.name || "Unknown Place";
                L.marker([place.lat, place.lon])
                    .addTo(map)
                    .bindPopup(`<b>${placeName}</b><br>${place.tags.tourism || place.tags.amenity}`);
            }
        });

    } catch (error) {
        console.error("Error fetching tourist places:", error);
    }
}

// Event listener for search button
document.getElementById("searchButton").addEventListener("click", function () {
    let city = document.getElementById("searchInput").value.trim();
    if (city) {
        searchCity(city);
    } else {
        alert("Please enter a city name!");
    }
});
