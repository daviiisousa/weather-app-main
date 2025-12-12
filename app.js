async function getWeatherData() {
    try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true')

        const data = await response.json()
        console.log(data)
    } catch (error) {

    }
}
getWeatherData()