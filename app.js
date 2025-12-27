let loading = false
let weatherHourlyData = null

function nameLocation() {
    const form = document.getElementById('locationForm')
    const savedLocation = localStorage.getItem('location') || 'Fortaleza'

    form.addEventListener('submit', (e) => {
        e.preventDefault()

        const newLocation = e.target.search.value

        if (!newLocation) {
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

        localStorage.setItem('location', newLocation)
        getLocation(newLocation)
    })

    getLocation(savedLocation)
}

function dayOnWeekday() {
    const select = document.getElementById('dayButton')
    select.addEventListener('change', (e) => {
        const selectedDay = e.target.value

        if (weatherHourlyData) {
            updateHourlyForecast(selectedDay, weatherHourlyData)
        }
    })
}

nameLocation()
dayOnWeekday()

async function getLocation(location) {
    try {
        loading = true
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${location}`)

        const data = await response.json()

        const latitude = data.results[0].latitude
        const longitude = data.results[0].longitude
        const country = data.results[0].country
        const city = data.results[0].name

        getWeatherData(latitude, longitude, city, country)

    } catch (error) {
        Toastify({
            text: "Location not found. Please try again.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast()
    } finally {
        loading = false
    }
}

let selectedUnit = 'celsius'
let choicesInstance = null // Instância do Choices.js

function selectUnits() {
    const selectElement = document.getElementById('selectUnits')

    if (selectElement) {
        // Inicializar Choices.js
        choicesInstance = new Choices(selectElement, {
            searchEnabled: false,
            itemSelectText: '',
            shouldSort: false,
            removeItemButton: false,
        })

        // Listener para mudanças
        selectElement.addEventListener('change', (e) => {
            selectedUnit = e.target.value
            console.log('Selected unit:', selectedUnit)

            const location = localStorage.getItem('location')
            if (location) {
                getLocation(location)
            }
        })
    }
}

selectUnits()

async function getWeatherData(latitude, longitude, city, country) {

    try {
        loading = true

        const backgroundImageElement = document.getElementById('backgroundImage')
        const contentOverlayElement = document.getElementById('contentOverlay')

        backgroundImageElement.classList.add('loading')

        contentOverlayElement.innerHTML = `
            <div class="loading-container">
                <img class="loading-icon" src="./assets/images/icon-loading.svg" alt="loading">
                <p class="loading-text">Loading...</p>
            </div>
        `

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,apparent_temperature,relativehumidity_2m,weathercode&daily=weathercode,temperature_2m_min,temperature_2m_max&current_weather=true&temperature_unit=${selectedUnit}`)

        const data = await response.json()
        console.log(data)

        weatherHourlyData = {
            time: data.hourly.time,
            temperature: data.hourly.temperature_2m,
            weatherCode: data.hourly.weathercode,
            temperatureUnit: data.hourly_units.temperature_2m
        }

        backgroundImageElement.classList.remove('loading')

        const currentTemperature = data.current_weather.temperature || 'N/A'
        const typeTemperature = data.current_weather_units.temperature || 'N/A'
        const time = data.current_weather.time || 'N/A'
        const windSpeed = data.current_weather.windspeed || 'N/A'
        const windUnit = data.current_weather_units.windspeed || 'N/A'

        const dateObj = new Date(time)
        const formatted = dateObj.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

        contentOverlayElement.innerHTML = `
            <div class="locationInfo">
                <h2 class="cityName" id="cityName">${city}, ${country}</h2>
                <p class="dateInfo" id="time">${formatted}</p>
            </div>
            <div class="currentWeather" id="currentWeather"></div>
        `

        imgWeatherCode(data.current_weather.weathercode, currentTemperature, typeTemperature)

        const humidityValue = humidity(data.hourly.time, data.hourly.relativehumidity_2m)

        const feelsLikeValue = feelsLike(data.hourly.time, data.hourly.apparent_temperature)

        const precipitationValue = precipitation(data.hourly.time, data.hourly.precipitation)

        const forecast = dailyForecast(data)

        const feelsLikeElement = document.getElementById('feelsLike')
        feelsLikeElement.textContent = `${feelsLikeValue} ${typeTemperature}`

        const windElement = document.getElementById('windSpeed')
        windElement.textContent = `${windSpeed} ${windUnit}`

        const humidityElement = document.getElementById('humidity')
        humidityElement.textContent = `${humidityValue}%`

        const precipitationElement = document.getElementById('precipitation')
        precipitationElement.textContent = `${precipitationValue} mm`

        const containerForecastElement = document.getElementById('containerForecast')
        containerForecastElement.innerHTML = `
            ${forecast.map(day => `
                <div class="cardForecast">
                    <p class="dayOfWeek">${getDayName(day.date)}</p>
                    <img class="iconForecast" src="${imgForecastWeatherCode(day.weatherCode)}" alt="weather icon">
                    <div class="tempsForecast">
                        <p class="">${day.min}°</p>
                        <p class="">${day.max}°</p>
                    </div>
                </div>
            `).join('')}
        `

        const today = new Date().toLocaleDateString("pt-BR", { weekday: "long" })
        updateHourlyForecast(today, weatherHourlyData)

        const selectElement = document.getElementById('dayButton')
        if (selectElement) {
            selectElement.value = today
        }

    } catch (error) {
        Toastify({
            text: "Unable to fetch weather data. Please try again later.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast()
    } finally {
        loading = false
    }
}

function humidity(time, humidity) {
    const now = new Date().toISOString().slice(0, 13);

    const index = time.findIndex(time =>
        time.startsWith(now)
    );

    return humidity[index] || 'N/A';
}

function feelsLike(time, feelsLike) {
    const now = new Date().toISOString().slice(0, 13);

    const index = time.findIndex(time =>
        time.startsWith(now)
    );

    return feelsLike[index] || 'N/A';
}

function precipitation(time, precipitation) {
    const now = new Date().toISOString().slice(0, 13);

    const index = time.findIndex(time =>
        time.startsWith(now)
    );

    if (precipitation[index] < 0) {
        return 'N/A';
    }

    return precipitation[index];
}

function getDayName(date) {
    return new Date(date).toLocaleDateString("pt-BR", {
        weekday: "long",
    });
}


function dailyForecast(data) {
    const daily = data.daily;

    const forecast = daily.time.map((date, index) => ({
        date,
        weatherCode: daily.weathercode[index],
        min: daily.temperature_2m_min[index],
        max: daily.temperature_2m_max[index],
    }));

    return forecast;

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

function imgForecastWeatherCode(weatherCode) {
    const iconMap = {
        0: "./assets/images/icon-sunny.webp",
        1: "./assets/images/icon-sunny.webp",
        2: "./assets/images/icon-partly-cloudy.webp",
        3: "./assets/images/icon-overcast.webp",
        61: "./assets/images/icon-drizzle.webp",
        62: "./assets/images/icon-drizzle.webp",
        63: "./assets/images/icon-heavy-rain.webp",
        64: "./assets/images/icon-heavy-rain.webp",
        65: "./assets/images/icon-snow.webp",
    };

    return iconMap[weatherCode] || "./assets/images/icon-sunny.webp";
}

function updateHourlyForecast(selectedDay, hourlyData) {
    const contentHourlyForecast = document.querySelector('.contentHourlyForecast')

    if (!contentHourlyForecast || !hourlyData) return

    const hoursForSelectedDay = []

    hourlyData.time.forEach((timeString, index) => {
        const date = new Date(timeString)
        const dayName = date.toLocaleDateString("pt-BR", { weekday: "long" })

        if (dayName === selectedDay) {
            hoursForSelectedDay.push({
                time: timeString,
                hour: date.getHours(),
                temperature: hourlyData.temperature[index],
                weatherCode: hourlyData.weatherCode[index]
            })
        }
    })

    contentHourlyForecast.innerHTML = hoursForSelectedDay.map(hourData => {
        const hour = hourData.hour
        const period = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        const iconSrc = imgForecastWeatherCode(hourData.weatherCode)

        return `
            <div class="hourlyForecast">
                <div class="hourlyInfo">
                    <img src="${iconSrc}" alt="weather icon">
                    <p>${displayHour} ${period}</p>
                </div>
                <p>${Math.round(hourData.temperature)}${hourlyData.temperatureUnit}</p>
            </div>
        `
    }).join('')
}