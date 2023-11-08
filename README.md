
# About

This is a simple backend and wrapper to pull data from the Open Phage (Google) Data Sheet project: https://docs.google.com/spreadsheets/d/1fhBigiisdCc8-YWD4K8U6yvXK47p67KzA7JfAWsh-Iw/edit#gid=818998992

Built with Hono (https://hono.dev/getting-started/cloudflare-workers) and deployed on Cloudflare Workers.

The Google Sheet "API" was made possible with [SpreadAPI](https://spreadapi.roombelt.com/setup), which is a free Google App Script that sets it up as a REST endpoint. This code uses Cloudflare Workers KV for caching.


## Installing

```
npm install
npm run dev
```

```
npm run deploy
```
