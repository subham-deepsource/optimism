import fs from 'fs'

import { task } from 'hardhat/config'
import dotenv from 'dotenv'

import { prompt } from '../src/prompt'

dotenv.config()

task('multi-send', 'Send tokens to multiple addresses')
  .addOptionalParam(
    'privateKey',
    'Private Key for deployer account',
    process.env.PRIVATE_KEY_MULTI_SEND
  )
  .addParam('inFile', 'Distribution file')
  .setAction(async (args, hre) => {
    

    // Load the distribution setup
    const distributionJson = fs.readFileSync(args.inFile).toString()
    const distribution = JSON.parse(distributionJson)
    const sender = new hre.ethers.Wallet(args.privateKey).connect(
      hre.ethers.provider
    )

    const addr = await sender.getAddress()
    

    
    for (const [address, amount] of Object.entries(distribution)) {
      
    }
    await prompt('Is this OK?')

    const governanceToken = (
      await hre.ethers.getContractAt(
        'GovernanceToken',
        '0x4200000000000000000000000000000000000042'
      )
    ).connect(sender)

    for (const [address, amount] of Object.entries(distribution)) {
      const amountBase = hre.ethers.utils.parseEther(amount as string)
      
      const transferTx = await governanceToken.transfer(address, amountBase)
      
      await transferTx.wait()
    }

    
  })
