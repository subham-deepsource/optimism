import { task } from 'hardhat/config'
import { LedgerSigner } from '@ethersproject/hardware-wallets'
import { PopulatedTransaction } from 'ethers'

import { isSameConfig, getDrippieConfig } from '../src'

task('install-drippie-config').setAction(async (args, hre) => {
  
  const signer = new LedgerSigner(
    hre.ethers.provider,
    'default',
    hre.ethers.utils.defaultPath
  )

  
  const Drippie = await hre.ethers.getContractAt(
    'Drippie',
    (
      await hre.deployments.get('Drippie')
    ).address,
    signer
  )

  
  const config = await getDrippieConfig(hre)

  // Need this to deal with annoying Ethers/Ledger 1559 issue.
  const sendtx = async (tx: PopulatedTransaction): Promise<void> => {
    const gas = await signer.estimateGas(tx)
    tx.type = 1
    tx.gasLimit = gas
    const ret = await signer.sendTransaction(tx)
    
    
    await ret.wait()
    
  }

  
  for (const [dripName, dripConfig] of Object.entries(config)) {
    
    const drip = await Drippie.drips(dripName)
    if (drip.status === 0) {
      
      
      const tx = await Drippie.populateTransaction.create(dripName, dripConfig)
      await sendtx(tx)
    } else if (!isSameConfig(dripConfig, drip.config)) {
      
      
      
      
    } else {
      
    }
  }

  
})
