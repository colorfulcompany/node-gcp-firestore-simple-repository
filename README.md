## Firestore Repository pattern

## APIs

 * `query`
 * `async add(data)`
 * `async create(data)`
 * `async update(target, data, options)`
 * `async delete(id)`
 * `async all()`
 * `async find(id)`
 * `async filter(query)`
 * `async clear()`

## Available Environment Variables

 * GCP_PROJECT

## Examples

```javascript
// projectId is omittable when environment variable GCP_PROJECT is set

const sleep = require('sleep-promise')

const { FirestoreCreator } = require('gcp-firestore-repository)
const store = FirestoreCreator.create(<projectId>)

const { RepositoryCreator } = require('gcp-firestore-repository)
const repository = RepositoryCreator.create(<collection>, { projectId: <projectId> })

const { EmulatorController } = require('gcp-firestore-repository')

;(async () => {
  // same as `$ gcloud beta emulators firestore start`
  // automatically add environment variable FIRESTORE_EMULATOR_HOST
  const emu = EmulatorController.invoke(<host>, <port>)
  await sleep(500)
  await emu.kill()
})()
```
