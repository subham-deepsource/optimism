import fs from 'fs'

import { task } from 'hardhat/config'
import { getChainId } from '@eth-optimism/core-utils'

import { isSameConfig, getDrippieConfig, addChecksum } from '../src'

task('install-drippie-config-multisig')
  .addParam('safe', 'address of the Gnosis Safe to execute this bundle')
  .addParam('outfile', 'where to write the bundle JSON file')
  .setAction(async (args, hre) => {
    if (!hre.ethers.utils.isAddress(args.safe)) {
      throw new Error(`given safe is not an address: ${args.safe}`)
    }

    
    const Drippie = await hre.ethers.getContractAt(
      'Drippie',
      (
        await hre.deployments.get('Drippie')
      ).address
    )

    
    const config = await getDrippieConfig(hre)

    // Gnosis Safe transaction bundle.
    const bundle: any = {
      version: '1.0',
      chainId: (await getChainId(hre.ethers.provider)).toString(),
      createdAt: Date.now(),
      meta: {
        name: 'Transactions Batch',
        description: '',
        txBuilderVersion: '1.8.0',
        createdFromSafeAddress: args.safe,
        createdFromOwnerAddress: '',
      },
      transactions: [],
    }

    
    for (const [dripName, dripConfig] of Object.entries(config)) {
      
      const drip = await Drippie.drips(dripName)
      if (drip.status === 0) {
        
        
        bundle.transactions.push({
          to: Drippie.address,
          value: '0',
          data: null,
          contractMethod: {
            inputs: [
              { internalType: 'string', name: '_name', type: 'string' },
              {
                components: [
                  {
                    internalType: 'uint256',
                    name: 'interval',
                    type: 'uint256',
                  },
                  {
                    internalType: 'contract IDripCheck',
                    name: 'dripcheck',
                    type: 'address',
                  },
                  { internalType: 'bytes', name: 'checkparams', type: 'bytes' },
                  {
                    components: [
                      {
                        internalType: 'address payable',
                        name: 'target',
                        type: 'address',
                      },
                      { internalType: 'bytes', name: 'data', type: 'bytes' },
                      {
                        internalType: 'uint256',
                        name: 'value',
                        type: 'uint256',
                      },
                    ],
                    internalType: 'struct Drippie.DripAction[]',
                    name: 'actions',
                    type: 'tuple[]',
                  },
                ],
                internalType: 'struct Drippie.DripConfig',
                name: '_config',
                type: 'tuple',
              },
            ],
            name: 'create',
            payable: false,
          },
          contractInputsValues: {
            _name: dripName,
            _config: JSON.stringify([
              hre.ethers.BigNumber.from(dripConfig.interval).toString(),
              dripConfig.dripcheck,
              dripConfig.checkparams,
              dripConfig.actions.map((action) => {
                return [
                  action.target,
                  action.data,
                  hre.ethers.BigNumber.from(action.value).toString(),
                ]
              }),
            ]),
          },
        })
      } else if (!isSameConfig(dripConfig, drip.config)) {
        
        
        
        
      } else {
        
      }
    }

    
    fs.writeFileSync(args.outfile, JSON.stringify(addChecksum(bundle), null, 2))
  })
