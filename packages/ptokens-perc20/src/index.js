import Web3 from 'web3'
import Web3PromiEvent from 'web3-core-promievent'
import { NodeSelector } from 'ptokens-node-selector'
import { abi, constants, eth, eos, helpers, redeemFrom } from 'ptokens-utils'
import BigNumber from 'bignumber.js'
import Web3Utils from 'web3-utils'
import minimumAmounts from './minimum-amounts'
import mapDecimals from './decimals'

export class pERC20 extends NodeSelector {
  constructor(_configs) {
    const { hostBlockchain, hostNetwork, nativeBlockchain, nativeNetwork } = helpers.parseParams(
      _configs,
      constants.blockchains.Ethereum
    )

    super({
      pToken: _configs.pToken.toLowerCase() === constants.pTokens.pETH ? 'pweth' : _configs.pToken,
      hostBlockchain,
      hostNetwork,
      nativeBlockchain,
      nativeNetwork,
      defaultNode: _configs.defaultNode
    })

    const {
      ethPrivateKey,
      ethProvider,
      bscPrivateKey,
      bscProvider,
      xdaiPrivateKey,
      xdaiProvider,
      eosPrivateKey,
      eosRpc,
      eosSignatureProvider,
      telosPrivateKey,
      telosRpc,
      telosSignatureProvider,
      ultraPrivateKey,
      ultraRpc,
      ultraSignatureProvider
    } = _configs

    if (ethProvider) this.web3 = new Web3(ethProvider)
    if (ethPrivateKey) {
      const account = this.web3.eth.accounts.privateKeyToAccount(eth.addHexPrefix(ethPrivateKey))
      this.web3.eth.defaultAccount = account.address
      this.ethPrivateKey = eth.addHexPrefix(ethPrivateKey)
    } else {
      this.ethPrivateKey = null
    }

    if (bscProvider) this.hostApi = new Web3(bscProvider)
    if (bscPrivateKey) {
      const account = this.hostApi.eth.accounts.privateKeyToAccount(eth.addHexPrefix(bscPrivateKey))
      this.hostApi.eth.defaultAccount = account.address
      this.hostPrivateKey = eth.addHexPrefix(bscPrivateKey)
    } else {
      this.hostPrivateKey = null
    }

    if (xdaiProvider) this.hostApi = new Web3(xdaiProvider)
    if (xdaiPrivateKey) {
      const account = this.hostApi.eth.accounts.privateKeyToAccount(eth.addHexPrefix(xdaiPrivateKey))
      this.hostApi.eth.defaultAccount = account.address
      this.hostPrivateKey = eth.addHexPrefix(xdaiPrivateKey)
    } else {
      this.hostPrivateKey = null
    }

    if (eosSignatureProvider) {
      this.hostApi = eos.getApi(null, eosRpc, eosSignatureProvider)
    } else if (eosPrivateKey && eosRpc) {
      this.hostApi = eos.getApi(eosPrivateKey, eosRpc, null)
      this.hostPrivateKey = eosPrivateKey
    } else if (!eosSignatureProvider && !eosPrivateKey && eosRpc) {
      this.hostApi = eos.getApi(null, eosRpc, null)
    }

    if (telosSignatureProvider) {
      this.hostApi = eos.getApi(null, telosRpc, telosSignatureProvider)
    } else if (telosPrivateKey && telosRpc) {
      this.hostApi = eos.getApi(telosPrivateKey, telosRpc, null)
      this.hostPrivateKey = telosPrivateKey
    } else if (!telosSignatureProvider && !telosPrivateKey && telosRpc) {
      this.hostApi = eos.getApi(null, telosRpc, null)
    }

    if (ultraSignatureProvider) {
      this.hostApi = eos.getApi(null, ultraRpc, ultraSignatureProvider)
    } else if (ultraPrivateKey && ultraRpc) {
      this.hostApi = eos.getApi(ultraPrivateKey, ultraRpc, null)
      this.hostPrivateKey = ultraPrivateKey
    } else if (!ultraSignatureProvider && !ultraPrivateKey && ultraRpc) {
      this.hostApi = eos.getApi(null, ultraRpc, null)
    }

    this._peginEth = _configs.pToken.toLowerCase() === constants.pTokens.pETH
  }

  /**
   * @param {String|BigNumber|BN} _amount in wei
   * @param {String} _hostAccount
   * @param {IssueOptions} _options
   */
  issue(_amount, _hostAccount, _options = {}) {
    return this._issue(_amount, _hostAccount, null, _options)
  }

  /**
   * @param {String|BigNumber|BN} _amount in wei
   * @param {String} _hostAccount
   * @param {String} _metadata
   * @param {IssueOptions} _options
   */
  issueWithMetadata(_amount, _hostAccount, _metadata, _options = {}) {
    return this._issue(_amount, _hostAccount, _metadata, _options)
  }

  /**
   * @param {String|BigNumber|BN} _amount in wei
   * @param {String} _hostAccount
   * @param {String} _metadata
   * @param {IssueOptions} _options
   */
  _issue(_amount, _hostAccount, _metadata, _options = {}) {
    const promiEvent = Web3PromiEvent()
    const start = async () => {
      try {
        const { gas, gasPrice } = _options
        const { blockchains } = constants
        await this._loadData()

        const minimumAmount = minimumAmounts[this.pToken.toLowerCase()].issue
        if (BigNumber(_amount).isLessThan(minimumAmount)) {
          promiEvent.reject(`Impossible to issue less than ${minimumAmount}`)
          return
        }

        const isValidAddress = {
          [constants.blockchains.Ethereum]: _address => Web3Utils.isAddress(_address),
          [constants.blockchains.BinanceSmartChain]: _address => Web3Utils.isAddress(_address),
          [constants.blockchains.Xdai]: _address => Web3Utils.isAddress(_address),
          [constants.blockchains.Eosio]: _address => eos.isValidAccountName(_address),
          [constants.blockchains.Telos]: _address => eos.isValidAccountName(_address),
          [constants.blockchains.Ultra]: _address => eos.isValidAccountName(_address)
        }
        if (!isValidAddress[this.hostBlockchain](_hostAccount)) {
          promiEvent.reject('Invalid host account')
          return
        }

        if (!this.selectedNode) await this.select()

        let ethTxHash = null
        const waitForEthTransaction = () =>
          new Promise((_resolve, _reject) => {
            eth[this.ethPrivateKey ? 'sendSignedMethodTx' : 'makeContractSend'](
              this.web3,
              this._peginEth ? 'pegInEth' : 'pegIn',
              {
                privateKey: this.ethPrivateKey,
                abi: abi.pERC20Vault,
                gas,
                gasPrice,
                contractAddress: eth.addHexPrefix(this.nativeVaultAddress),
                value: this._peginEth ? _amount : 0
              },
              _metadata
                ? this._peginEth
                  ? [_hostAccount, _metadata]
                  : [_amount, this.nativeContractAddress, _hostAccount, _metadata]
                : this._peginEth
                  ? [_hostAccount]
                  : [_amount, this.nativeContractAddress, _hostAccount]
            )
              .once('transactionHash', _hash => {
                ethTxHash = _hash
                promiEvent.eventEmitter.emit('nativeTxBroadcasted', ethTxHash)
              })
              .once('receipt', _resolve)
              .once('error', _reject)
          })
        const ethTxReceipt = await waitForEthTransaction()
        promiEvent.eventEmitter.emit('nativeTxConfirmed', ethTxReceipt)

        const incomingTxReport = await this.selectedNode.monitorIncomingTransaction(ethTxHash, promiEvent.eventEmitter)

        let hostTxReceipt
        if (this.hostBlockchain === blockchains.Eosio || this.hostBlockchain === blockchains.Telos)
          hostTxReceipt = await eos.waitForTransactionConfirmation(this.hostApi, incomingTxReport.broadcast_tx_hash)

        if (this.hostBlockchain === blockchains.Xdai || this.hostBlockchain === blockchains.BinanceSmartChain)
          hostTxReceipt = await eth.waitForTransactionConfirmation(this.hostApi, incomingTxReport.broadcast_tx_hash)

        promiEvent.eventEmitter.emit('hostTxConfirmed', hostTxReceipt)
        promiEvent.resolve({
          to: _hostAccount,
          nativeTx: ethTxHash,
          hostTx: incomingTxReport.broadcast_tx_hash,
          amount: BigNumber(_amount).toFixed()
        })
      } catch (_err) {
        promiEvent.reject(_err)
      }
    }

    start()
    return promiEvent.eventEmitter
  }

  /**
   *
   * @param {string|number} _amount
   * @param {string} _nativeAccount
   * @param {Options} _options
   */
  redeem(_amount, _nativeAccount, _options = {}) {
    return this._redeem(_amount, _nativeAccount, null, _options)
  }

  /**
   * @param {String|BigNumber|BN} _amount in wei
   * @param {String} _nativeAccount
   * @param {String} _metadata
   * @param {IssueOptions} _options
   */
  redeemWithMetadata(_amount, _nativeAccount, _metadata, _options = {}) {
    return this._redeem(_amount, _nativeAccount, _metadata, _options)
  }

  /**
   *
   * @param {string|number} _amount
   * @param {string} _nativeAccount
   * @param {string} _metadata
   * @param {Options} _options
   */
  _redeem(_amount, _nativeAccount, _metadata, _options = {}) {
    const promiEvent = Web3PromiEvent()

    const start = async () => {
      try {
        const { blocksBehind, expireSeconds, permission, gas, gasPrice, actor } = _options
        const { blockchains, pTokens } = constants

        await this._loadData()

        const minimumAmount = minimumAmounts[this.pToken.toLowerCase()].redeem[this.hostBlockchain]
        if (BigNumber(_amount).isLessThan(minimumAmount)) {
          promiEvent.reject(`Impossible to redeem less than ${minimumAmount}`)
          return
        }

        if (this.nativeBlockchain === blockchains.Ethereum && !Web3Utils.isAddress(_nativeAccount)) {
          promiEvent.reject('Invalid native account')
          return
        }

        if (!this.selectedNode) await this.select()

        const { redeemFromEosio, redeemFromEvmCompatible } = redeemFrom

        let hostTxHash
        if (this.hostBlockchain === blockchains.BinanceSmartChain || this.hostBlockchain === blockchains.Xdai) {
          const hostTxReceipt = await redeemFromEvmCompatible(
            this.hostApi,
            {
              privateKey: this.hostPrivateKey,
              gas,
              gasPrice,
              contractAddress: this.hostContractAddress,
              value: 0
            },
            _metadata ? [_amount, _metadata, _nativeAccount] : [_amount, _nativeAccount],
            promiEvent,
            'hostTxBroadcasted'
          )

          promiEvent.eventEmitter.emit('hostTxConfirmed', hostTxReceipt)
          hostTxHash = hostTxReceipt.transactionHash
        }

        if (
          this.hostBlockchain === blockchains.Eosio ||
          this.hostBlockchain === blockchains.Telos ||
          this.hostBlockchain === blockchains.Ultra
        ) {
          const hostTxReceipt = await redeemFromEosio(
            this.hostApi,
            _amount,
            _nativeAccount,
            mapDecimals[this.pToken.toLowerCase()]
              ? mapDecimals[this.pToken.toLowerCase()][this.hostBlockchain][this.hostNetwork]
              : 9,
            this.hostContractAddress,
            this.pToken === pTokens.pWETH ? 'peth' : this.pToken,
            { blocksBehind, expireSeconds, permission, actor }
          )

          promiEvent.eventEmitter.emit('hostTxConfirmed', hostTxReceipt)
          hostTxHash = hostTxReceipt.transaction_id
        }

        const incomingTxReport = await this.selectedNode.monitorIncomingTransaction(hostTxHash, promiEvent.eventEmitter)
        const nativeTxReceipt = await eth.waitForTransactionConfirmation(this.web3, incomingTxReport.broadcast_tx_hash)
        promiEvent.eventEmitter.emit('nativeTxConfirmed', nativeTxReceipt)

        promiEvent.resolve({
          to: _nativeAccount,
          nativeTx: nativeTxReceipt.transactionHash,
          hostTx: hostTxHash,
          amount: BigNumber(_amount).toFixed()
        })
      } catch (_err) {
        promiEvent.reject(_err)
      }
    }

    start()
    return promiEvent.eventEmitter
  }

  async _loadData() {
    try {
      if (!this.selectedNode) await this.select()
      if (!this.nativeContractAddress || !this.hostContractAddress) {
        const {
          native_smart_contract_address,
          host_smart_contract_address,
          native_vault_address
        } = await this.selectedNode.getInfo()
        this.nativeContractAddress = eth.addHexPrefix(native_smart_contract_address)
        this.hostContractAddress =
          this.hostBlockchain === constants.blockchains.Eosio ||
          this.hostBlockchain === constants.blockchains.Telos ||
          this.hostBlockchain === constants.blockchains.Ultra
            ? host_smart_contract_address
            : eth.addHexPrefix(host_smart_contract_address)
        this.nativeVaultAddress = native_vault_address ? eth.addHexPrefix(native_vault_address) : null
      }
    } catch (_err) {
      throw new Error(`Error during loading data: ${_err.message}`)
    }
  }
}
