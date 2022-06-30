/* Imports: External */
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { hexStringEquals, awaitCondition } from '@eth-optimism/core-utils'

/* Imports: Internal */
import { getContractFromArtifact } from '../src/deploy-utils'

const deployFn: DeployFunction = async (hre) => {
  const { deployer } = await hre.getNamedAccounts()

  const Lib_AddressManager = await getContractFromArtifact(
    hre,
    'Lib_AddressManager',
    {
      signerOrProvider: deployer,
    }
  )

  const owner = hre.deployConfig.ovmAddressManagerOwner
  const remoteOwner = await Lib_AddressManager.owner()
  if (hexStringEquals(owner, remoteOwner)) {
    
    return
  }

  
  await Lib_AddressManager.transferOwnership(owner)

  
  await awaitCondition(
    async () => {
      return hexStringEquals(await Lib_AddressManager.owner(), owner)
    },
    5000,
    100
  )

  
}

deployFn.tags = ['upgrade', 'finalize']

export default deployFn
