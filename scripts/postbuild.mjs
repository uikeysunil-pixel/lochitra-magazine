import rss from './rss.mjs'
import { submitIndexNow } from './indexnow-submit.mjs'

async function postbuild() {
  await rss()
  await submitIndexNow()
}

postbuild()
