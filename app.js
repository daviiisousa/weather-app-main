function nameLocation() {
    const form = document.getElementById('locationForm')

    form.addEventListener('submit', (e) => {
        e.preventDefault()

        const location = e.target.search.value

        if (!location) {
            Toastify({
                text: "Please enter a location.",
                duration: 3000,
                close: true,
                gravity: "top",
                position: "center",
                backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
            }).showToast()
            return
        }
        getLocation(location)
    })
}

nameLocation()

async function getLocation(location) {
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${location}`)

        const data = await response.json()

        // console.log(data)

        const latitude = data.results[0].latitude
        const longitude = data.results[0].longitude
        const country = data.results[0].country
        const city = data.results[0].name

        const cityElement = document.getElementById('cityName')
        cityElement.textContent = `${city}, ${country}`

        getWeatherData(latitude, longitude)

    } catch (error) {
        Toastify({
            text: "Location not found. Please try again.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast()
    }
}


async function getWeatherData(latitude, longitude) {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)

        const data = await response.json()
        console.log(data)

        const currentTemperature = data.current_weather.temperature || 'N/A'
        const typeTemperature = data.current_weather_units.temperature || 'N/A'
        const time = data.current_weather.time || 'N/A'

        const dateObj = new Date(time)
        const formatted = dateObj.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

        imgWeatherCode(data.current_weather.weathercode, currentTemperature, typeTemperature)

        const timeElement = document.getElementById('time')
        timeElement.textContent = `${formatted}`
    } catch (error) {
        Toastify({
            text: "Unable to fetch weather data. Please try again later.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast()
    }
}

function imgWeatherCode(weatherCode, currentTemperature, typeTemperature) {
    if (weatherCode === 0) {
        document.getElementById('currentWeather').innerHTML = `
            <img class="weatherIcon" src="./assets/images/icon-sunny.webp" alt="weather icon">
            <p class="temperature" id="currentTemperature">${currentTemperature.toFixed()} ${typeTemperature}</p>
            `
        return
    }

    if (weatherCode === 1) {
        document.getElementById('currentWeather').innerHTML = `
            <img class="weatherIcon" src="./assets/images/icon-sunny.webp" alt="weather icon">
            <p class="temperature" id="currentTemperature">${currentTemperature.toFixed()} ${typeTemperature}</p>
            `
        return
    }

    if (weatherCode === 2) {
        document.getElementById('currentWeather').innerHTML = `
            <img class="weatherIcon" src="./assets/images/icon-partly-cloudy.webp" alt="weather icon">
            <p class="temperature" id="currentTemperature">${currentTemperature.toFixed()} ${typeTemperature}</p>
            `
        return
    }

    if (weatherCode === 3 || weatherCode < 61) {
        document.getElementById('currentWeather').innerHTML = `
            <img class="weatherIcon" src="./assets/images/icon-overcast.webp" alt="weather icon">
            <p class="temperature" id="currentTemperature">${currentTemperature.toFixed()} ${typeTemperature}</p>
            `
        return
    }

    if (weatherCode === 61 || weatherCode === 62) {
        document.getElementById('currentWeather').innerHTML = `
            <img class="weatherIcon" src="./assets/images/icon-drizzle.webp" alt="weather icon">
            <p class="temperature" id="currentTemperature">${currentTemperature.toFixed()} ${typeTemperature}</p>
            `
        return
    }

    if (weatherCode === 63 || weatherCode === 64) {
        document.getElementById('currentWeather').innerHTML = `
            <img class="weatherIcon" src="./assets/images/icon-heavy-rain.webp" alt="weather icon">
            <p class="temperature" id="currentTemperature">${currentTemperature.toFixed()} ${typeTemperature}</p>
            `
        return
    }

    if (weatherCode >= 65) {
        document.getElementById('currentWeather').innerHTML = `
            <img class="weatherIcon" src="./assets/images/icon-snow.webp" alt="weather icon">
            <p class="temperature" id="currentTemperature">${currentTemperature.toFixed()} ${typeTemperature}</p>
            `
        return
    }
}