import fs from 'fs'

import { task } from 'hardhat/config'
import { parse } from 'csv-parse'
import { BigNumber } from 'ethers'

task('create-airdrop-json')
  .addParam('inFile', 'Location of the airdrop CSV')
  .addParam('outFile', 'Where to write the outputted JSON')
  .setAction(async (args, hre) => {
    const out: { [k: string]: BigNumber } = {}
    let total = BigNumber.from(0)
    
    const parser = fs.createReadStream(args.inFile).pipe(parse())
    let isHeader = true
    for await (const record of parser) {
      if (isHeader) {
        isHeader = false
        continue
      }
      const addr = record[0]
      const amount = record[record.length - 1]
      total = total.add(amount)
      out[addr] = amount
    }

    
    fs.writeFileSync(args.outFile, JSON.stringify(out, null, '  '))
    
    

    
    let verTotal = BigNumber.from(0)
    const data = JSON.parse(fs.readFileSync(args.outFile).toString('utf-8'))
    for (const [addr, amount] of Object.entries(data)) {
      if (out[addr] !== amount) {
        throw new Error('Value mismatch!')
      }
      verTotal = verTotal.add(amount as any)
    }
    if (!total.eq(verTotal)) {
      throw new Error('Total mismatch!')
    }
    
  })
