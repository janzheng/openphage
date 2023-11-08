import { Hono } from 'hono'
import { Sema } from 'async-sema'
import slugify from 'slugify'

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


const USE_CACHE = true

// const CACHE_SECONDS = 60; // 60s * 60m * 24h // update every minute for testing
const CACHE_SECONDS = 60 * 60; // 60s * 60m * 24h // update cache every hour for prod
// const CACHE_SECONDS = 60 * 60 * 24; // 60s * 60m * 24h // update cache every day for prod

// Semaphore with limit of 5 concurrent requests
const sema = new Sema(5)

// Function to perform all the fetches
const fetchAll = async (fetchConfigs, c) => {
  const responses = await Promise.all(fetchConfigs.map(async config => {
    await sema.acquire()
    let response
    try {
      console.log(">>>> FETCHING", config)
      // Check if response is in cache
      let cachedResponse = USE_CACHE && await c.env.CACHE.get(config.options.body)
      if (!cachedResponse) {
        // If not in cache, fetch and store in cache
        response = await fetch(config.url, config.options)
        const data = await response.json()
        await c.env.CACHE.put(config.options.body, JSON.stringify(data), { expirationTtl: CACHE_SECONDS })
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
  // Perform all the fetches
  const responses = await fetchAll(fetchConfigs, c)

  // Generate table for each sheet
  let tables = '';
  for (let sheet of sheets) {
    if (responses[sheet].data.length > 0) {
      // Get keys from the first object in the data array
      const keys = Object.keys(responses[sheet].data[0]);

      // Generate table headers
      const headers = keys.map(key => `<th class="px-4 py-2 text-left">${key}</th>`).join('');

      // Generate table rows
      const rows = responses[sheet].data.map(item => `
        <tr>
          ${keys.map(key => {
            if (typeof item[key] === 'string' && item[key].startsWith('http')) {
              return `<td class="border px-4 py-2"><a class="text-blue-500 cursor-pointer hover:underline" href="${item[key]}">${item[key]}</a></td>`
            } else {
              return `<td class="border px-4 py-2">${item[key]}</td>`
            }
          }).join('')}
        </tr>
      `).join('');

      // Add table to tables string
      tables += `
        <h2 id="${slugify(sheet)}" class="text-2xl capitalize mb-8 mt-16">${sheet}</h2>
        <div class="overflow-x-auto">
          <table class="text-sm table-auto mx-auto max-w-3xl mx-auto">
            <thead>
              <tr>
                ${headers}
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  // Return HTML content
  return c.html(`
    <html>
      <head>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.16/dist/tailwind.min.css" rel="stylesheet">
      </head>
      <body class=" py-5 max-w-3xl mx-auto">
        <h1 class="text-4xl text-center pb-3">Open Phage Data Sheet</h1>
        <p class="text-gray-700 pb-3">This data sheet is cached + generated from the original Open Phage Google Sheet. Please contribute if you can! Every bit helps! <a class="text-blue-500 cursor-pointer hover:underline" href="https://open.phage.directory/sheet">https://open.phage.directory/sheet</a> <br><span class="text-sm">(Original Google sheets link: <a class="text-blue-500 cursor-pointer hover:underline" href="https://docs.google.com/spreadsheets/d/1fhBigiisdCc8-YWD4K8U6yvXK47p67KzA7JfAWsh-Iw/edit#gid=1571383366">https://docs.google.com/spreadsheets/d/1fhBigiisdCc8-YWD4K8U6yvXK47p67KzA7JfAWsh-Iw/edit#gid=1571383366</a> ).</span></p>
        <p class="text-gray-700 pb-3">To access the data (for bioinformatics, scraping, LLMs, etc.) use: <a class="text-blue-500 cursor-pointer hover:underline" href="https://open.phage.directory/api">https://open.phage.directory/api</a> — the results are updated and cached every so often.</p>
        <p class="text-gray-700 pb-3">Code can be found at: <a class="text-blue-500 cursor-pointer hover:underline" href="https://github.com/janzheng/openphage">https://github.com/janzheng/openphage</a> — the results are updated and cached every so often. This project relies on Hono and SpreadAPI to work.</p>
        <p class="text-gray-700 pb-3">Code can be found at: <a class="text-blue-500 cursor-pointer hover:underline" href="https://github.com/janzheng/openphage">https://github.com/janzheng/openphage</a> — the results are updated and cached every so often. This project relies on Hono and SpreadAPI to work.</p>
        <div class="max-w-3xl mx-auto">
          <h2 class="text-2xl capitalize mb-8 mt-16">Table of Contents</h2>
          <ul>
            ${sheets.map(sheet => `
              <li><a class="text-blue-500 cursor-pointer capitalize hover:underline" href="#${slugify(sheet)}">${sheet}</a></li>
            `).join('')}
          </ul>
        </div>
          ${tables}
        </div>
      </body>
      <style>
        body {
          font-family: sans-serif;
        }
      </style>
    </html>
  `);
});


app.get('/sheet', async (c) => {
  // Redirect to the Google Sheets URL
  return c.redirect('https://docs.google.com/spreadsheets/d/1fhBigiisdCc8-YWD4K8U6yvXK47p67KzA7JfAWsh-Iw')
})


// API route
app.get('/api', async (c) => {
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