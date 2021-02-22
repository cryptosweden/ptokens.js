import { Node, Report } from 'ptokens-node'
import {
  BitcoinUtxo,
  BitcoinTransactionReceipt
} from 'ptokens-utils'
import { TransactionReceipt, PromiEvent } from 'web3-core'
import Web3 from 'web3'
import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig'
import { NodeSelector } from 'ptokens-node-selector'
import { BigNumber } from 'bignumber.js'
import { DepositAddress } from 'ptokens-deposit-address'

export interface pBTCConfigs {
  network?: string,
  hostNetwork?: string,
  blockchain?: string,
  hostBlockchain?: string,
  nativeNetwork?: string,
  nativeBlockchain?: string,
  ethPrivateKey?: string,
  ethProvider?: string | object,
  eosPrivateKey?: string,
  eosRpc?: string | JsonRpc,
  eosSignatureProvider?: JsSignatureProvider
  defaultNode?: Node
}

/*
  NOTE: EOS transaction receipt has been declared as "any" so it
  is not possible to use it here because would overwrite other types
  causing errors
*/

export interface RedeemOptions {
  gas?: number,
  gasPrice?: number | string | BigNumber,
  blocksBehind?: string,
  expireSeconds?: string,
  permission?: string,
}

export class pBTC extends NodeSelector {
  constructor(configs: pBTCConfigs)

  nodeSelector: NodeSelector

  decimals: string | null

  contractAddress: string | null

  hostPrivatekey?: string | null

  hostApi?: Web3 | Api

  getDepositAddress(_hostAddress: string): Promise<DepositAddress>

  redeem(_amount: number|string|BigNumber, _btcAddress: string, _options: RedeemOptions): PromiEvent< string | TransactionReceipt | Report | BitcoinTransactionReceipt | RedeemResult>
}

export interface RedeemResult {
  amount: number,
  nativeTx: string,
  hostTx: string,
  to: string,
}
