/* Imports: External */
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { ethers } from 'ethers'
import { hexStringEquals, awaitCondition } from '@eth-optimism/core-utils'

/* Imports: Internal */
import { getContractDefinition } from '../src/contract-defs'
import {
  getContractFromArtifact,
  deployAndVerifyAndThen,
  isHardhatNode,
} from '../src/deploy-utils'
import { names } from '../src/address-names'

const deployFn: DeployFunction = async (hre) => {
  const { deployer } = await hre.getNamedAccounts()

  const ChugSplashDictator = await getContractFromArtifact(
    hre,
    names.unmanaged.ChugSplashDictator,
    {
      signerOrProvider: deployer,
    }
  )

  const Proxy__OVM_L1StandardBridge = await getContractFromArtifact(
    hre,
    names.managed.contracts.Proxy__OVM_L1StandardBridge,
    {
      iface: 'L1ChugSplashProxy',
      signerOrProvider: deployer,
    }
  )

  // Make sure the dictator has been initialized with the correct bridge code.
  const bridgeArtifact = getContractDefinition('L1StandardBridge')
  const bridgeCode = bridgeArtifact.deployedBytecode
  const codeHash = await ChugSplashDictator.codeHash()
  if (ethers.utils.keccak256(bridgeCode) !== codeHash) {
    throw new Error('code hash does not match actual bridge code')
  }

  const currentOwner = await Proxy__OVM_L1StandardBridge.connect(
    Proxy__OVM_L1StandardBridge.signer.provider
  ).callStatic.getOwner({
    from: ethers.constants.AddressZero,
  })
  const finalOwner = await ChugSplashDictator.finalOwner()

  const messengerSlotKey = await ChugSplashDictator.messengerSlotKey()
  const messengerSlotVal = await ChugSplashDictator.messengerSlotVal()
  const bridgeSlotKey = await ChugSplashDictator.bridgeSlotKey()
  const bridgeSlotVal = await ChugSplashDictator.bridgeSlotVal()

  

  // Check if if we're on the hardhat chain ID. This will only happen in CI. If this is the case, we
  // can skip directly to transferring ownership over to the ChugSplashDictator contract.
  if (
    (await isHardhatNode(hre)) ||
    process.env.AUTOMATICALLY_TRANSFER_OWNERSHIP === 'true'
  ) {
    const owner = await hre.ethers.getSigner(currentOwner)
    await Proxy__OVM_L1StandardBridge.connect(owner).setOwner(
      ChugSplashDictator.address
    )
  }

  // Wait for ownership to be transferred to the AddressDictator contract.
  await awaitCondition(
    async () => {
      return hexStringEquals(
        await Proxy__OVM_L1StandardBridge.connect(
          Proxy__OVM_L1StandardBridge.signer.provider
        ).callStatic.getOwner({
          from: ethers.constants.AddressZero,
        }),
        ChugSplashDictator.address
      )
    },
    30000,
    1000
  )

  // Set the addresses!
  
  await ChugSplashDictator.doActions(bridgeCode)

  
  await awaitCondition(
    async () => {
      return hexStringEquals(
        await Proxy__OVM_L1StandardBridge.connect(
          Proxy__OVM_L1StandardBridge.signer.provider
        ).callStatic.getOwner({
          from: ethers.constants.AddressZero,
        }),
        finalOwner
      )
    },
    5000,
    100
  )

  // Deploy a copy of the implementation so it can be successfully verified on Etherscan.
  
  await deployAndVerifyAndThen({
    hre,
    name: 'L1StandardBridge_for_verification_only',
    contract: 'L1StandardBridge',
    args: [],
  })
}

deployFn.tags = ['L1StandardBridge', 'upgrade']

export default deployFn
