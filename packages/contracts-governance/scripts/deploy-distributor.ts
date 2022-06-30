import fs from 'fs'

import { task } from 'hardhat/config'
import dotenv from 'dotenv'
import { BigNumber } from 'ethers'

import { MerkleDistributorInfo } from '../src/parse-balance-map'
import { prompt } from '../src/prompt'
dotenv.config()

task('deploy-distributor')
  .addParam(
    'pkDeployer',
    'Private key of the minter',
    process.env.PRIVATE_KEY_DISTRIBUTOR_DEPLOYER
  )
  .addParam(
    'treasuryAddr',
    'Address airdrops can be swept to if left unclaimed for a year. Defaults to the OP multisig',
    '0x2e128664036fa6AAdFEA521fd2Ce192309c25242'
  )
  .addParam('inFile', 'Location of the Merkle roots JSON file')
  .setAction(async (args, hre) => {
    const file = fs.readFileSync(args.inFile).toString()
    const data = JSON.parse(file) as MerkleDistributorInfo
    const deployer = new hre.ethers.Wallet(args.pkDeployer).connect(
      hre.ethers.provider
    )

    
    
    
    
    
    
    
    await prompt('Is this OK?')

    const factory = await hre.ethers.getContractFactory('MerkleDistributor')
    const contract = await factory
      .connect(deployer)
      .deploy(
        '0x4200000000000000000000000000000000000042',
        data.merkleRoot,
        args.treasuryAddr,
        {
          gasLimit: 3000000,
        }
      )
    
    await contract.deployed()
    
  })
