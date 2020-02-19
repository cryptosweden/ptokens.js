import { NodeSelector } from 'ptokens-node-selector'
import { EventEmitter } from 'events'

export class Node extends NodeSelector {
  constructor(
    configs: {
      pToken: {
        name: string,
        redeemFrom: string
      },
      defaultNode?: string
    }
  )

  ping(): Promise<string>

  getInfo(_issueFromNetwork: string, _redeemFromNetwork: string): Promise<NodeInfo>

  getReports(_type: string, _limit?: number): Promise<ReportList>

  getReportsByAddress(_type: string, _address: string, _limit?: number): Promise<ReportList>

  getReportByNonce(_type: string, _nonce: number): Promise<Report>

  getLastProcessedBlock(_type: string): Promise<number>

  getIncomingTransactionStatus(_hash: string): Promise<Report>

  getBroadcastTransactionStatus(_hash: string): Promise<Report>

  submitBlock(_type: string, _block: object): Promise<string>

  monitorIncomingTransaction(_hash: string, _eventEmitter: EventEmitter): Promise<Report>
}

export interface NodeInfo {
  "public-key": string,
  "smart-contract-address": string
}

export interface ReportList extends Array<Report> {}

export interface Report {
  _id: string,
  broadcast: true,
  broadcast_tx_hash: string,
  broadcast_timestamp: number,
  native_tx_hash?: string,
  host_tx_hash?: string,
  native_signed_tx?: string,
  host_signed_tx?: string,
  native_tx_amount?: number,
  host_tx_amount?: number,
  native_tx_recipient?: string,
  host_tx_recipient?: string,
  native_account_nonce: number,
  host_account_nonce: number,
  originating_tx_hash: string,
  originating_address: string,
  witnessed_timestamp: number,
  native_latest_block_number?: number,
  host_latest_block_number?: number
}
