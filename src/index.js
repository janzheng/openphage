import { Hono } from 'hono'
import { Sema } from 'async-sema'

const app = new Hono()
// const app = new Hono < { Bindings: Bindings } > ()

// Define an array of sheet names
// const sheets = ["bioinformatics"]
const sheets = ["bioinformatics", "clinical trials", "events", "lab tools", "definitions", "grants", "resources", "funding opportunities", "volunteers"]

// Generate an array of POST fetch configurations for each sheet
const fetchConfigs = sheets.map(sheet => ({
  url: 'https://script.google.com/macros/s/AKfycbwcjDaOXTzTndkTW3u9UFKtk3rrctxGtcrvCUA5h7nLWCbeJok049ruZx6Qbs6VIKQH/exec',
  options: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "method": "GET",
      "sheet": sheet
    })
  }
}))

// Semaphore with limit of 5 concurrent requests
const sema = new Sema(1)

// Function to perform all the fetches
const fetchAll = async (fetchConfigs, c) => {
  const responses = await Promise.all(fetchConfigs.map(async config => {
    await sema.acquire()
    let response
    try {
      console.log(">>>> FETCHING", config)
      // Check if response is in cache
      const cachedResponse = await c.env.CACHE.get(config.options.body)
      if (!cachedResponse) {
        // If not in cache, fetch and store in cache
        response = await fetch(config.url, config.options)
        const data = await response.json()
        await c.env.CACHE.put(config.options.body, JSON.stringify(data))
        response = data
      } else {
        response = JSON.parse(cachedResponse)
      }
    } finally {
      sema.release()
    }
    return response
  }))

  // Create an object where each key is a sheet name and each value is the corresponding response data
  const data = {}
  for (let i = 0; i < sheets.length; i++) {
    data[sheets[i]] = responses[i]
  }
  return data
}

// Root route
app.get('/', async (c) => {
  try {
    // Perform all the fetches
    const responses = await fetchAll(fetchConfigs, c)

    // Assign responses to data
    const data = responses

    // Return the aggregated results
    return c.json(data)
  } catch (error) {
    // Handle errors if any of the requests fail
    return c.json({ error: error.message }, 500)
  }
})



export default app