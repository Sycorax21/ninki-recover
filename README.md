# ninki-recover

Download this repository (click on the 'Download ZIP' button to your right) to recover your bitcoins from Ninki Wallet using the online and offline key phrases and your master public key.

Extract the downloaded zip file, run recover.html using Chrome browser

What you need:

* Your offline key phrase - a 12 word phrase (in older accounts this was 24 words and called cold key)
* Your online key phrase - a 12 word phrase (in older accounts this was 24 words and called hot key)
* Your master public key a long string beginning with xpub

***If pasting the phrases from a password manager, be careful not to paste extra characters at the end of the phrase.***

# Changed From Original From Here On

Modified steps (Compared to original):

1. Enter your Offline Key Phrase, Online Key Phrase, then your XPUB.
2. Click next for each entry from above.
3. Click scan addresses, this step modified from original. Now derives 10 addresses using your keys, this can be changed within the script if your address does not appear.
4. After finding the correct address, recover the UTXO information (TXID, Index/Vout, Current Address, and desired transaction value in Satoshis).
5. Click next to proceed.
6. Enter the desired address you want to transfer the funds to. Please note that will need a legacy address (Starting with 1 or 3).
7. Enter your UTXO in JSON format. This tool is essentially hardcoded with a fee of 10000, you can change this in the recover.js file if you'd like. It worked for me so I didn't bother touching this script any further.
8. Click on "Claim Funds".
9. You will be presented with a raw transaction hex. Please copy/note this value.
10. Broadcast the transaction on your preferred online tool (Such as on https://www.blockchain.com/explorer/assets/btc/broadcast-transaction).
    
Notes:

My journey of recoverying my long lost BTC started a long time ago... in a galaxy far far away... After several attempts every few months/years, after trying various APIs, rewrites, etc., I decided to re-use the old libraries. I think the idea behind this wallet was pretty forward thinking and unique - trying to get this tool working was quite the learning curve and led to a real admiration for the work that went into both the original wallet and the recovery tool. I had to re-use the old libraries as the more up-to-date ones would give me different outputs; outputs that needed to be re-used as inputs for the recovery process. Rambling aside, I hope this helps someone in the future as much as my formerly-trapped funds will be helping me in the present.

- I originally tried with a newer "bc1..." address, this failed because the older libraries contained in this package do not recognize them. Try creating a wallet that supports legacy addresses to get around this limitation.
- The transaction fee can be adjusted, I eagerly "tested" the script with the 10,000 satoshis to leave little room for error. I had little appetite for any delays/failures, so I wasn't focused on a more reasonable transaction fee. You can change this value if you'd like.
- Ensuring your keys generate the correct address seems fairly vital to this process, you can increase this in the script if your address does not show up (Currently 10). If you do not know your address, unfortunately this would be the painful task of checking each generated address to try and find your funds.
- I have provided a sample of what the JSON UTXO would look like:

Sample:

[
  {
    "transaction_hash": "abc123...",
    "output_index": 0,
    "address": "3XYZexampleAddress...",
    "value": 1500000
  }
]

If unchanged, the transaction fee of 10000 will be deducted from the value you enter, based on the sample value this would result in you receiving "only" 1,490,000 after the fee is deducted. A small price to pay if you already considered them unrecoverable. :)
