import { task, types } from 'hardhat/config'
import { ethers } from 'ethers'
import { LedgerSigner } from '@ethersproject/hardware-wallets'
import dotenv from 'dotenv'

import { prompt } from '../src/prompt'
dotenv.config()

// Hardcode the expected addresse
const addresses = {
  governanceToken: '0x4200000000000000000000000000000000000042',
}

task('deploy-token', 'Deploy governance token and its mint manager contracts')
  .addParam('mintManagerOwner', 'Owner of the mint manager')
  .addOptionalParam('useLedger', 'User ledger hardware wallet as signer')
  .addOptionalParam(
    'ledgerTokenDeployerPath',
    'Ledger key derivation path for the token deployer account',
    ethers.utils.defaultPath,
    types.string
  )
  .addParam(
    'pkDeployer',
    'Private key for main deployer account',
    process.env.PRIVATE_KEY_DEPLOYER
  )
  .addOptionalParam(
    'pkTokenDeployer',
    'Private key for the token deployer account',
    process.env.PRIVATE_KEY_TOKEN_DEPLOYER
  )
  .setAction(async (args, hre) => {
    
    // There cannot be two ledgers at the same time
    let tokenDeployer
    // Deploy the token
    if (args.useLedger) {
      // Token is deployed to a system address at `0x4200000000000000000000000000000000000042`
      // For that a dedicated deployer account is used
      tokenDeployer = new LedgerSigner(
        hre.ethers.provider,
        'default',
        args.ledgerTokenDeployerPath
      )
    } else {
      tokenDeployer = new hre.ethers.Wallet(args.pkTokenDeployer).connect(
        hre.ethers.provider
      )
    }

    // Create the MintManager Deployer
    const deployer = new hre.ethers.Wallet(args.pkDeployer).connect(
      hre.ethers.provider
    )

    // Get the sizes of the bytecode to check if the contracts
    // have already been deployed. Useful for an error partway through
    // the script
    const governanceTokenCode = await hre.ethers.provider.getCode(
      addresses.governanceToken
    )

    const addrTokenDeployer = await tokenDeployer.getAddress()
    

    const tokenDeployerBalance = await tokenDeployer.getBalance()
    if (tokenDeployerBalance.eq(0)) {
      throw new Error(`Token deployer has no balance`)
    }
    
    const nonceTokenDeployer = await tokenDeployer.getTransactionCount()
    

    const GovernanceToken = await hre.ethers.getContractFactory(
      'GovernanceToken'
    )
    let governanceToken = GovernanceToken.attach(
      addresses.governanceToken
    ).connect(tokenDeployer)

    if (nonceTokenDeployer === 0 && governanceTokenCode === '0x') {
      await prompt('Ready to deploy. Does everything look OK?')
      // Deploy the GovernanceToken
      governanceToken = await GovernanceToken.connect(tokenDeployer).deploy()
      const tokenReceipt = await governanceToken.deployTransaction.wait()
      

      if (tokenReceipt.contractAddress !== addresses.governanceToken) {
        
        
        throw new Error(`Fatal error! Mismatch of governance token address`)
      }
    } else {
      
      
      
    }

    const { mintManagerOwner } = args

    // Do the deployer things
    
    const addr = await deployer.getAddress()
    

    const deployerBalance = await deployer.getBalance()
    if (deployerBalance.eq(0)) {
      throw new Error('Deployer has no balance')
    }
    
    const deployerNonce = await deployer.getTransactionCount()
    
    await prompt('Does this look OK?')

    const MintManager = await hre.ethers.getContractFactory('MintManager')
    // Deploy the MintManager
    
    const mintManager = await MintManager.connect(deployer).deploy(
      mintManagerOwner,
      addresses.governanceToken
    )

    const receipt = await mintManager.deployTransaction.wait()
    
    let mmOwner = await mintManager.owner()
    const currTokenOwner = await governanceToken
      .attach(addresses.governanceToken)
      .owner()
    
    
    
    
    await prompt('Is this OK?')

    
    // Transfer ownership of the token to the MintManager instance
    const tx = await governanceToken
      .attach(addresses.governanceToken)
      .transferOwnership(mintManager.address)
    await tx.wait()
    

    
    
    
    

    const tokOwner = await governanceToken
      .attach(addresses.governanceToken)
      .owner()
    if (tokOwner !== mintManager.address) {
      throw new Error(`GovernanceToken owner not set correctly`)
    }

    // Check that the deployment went as expected
    const govToken = await mintManager.governanceToken()
    if (govToken !== addresses.governanceToken) {
      throw new Error(`MintManager governance token not set correctly`)
    }
    mmOwner = await mintManager.owner()
    if (mmOwner !== mintManagerOwner) {
      throw new Error(`MintManager owner not set correctly`)
    }
    
  })
