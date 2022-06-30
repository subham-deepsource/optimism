import fs from 'fs'

import { task } from 'hardhat/config'

import { parseBalanceMap } from '../src/parse-balance-map'

task('generate-merkle-root')
  .addParam(
    'inFile',
    'Input JSON file location containing a map of account addresses to string balances'
  )
  .addParam('outFile', 'Output JSON file location for the Merkle data.')
  .setAction(async (args, hre) => {
    
    const json = JSON.parse(fs.readFileSync(args.inFile, { encoding: 'utf8' }))

    if (typeof json !== 'object') {
      throw new Error('Invalid JSON')
    }

    
    const data = parseBalanceMap(json)
    
    fs.writeFileSync(args.outFile, JSON.stringify(data, null, ' '))
    
    
    
  })
