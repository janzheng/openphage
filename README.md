
# About

This is a simple backend and wrapper to pull data from the Open Phage (Google) Data Sheet project: https://docs.google.com/spreadsheets/d/1fhBigiisdCc8-YWD4K8U6yvXK47p67KzA7JfAWsh-Iw/edit#gid=818998992

Built with Hono (https://hono.dev/getting-started/cloudflare-workers) and deployed on Cloudflare Workers.

The Google Sheet "API" was made possible with [SpreadAPI](https://spreadapi.roombelt.com/setup), which is a free Google App Script that sets it up as a REST endpoint. This code uses Cloudflare Workers KV for caching.

## Content

The Google Sheet is completely open, and meant to be a collaborative project. Once various resources are setup and listed (e.g. PubMed, clinicaltrials.gov) then we can use Assistants to automatically pull information. But for now, this process is still manual and user-generated.

## Sections

bioinformatics, clinical trials, events, lab tools, definitions, grants, resources, funding opportunities, volunteers

* [bioinformatics](https://open.phage.directory#bioinformatics)
* [clinical trials](https://open.phage.directory#clinicaltrials)
* [events](https://open.phage.directory#events)
* [lab tools](https://open.phage.directory#labtools)
* [definitions](https://open.phage.directory#definitions)
* [grants](https://open.phage.directory#grants)
* [resources](https://open.phage.directory#resources)
* [funding opportunities](https://open.phage.directory#fundingopportunities)
* [volunteers](https://open.phage.directory#volunteers)









## Installing

```
npm install
npm run dev
```

```
npm run deploy
```
