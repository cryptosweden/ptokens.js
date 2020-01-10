<img src="./resources/docs/img/ptokens-js.png" width="150" height="150">

# ptokens.js | pTokens Javascript API

Javascript module for interacting with pTokens.

&nbsp;

***

&nbsp;

### :rocket: Installation:

```
npm install ptokens
```

&nbsp;

***

&nbsp;

### :zap: Usage: 

```js
const pTokens = require('ptokens')

const ptokens = new pTokens({
  peos: {
    ethPrivateKey: 'Eth private key',
    ethProvider: 'Eth provider',
    eosPrivateKey: 'EOS private key',
    eosRpc: 'EOS RPC Address'
    eosSignatureProvider: 'An EOS Signature Provider'  //if the private key is not passed
  },
  pbtc: {
    ethPrivateKey: 'Eth private key',
    ethProvider: 'Eth provider',
    btcNetwork: 'testnet'  //'testnet' or 'bitcoin', default 'testnet'
  }
})
```
It is possible to pass a standard Ethereum Provider as the __`ethProvider`__ value, such as the one injected 
into the content script of each web page by Metamask(__`window.web3.currentProvider`__).

```js
const pTokens = require('ptokens')

if (window.web3) {
  
  const ptokens = new pTokens({
    peos: {
      ethProvider: window.web3.currentProvider,
      ....
    },
    pbtc: {
      ethProvider: window.web3.currentProvider,
      btcNetwork: 'bitcoin'
    }
  })
} else {
  console.log('No web3 detected')
}
```

### Example of generating a pBTC Deposit Address

```js
ptokens.pbtc.getDepositAddress(ethAddress)
  .then(depositAddress => {
    console.log(depositAddress.toString())
    
    //fund the BTC address just generated (not ptokens.js stuff)

    depositAddress.waitForDeposit()
      .once('onBtcTxBroadcasted', tx => ... )
      .once('onBtcTxConfirmed', tx => ...)
      .once('onEnclaveReceivedTx', tx => ...)
      .once('onEnclaveBroadcastedTx', tx => ...)
      .once('onEthTxConfirmed', tx => ...)
      .then(res => ...))
  })
  .catch(err => ...)
```

&nbsp;

***

&nbsp;

### :house_with_garden: Environment setup:

Clone the __`ptokens.js`__ repo:

```
git clone https://github.com/provable-things/ptokens.js.git
```

Switch into the __`ptokens.js`__:

```
cd ptokens.js
```

Install and link dependencies:

```
npm run init
```

Build all packages

```
npm run build
```

Bootstrap all packages

```
npm run bootstrap
```

&nbsp;

***

&nbsp;

### :guardsman: Tests:

```
npm run test
```

&nbsp;

***

&nbsp;

### :page_with_curl: Run and Build the documentation:

Please be sure to have installed [__`mkdocs`__](https://www.mkdocs.org/), [__`python 2.7`__](https://www.python.org/) and __`pip`__.

Switch into __`resources`__ folder:

```
cd resources
```

If you want to run the documentation locally:

```
mkdocs serve
```

If you want to build the documentation:

```
mkdocs build
```