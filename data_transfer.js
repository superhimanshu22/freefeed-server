import bluebird from 'bluebird'

global.Promise = bluebird
global.Promise.onPossiblyUnhandledRejection((e) => { throw e; });

import { selectDatabase } from './config/database'
import { connect as redisConnection } from './config/database'
import { connect as postgresConnection } from './config/postgres'
import { PgAdapter } from './data_transfer/PgAdapter'
import { DataTransfer } from './data_transfer/transfer'


const postgres = postgresConnection()
const pgAdapter = new PgAdapter(postgres)
let redis

async function main(){
  console.log("Started")
  await selectDatabase()
  redis = redisConnection()
  console.log("Redis initialized")
  let transfer = new DataTransfer(pgAdapter, redis)
  await transfer.run()
}

main().then(()=> {
  console.log("Finished")
  process.exit(0)
})