/* Imports: External */
import { hexStringEquals, awaitCondition } from '@eth-optimism/core-utils'
import { DeployFunction } from 'hardhat-deploy/dist/types'

/* Imports: Internal */
import { getContractFromArtifact, isHardhatNode } from '../src/deploy-utils'
import { names } from '../src/address-names'

const deployFn: DeployFunction = async (hre) => {
  const { deployer } = await hre.getNamedAccounts()

  // We use this task to print out the list of addresses that will be updated by the
  // AddressDictator contract. The idea here is that the owner of the AddressManager will then
  // review these names and addresses before transferring ownership to the AddressDictator.
  // Once ownership has been transferred to the AddressDictator, we execute `setAddresses` which
  // triggers a series of setAddress calls on the AddressManager and then transfers ownership back
  // to the original owner.

  // First get relevant contract references.
  const AddressDictator = await getContractFromArtifact(
    hre,
    names.unmanaged.AddressDictator,
    {
      signerOrProvider: deployer,
    }
  )
  const Lib_AddressManager = await getContractFromArtifact(
    hre,
    names.unmanaged.Lib_AddressManager
  )
  const namedAddresses: Array<{ name: string; addr: string }> =
    await AddressDictator.getNamedAddresses()
  const finalOwner = await AddressDictator.finalOwner()
  const currentOwner = await Lib_AddressManager.owner()

  

  // Check if if we're on the hardhat chain ID. This will only happen in CI. If this is the case, we
  // can skip directly to transferring ownership over to the ChugSplashDictator contract.
  if (
    (await isHardhatNode(hre)) ||
    process.env.AUTOMATICALLY_TRANSFER_OWNERSHIP === 'true'
  ) {
    const owner = await hre.ethers.getSigner(currentOwner)
    await Lib_AddressManager.connect(owner).transferOwnership(
      AddressDictator.address
    )
  }

  // Wait for ownership to be transferred to the AddressDictator contract.
  await awaitCondition(
    async () => {
      return hexStringEquals(
        await Lib_AddressManager.owner(),
        AddressDictator.address
      )
    },
    // Try every 30 seconds for 500 minutes.
    30000,
    1000
  )

  // Set the addresses!
  
  await AddressDictator.setAddresses()

  // Make sure ownership has been correctly sent back to the original owner.
  
  await awaitCondition(
    async () => {
      return hexStringEquals(await Lib_AddressManager.owner(), finalOwner)
    },
    500,
    1000
  )
}

deployFn.tags = ['set-addresses', 'upgrade']

export default deployFn
