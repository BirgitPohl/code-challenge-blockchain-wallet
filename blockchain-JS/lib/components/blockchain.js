"use strict";

var SHA256 = require('crypto-js/sha256');

var EC = require('elliptic').ec;

var ec = new EC('secp256k1');

class Transaction {
  constructor(fromAddress, toAddress, amount, payload) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.payload = payload;
    this.timestamp = Date.now();
  }

  calculateHash() {
    return SHA256(this.fromAddress + this.toAddress, +this.amount + this.payload + this.timestamp).toString();
  }

  signTransaction(signingKey) {
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('You cannot sign transactions for other wallets!');
    }

    var hashTransaction = this.calculateHash();
    var sig = signingKey.sign(hashTransaction, 'base64');
    this.signature = sig.toDER('hex');
  }

  isValid() {
    //TODO
    if (this.fromAddress === null) return false;

    if (!this.signature || this.signature.length === 0) {
      throw new Error('No signature in this transaction');
    }

    var publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature);
  }

}

class Block {
  constructor(timestamp, transactions) {
    var previousHash = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    this.timestamp = timestamp; //TODO: change data to payload and add amount

    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return SHA256(this.index + this.timestamp + JSON.stringify(this.transactions) + this.previousHash + this.nonce).toString();
  }

  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    console.log('Block mined: ' + this.hash);
  }

  hasValidTransactions() {
    for (var tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }

    return true;
  }

}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  createGenesisBlock() {
    return new Block('01.01.2019', 'Genesis block', '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    var rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx); //TODO: Miners should choose which tx they want to mine

    var block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
    block.mineBlock(this.difficulty);
    console.log('Block successfully mined!');
    this.chain.push(block);
    this.pendingTransactions = [];
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address');
    }

    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to the chain!');
    }

    this.pendingTransactions.push(transaction);
  }

  getBalanceOfAddress(address) {
    var balance = 0;

    for (var block of this.chain) {
      for (var trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  isChainValid() {
    for (var i = 1; i < this.chain.length; i++) {
      var currentBlock = this.chain[i];
      var previousBlock = this.chain[i - 1];

      if (!currentBlock.hasValidtransactions) {
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }

}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9jb21wb25lbnRzL2Jsb2NrY2hhaW4uanMiXSwibmFtZXMiOlsiU0hBMjU2IiwicmVxdWlyZSIsIkVDIiwiZWMiLCJUcmFuc2FjdGlvbiIsImNvbnN0cnVjdG9yIiwiZnJvbUFkZHJlc3MiLCJ0b0FkZHJlc3MiLCJhbW91bnQiLCJwYXlsb2FkIiwidGltZXN0YW1wIiwiRGF0ZSIsIm5vdyIsImNhbGN1bGF0ZUhhc2giLCJ0b1N0cmluZyIsInNpZ25UcmFuc2FjdGlvbiIsInNpZ25pbmdLZXkiLCJnZXRQdWJsaWMiLCJFcnJvciIsImhhc2hUcmFuc2FjdGlvbiIsInNpZyIsInNpZ24iLCJzaWduYXR1cmUiLCJ0b0RFUiIsImlzVmFsaWQiLCJsZW5ndGgiLCJwdWJsaWNLZXkiLCJrZXlGcm9tUHVibGljIiwidmVyaWZ5IiwiQmxvY2siLCJ0cmFuc2FjdGlvbnMiLCJwcmV2aW91c0hhc2giLCJoYXNoIiwibm9uY2UiLCJpbmRleCIsIkpTT04iLCJzdHJpbmdpZnkiLCJtaW5lQmxvY2siLCJkaWZmaWN1bHR5Iiwic3Vic3RyaW5nIiwiQXJyYXkiLCJqb2luIiwiY29uc29sZSIsImxvZyIsImhhc1ZhbGlkVHJhbnNhY3Rpb25zIiwidHgiLCJCbG9ja2NoYWluIiwiY2hhaW4iLCJjcmVhdGVHZW5lc2lzQmxvY2siLCJwZW5kaW5nVHJhbnNhY3Rpb25zIiwibWluaW5nUmV3YXJkIiwiZ2V0TGF0ZXN0QmxvY2siLCJtaW5lUGVuZGluZ1RyYW5zYWN0aW9ucyIsIm1pbmluZ1Jld2FyZEFkZHJlc3MiLCJyZXdhcmRUeCIsInB1c2giLCJibG9jayIsImFkZFRyYW5zYWN0aW9uIiwidHJhbnNhY3Rpb24iLCJnZXRCYWxhbmNlT2ZBZGRyZXNzIiwiYWRkcmVzcyIsImJhbGFuY2UiLCJ0cmFucyIsImlzQ2hhaW5WYWxpZCIsImkiLCJjdXJyZW50QmxvY2siLCJwcmV2aW91c0Jsb2NrIiwiaGFzVmFsaWR0cmFuc2FjdGlvbnMiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBLElBQU1BLE1BQU0sR0FBR0MsT0FBTyxDQUFDLGtCQUFELENBQXRCOztBQUNBLElBQU1DLEVBQUUsR0FBR0QsT0FBTyxDQUFDLFVBQUQsQ0FBUCxDQUFvQkUsRUFBL0I7O0FBQ0EsSUFBTUEsRUFBRSxHQUFHLElBQUlELEVBQUosQ0FBTyxXQUFQLENBQVg7O0FBRUEsTUFBTUUsV0FBTixDQUFrQjtBQUNkQyxFQUFBQSxXQUFXLENBQUNDLFdBQUQsRUFBY0MsU0FBZCxFQUF5QkMsTUFBekIsRUFBaUNDLE9BQWpDLEVBQTBDO0FBQ2pELFNBQUtILFdBQUwsR0FBbUJBLFdBQW5CO0FBQ0EsU0FBS0MsU0FBTCxHQUFpQkEsU0FBakI7QUFDQSxTQUFLQyxNQUFMLEdBQWNBLE1BQWQ7QUFDQSxTQUFLQyxPQUFMLEdBQWVBLE9BQWY7QUFDQSxTQUFLQyxTQUFMLEdBQWlCQyxJQUFJLENBQUNDLEdBQUwsRUFBakI7QUFDSDs7QUFFREMsRUFBQUEsYUFBYSxHQUFFO0FBQ1gsV0FBT2IsTUFBTSxDQUFDLEtBQUtNLFdBQUwsR0FBbUIsS0FBS0MsU0FBekIsRUFBb0MsQ0FBRSxLQUFLQyxNQUFQLEdBQWdCLEtBQUtDLE9BQXJCLEdBQStCLEtBQUtDLFNBQXhFLENBQU4sQ0FBeUZJLFFBQXpGLEVBQVA7QUFDSDs7QUFFREMsRUFBQUEsZUFBZSxDQUFDQyxVQUFELEVBQVk7QUFDdkIsUUFBR0EsVUFBVSxDQUFDQyxTQUFYLENBQXFCLEtBQXJCLE1BQWdDLEtBQUtYLFdBQXhDLEVBQW9EO0FBQ2hELFlBQU0sSUFBSVksS0FBSixDQUFVLGlEQUFWLENBQU47QUFDSDs7QUFFRCxRQUFNQyxlQUFlLEdBQUcsS0FBS04sYUFBTCxFQUF4QjtBQUNBLFFBQU1PLEdBQUcsR0FBR0osVUFBVSxDQUFDSyxJQUFYLENBQWdCRixlQUFoQixFQUFpQyxRQUFqQyxDQUFaO0FBQ0EsU0FBS0csU0FBTCxHQUFpQkYsR0FBRyxDQUFDRyxLQUFKLENBQVUsS0FBVixDQUFqQjtBQUNIOztBQUVEQyxFQUFBQSxPQUFPLEdBQUU7QUFDTjtBQUNDLFFBQUcsS0FBS2xCLFdBQUwsS0FBcUIsSUFBeEIsRUFBOEIsT0FBTyxLQUFQOztBQUUvQixRQUFHLENBQUMsS0FBS2dCLFNBQU4sSUFBbUIsS0FBS0EsU0FBTCxDQUFlRyxNQUFmLEtBQTBCLENBQWhELEVBQWtEO0FBQzlDLFlBQU0sSUFBSVAsS0FBSixDQUFVLGtDQUFWLENBQU47QUFDSDs7QUFFRCxRQUFNUSxTQUFTLEdBQUd2QixFQUFFLENBQUN3QixhQUFILENBQWlCLEtBQUtyQixXQUF0QixFQUFtQyxLQUFuQyxDQUFsQjtBQUNBLFdBQU9vQixTQUFTLENBQUNFLE1BQVYsQ0FBaUIsS0FBS2YsYUFBTCxFQUFqQixFQUF1QyxLQUFLUyxTQUE1QyxDQUFQO0FBQ0Y7O0FBakNhOztBQW9DbEIsTUFBTU8sS0FBTixDQUFZO0FBQ1J4QixFQUFBQSxXQUFXLENBQUNLLFNBQUQsRUFBWW9CLFlBQVosRUFBNkM7QUFBQSxRQUFuQkMsWUFBbUIsdUVBQUosRUFBSTtBQUNwRCxTQUFLckIsU0FBTCxHQUFpQkEsU0FBakIsQ0FEb0QsQ0FFcEQ7O0FBQ0EsU0FBS29CLFlBQUwsR0FBb0JBLFlBQXBCO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQkEsWUFBcEI7QUFDQSxTQUFLQyxJQUFMLEdBQVksS0FBS25CLGFBQUwsRUFBWjtBQUNBLFNBQUtvQixLQUFMLEdBQWEsQ0FBYjtBQUNIOztBQUVEcEIsRUFBQUEsYUFBYSxHQUFHO0FBQ1osV0FBT2IsTUFBTSxDQUFDLEtBQUtrQyxLQUFMLEdBQWEsS0FBS3hCLFNBQWxCLEdBQThCeUIsSUFBSSxDQUFDQyxTQUFMLENBQWUsS0FBS04sWUFBcEIsQ0FBOUIsR0FDWCxLQUFLQyxZQURNLEdBQ1MsS0FBS0UsS0FEZixDQUFOLENBQzRCbkIsUUFENUIsRUFBUDtBQUVIOztBQUVEdUIsRUFBQUEsU0FBUyxDQUFDQyxVQUFELEVBQWE7QUFDbEIsV0FBTSxLQUFLTixJQUFMLENBQVVPLFNBQVYsQ0FBb0IsQ0FBcEIsRUFBdUJELFVBQXZCLE1BQ05FLEtBQUssQ0FBQ0YsVUFBVSxHQUFHLENBQWQsQ0FBTCxDQUFzQkcsSUFBdEIsQ0FBMkIsR0FBM0IsQ0FEQSxFQUNpQztBQUM3QixXQUFLUixLQUFMO0FBQ0EsV0FBS0QsSUFBTCxHQUFZLEtBQUtuQixhQUFMLEVBQVo7QUFDSDs7QUFFRDZCLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGtCQUFrQixLQUFLWCxJQUFuQztBQUNIOztBQUVEWSxFQUFBQSxvQkFBb0IsR0FBRTtBQUNsQixTQUFLLElBQU1DLEVBQVgsSUFBaUIsS0FBS2YsWUFBdEIsRUFBbUM7QUFDL0IsVUFBRyxDQUFDZSxFQUFFLENBQUNyQixPQUFILEVBQUosRUFBaUI7QUFDYixlQUFPLEtBQVA7QUFDSDtBQUNKOztBQUVELFdBQU8sSUFBUDtBQUNIOztBQWpDTzs7QUFxQ1osTUFBTXNCLFVBQU4sQ0FBZ0I7QUFDWnpDLEVBQUFBLFdBQVcsR0FBRTtBQUNULFNBQUswQyxLQUFMLEdBQWEsQ0FBQyxLQUFLQyxrQkFBTCxFQUFELENBQWI7QUFDQSxTQUFLVixVQUFMLEdBQWtCLENBQWxCO0FBQ0EsU0FBS1csbUJBQUwsR0FBMkIsRUFBM0I7QUFDQSxTQUFLQyxZQUFMLEdBQW9CLEdBQXBCO0FBQ0g7O0FBRURGLEVBQUFBLGtCQUFrQixHQUFHO0FBQ2pCLFdBQU8sSUFBSW5CLEtBQUosQ0FBVSxZQUFWLEVBQXdCLGVBQXhCLEVBQXlDLEdBQXpDLENBQVA7QUFDSDs7QUFFRHNCLEVBQUFBLGNBQWMsR0FBRztBQUNiLFdBQU8sS0FBS0osS0FBTCxDQUFXLEtBQUtBLEtBQUwsQ0FBV3RCLE1BQVgsR0FBb0IsQ0FBL0IsQ0FBUDtBQUNIOztBQUVEMkIsRUFBQUEsdUJBQXVCLENBQUNDLG1CQUFELEVBQXNCO0FBQ3pDLFFBQU1DLFFBQVEsR0FBRyxJQUFJbEQsV0FBSixDQUFnQixJQUFoQixFQUFzQmlELG1CQUF0QixFQUEyQyxLQUFLSCxZQUFoRCxDQUFqQjtBQUNBLFNBQUtELG1CQUFMLENBQXlCTSxJQUF6QixDQUE4QkQsUUFBOUIsRUFGeUMsQ0FJekM7O0FBQ0EsUUFBSUUsS0FBSyxHQUFHLElBQUkzQixLQUFKLENBQVVsQixJQUFJLENBQUNDLEdBQUwsRUFBVixFQUFzQixLQUFLcUMsbUJBQTNCLEVBQWdELEtBQUtFLGNBQUwsR0FBc0JuQixJQUF0RSxDQUFaO0FBQ0F3QixJQUFBQSxLQUFLLENBQUNuQixTQUFOLENBQWdCLEtBQUtDLFVBQXJCO0FBRUFJLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLDJCQUFaO0FBQ0EsU0FBS0ksS0FBTCxDQUFXUSxJQUFYLENBQWdCQyxLQUFoQjtBQUVBLFNBQUtQLG1CQUFMLEdBQTJCLEVBQTNCO0FBQ0g7O0FBRURRLEVBQUFBLGNBQWMsQ0FBQ0MsV0FBRCxFQUFhO0FBRXZCLFFBQUcsQ0FBQ0EsV0FBVyxDQUFDcEQsV0FBYixJQUE0QixDQUFDb0QsV0FBVyxDQUFDbkQsU0FBNUMsRUFBc0Q7QUFDbEQsWUFBTSxJQUFJVyxLQUFKLENBQVUsOENBQVYsQ0FBTjtBQUNIOztBQUVELFFBQUcsQ0FBQ3dDLFdBQVcsQ0FBQ2xDLE9BQVosRUFBSixFQUEwQjtBQUN0QixZQUFNLElBQUlOLEtBQUosQ0FBVSw4Q0FBVixDQUFOO0FBQ0g7O0FBRUQsU0FBSytCLG1CQUFMLENBQXlCTSxJQUF6QixDQUE4QkcsV0FBOUI7QUFDSDs7QUFFREMsRUFBQUEsbUJBQW1CLENBQUNDLE9BQUQsRUFBUztBQUN4QixRQUFJQyxPQUFPLEdBQUcsQ0FBZDs7QUFFQSxTQUFJLElBQU1MLEtBQVYsSUFBbUIsS0FBS1QsS0FBeEIsRUFBOEI7QUFDMUIsV0FBSSxJQUFNZSxLQUFWLElBQW1CTixLQUFLLENBQUMxQixZQUF6QixFQUFzQztBQUNsQyxZQUFJZ0MsS0FBSyxDQUFDeEQsV0FBTixLQUFzQnNELE9BQTFCLEVBQWtDO0FBQzlCQyxVQUFBQSxPQUFPLElBQUlDLEtBQUssQ0FBQ3RELE1BQWpCO0FBQ0g7O0FBRUQsWUFBSXNELEtBQUssQ0FBQ3ZELFNBQU4sS0FBb0JxRCxPQUF4QixFQUFnQztBQUM1QkMsVUFBQUEsT0FBTyxJQUFJQyxLQUFLLENBQUN0RCxNQUFqQjtBQUNIO0FBQ0o7QUFDSjs7QUFFRCxXQUFPcUQsT0FBUDtBQUNIOztBQUVERSxFQUFBQSxZQUFZLEdBQUc7QUFDWCxTQUFJLElBQUlDLENBQUMsR0FBRyxDQUFaLEVBQWVBLENBQUMsR0FBRyxLQUFLakIsS0FBTCxDQUFXdEIsTUFBOUIsRUFBc0N1QyxDQUFDLEVBQXZDLEVBQTJDO0FBQ3ZDLFVBQU1DLFlBQVksR0FBRyxLQUFLbEIsS0FBTCxDQUFXaUIsQ0FBWCxDQUFyQjtBQUNBLFVBQU1FLGFBQWEsR0FBRyxLQUFLbkIsS0FBTCxDQUFXaUIsQ0FBQyxHQUFHLENBQWYsQ0FBdEI7O0FBRUEsVUFBRyxDQUFDQyxZQUFZLENBQUNFLG9CQUFqQixFQUFzQztBQUNsQyxlQUFPLEtBQVA7QUFDSDs7QUFFRCxVQUFHRixZQUFZLENBQUNqQyxJQUFiLEtBQXNCaUMsWUFBWSxDQUFDcEQsYUFBYixFQUF6QixFQUF1RDtBQUNuRCxlQUFPLEtBQVA7QUFDSDs7QUFFRCxVQUFHb0QsWUFBWSxDQUFDbEMsWUFBYixLQUE4Qm1DLGFBQWEsQ0FBQ2xDLElBQS9DLEVBQW9EO0FBQ2hELGVBQU8sS0FBUDtBQUNIO0FBQ0o7O0FBRUQsV0FBTyxJQUFQO0FBQ0g7O0FBaEZXOztBQW1GaEJvQyxNQUFNLENBQUNDLE9BQVAsQ0FBZXZCLFVBQWYsR0FBNEJBLFVBQTVCO0FBQ0FzQixNQUFNLENBQUNDLE9BQVAsQ0FBZWpFLFdBQWYsR0FBNkJBLFdBQTdCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgU0hBMjU2ID0gcmVxdWlyZSgnY3J5cHRvLWpzL3NoYTI1NicpO1xuY29uc3QgRUMgPSByZXF1aXJlKCdlbGxpcHRpYycpLmVjO1xuY29uc3QgZWMgPSBuZXcgRUMoJ3NlY3AyNTZrMScpO1xuXG5jbGFzcyBUcmFuc2FjdGlvbiB7XG4gICAgY29uc3RydWN0b3IoZnJvbUFkZHJlc3MsIHRvQWRkcmVzcywgYW1vdW50LCBwYXlsb2FkKSB7XG4gICAgICAgIHRoaXMuZnJvbUFkZHJlc3MgPSBmcm9tQWRkcmVzcztcbiAgICAgICAgdGhpcy50b0FkZHJlc3MgPSB0b0FkZHJlc3M7XG4gICAgICAgIHRoaXMuYW1vdW50ID0gYW1vdW50O1xuICAgICAgICB0aGlzLnBheWxvYWQgPSBwYXlsb2FkO1xuICAgICAgICB0aGlzLnRpbWVzdGFtcCA9IERhdGUubm93KCk7XG4gICAgfVxuXG4gICAgY2FsY3VsYXRlSGFzaCgpe1xuICAgICAgICByZXR1cm4gU0hBMjU2KHRoaXMuZnJvbUFkZHJlc3MgKyB0aGlzLnRvQWRkcmVzcywgKyB0aGlzLmFtb3VudCArIHRoaXMucGF5bG9hZCArIHRoaXMudGltZXN0YW1wKS50b1N0cmluZygpO1xuICAgIH1cblxuICAgIHNpZ25UcmFuc2FjdGlvbihzaWduaW5nS2V5KXtcbiAgICAgICAgaWYoc2lnbmluZ0tleS5nZXRQdWJsaWMoJ2hleCcpICE9PSB0aGlzLmZyb21BZGRyZXNzKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignWW91IGNhbm5vdCBzaWduIHRyYW5zYWN0aW9ucyBmb3Igb3RoZXIgd2FsbGV0cyEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhhc2hUcmFuc2FjdGlvbiA9IHRoaXMuY2FsY3VsYXRlSGFzaCgpO1xuICAgICAgICBjb25zdCBzaWcgPSBzaWduaW5nS2V5LnNpZ24oaGFzaFRyYW5zYWN0aW9uLCAnYmFzZTY0Jyk7XG4gICAgICAgIHRoaXMuc2lnbmF0dXJlID0gc2lnLnRvREVSKCdoZXgnKTtcbiAgICB9XG5cbiAgICBpc1ZhbGlkKCl7XG4gICAgICAgLy9UT0RPXG4gICAgICAgIGlmKHRoaXMuZnJvbUFkZHJlc3MgPT09IG51bGwpIHJldHVybiBmYWxzZTsgXG4gICAgICAgXG4gICAgICAgaWYoIXRoaXMuc2lnbmF0dXJlIHx8IHRoaXMuc2lnbmF0dXJlLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gc2lnbmF0dXJlIGluIHRoaXMgdHJhbnNhY3Rpb24nKTtcbiAgICAgICB9XG5cbiAgICAgICBjb25zdCBwdWJsaWNLZXkgPSBlYy5rZXlGcm9tUHVibGljKHRoaXMuZnJvbUFkZHJlc3MsICdoZXgnKTtcbiAgICAgICByZXR1cm4gcHVibGljS2V5LnZlcmlmeSh0aGlzLmNhbGN1bGF0ZUhhc2goKSwgdGhpcy5zaWduYXR1cmUpO1xuICAgIH1cbn1cblxuY2xhc3MgQmxvY2sge1xuICAgIGNvbnN0cnVjdG9yKHRpbWVzdGFtcCwgdHJhbnNhY3Rpb25zLCBwcmV2aW91c0hhc2ggPSAnJykge1xuICAgICAgICB0aGlzLnRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgLy9UT0RPOiBjaGFuZ2UgZGF0YSB0byBwYXlsb2FkIGFuZCBhZGQgYW1vdW50XG4gICAgICAgIHRoaXMudHJhbnNhY3Rpb25zID0gdHJhbnNhY3Rpb25zO1xuICAgICAgICB0aGlzLnByZXZpb3VzSGFzaCA9IHByZXZpb3VzSGFzaDtcbiAgICAgICAgdGhpcy5oYXNoID0gdGhpcy5jYWxjdWxhdGVIYXNoKCk7XG4gICAgICAgIHRoaXMubm9uY2UgPSAwO1xuICAgIH1cblxuICAgIGNhbGN1bGF0ZUhhc2goKSB7XG4gICAgICAgIHJldHVybiBTSEEyNTYodGhpcy5pbmRleCArIHRoaXMudGltZXN0YW1wICsgSlNPTi5zdHJpbmdpZnkodGhpcy50cmFuc2FjdGlvbnMpXG4gICAgICAgICArIHRoaXMucHJldmlvdXNIYXNoICsgdGhpcy5ub25jZSkudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICBtaW5lQmxvY2soZGlmZmljdWx0eSkge1xuICAgICAgICB3aGlsZSh0aGlzLmhhc2guc3Vic3RyaW5nKDAsIGRpZmZpY3VsdHkpICE9PSBcbiAgICAgICAgQXJyYXkoZGlmZmljdWx0eSArIDEpLmpvaW4oJzAnKSkge1xuICAgICAgICAgICAgdGhpcy5ub25jZSsrO1xuICAgICAgICAgICAgdGhpcy5oYXNoID0gdGhpcy5jYWxjdWxhdGVIYXNoKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygnQmxvY2sgbWluZWQ6ICcgKyB0aGlzLmhhc2gpO1xuICAgIH1cblxuICAgIGhhc1ZhbGlkVHJhbnNhY3Rpb25zKCl7XG4gICAgICAgIGZvciAoY29uc3QgdHggb2YgdGhpcy50cmFuc2FjdGlvbnMpe1xuICAgICAgICAgICAgaWYoIXR4LmlzVmFsaWQoKSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuXG5cbmNsYXNzIEJsb2NrY2hhaW57XG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgICAgdGhpcy5jaGFpbiA9IFt0aGlzLmNyZWF0ZUdlbmVzaXNCbG9jaygpXTtcbiAgICAgICAgdGhpcy5kaWZmaWN1bHR5ID0gMjtcbiAgICAgICAgdGhpcy5wZW5kaW5nVHJhbnNhY3Rpb25zID0gW107XG4gICAgICAgIHRoaXMubWluaW5nUmV3YXJkID0gMTAwO1xuICAgIH1cblxuICAgIGNyZWF0ZUdlbmVzaXNCbG9jaygpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBCbG9jaygnMDEuMDEuMjAxOScsICdHZW5lc2lzIGJsb2NrJywgJzAnKTtcbiAgICB9XG5cbiAgICBnZXRMYXRlc3RCbG9jaygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2hhaW5bdGhpcy5jaGFpbi5sZW5ndGggLSAxXTtcbiAgICB9XG5cbiAgICBtaW5lUGVuZGluZ1RyYW5zYWN0aW9ucyhtaW5pbmdSZXdhcmRBZGRyZXNzKSB7XG4gICAgICAgIGNvbnN0IHJld2FyZFR4ID0gbmV3IFRyYW5zYWN0aW9uKG51bGwsIG1pbmluZ1Jld2FyZEFkZHJlc3MsIHRoaXMubWluaW5nUmV3YXJkKTtcbiAgICAgICAgdGhpcy5wZW5kaW5nVHJhbnNhY3Rpb25zLnB1c2gocmV3YXJkVHgpO1xuXG4gICAgICAgIC8vVE9ETzogTWluZXJzIHNob3VsZCBjaG9vc2Ugd2hpY2ggdHggdGhleSB3YW50IHRvIG1pbmVcbiAgICAgICAgbGV0IGJsb2NrID0gbmV3IEJsb2NrKERhdGUubm93KCksIHRoaXMucGVuZGluZ1RyYW5zYWN0aW9ucywgdGhpcy5nZXRMYXRlc3RCbG9jaygpLmhhc2gpO1xuICAgICAgICBibG9jay5taW5lQmxvY2sodGhpcy5kaWZmaWN1bHR5KTtcblxuICAgICAgICBjb25zb2xlLmxvZygnQmxvY2sgc3VjY2Vzc2Z1bGx5IG1pbmVkIScpO1xuICAgICAgICB0aGlzLmNoYWluLnB1c2goYmxvY2spO1xuXG4gICAgICAgIHRoaXMucGVuZGluZ1RyYW5zYWN0aW9ucyA9IFtdO1xuICAgIH1cblxuICAgIGFkZFRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uKXtcblxuICAgICAgICBpZighdHJhbnNhY3Rpb24uZnJvbUFkZHJlc3MgfHwgIXRyYW5zYWN0aW9uLnRvQWRkcmVzcyl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RyYW5zYWN0aW9uIG11c3QgaW5jbHVkZSBmcm9tIGFuZCB0byBhZGRyZXNzJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZighdHJhbnNhY3Rpb24uaXNWYWxpZCgpKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGFkZCBpbnZhbGlkIHRyYW5zYWN0aW9uIHRvIHRoZSBjaGFpbiEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGVuZGluZ1RyYW5zYWN0aW9ucy5wdXNoKHRyYW5zYWN0aW9uKTtcbiAgICB9XG5cbiAgICBnZXRCYWxhbmNlT2ZBZGRyZXNzKGFkZHJlc3Mpe1xuICAgICAgICBsZXQgYmFsYW5jZSA9IDA7XG5cbiAgICAgICAgZm9yKGNvbnN0IGJsb2NrIG9mIHRoaXMuY2hhaW4pe1xuICAgICAgICAgICAgZm9yKGNvbnN0IHRyYW5zIG9mIGJsb2NrLnRyYW5zYWN0aW9ucyl7XG4gICAgICAgICAgICAgICAgaWYgKHRyYW5zLmZyb21BZGRyZXNzID09PSBhZGRyZXNzKXtcbiAgICAgICAgICAgICAgICAgICAgYmFsYW5jZSAtPSB0cmFucy5hbW91bnQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRyYW5zLnRvQWRkcmVzcyA9PT0gYWRkcmVzcyl7XG4gICAgICAgICAgICAgICAgICAgIGJhbGFuY2UgKz0gdHJhbnMuYW1vdW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBiYWxhbmNlO1xuICAgIH1cblxuICAgIGlzQ2hhaW5WYWxpZCgpIHtcbiAgICAgICAgZm9yKGxldCBpID0gMTsgaSA8IHRoaXMuY2hhaW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRCbG9jayA9IHRoaXMuY2hhaW5baV07XG4gICAgICAgICAgICBjb25zdCBwcmV2aW91c0Jsb2NrID0gdGhpcy5jaGFpbltpIC0gMV07XG5cbiAgICAgICAgICAgIGlmKCFjdXJyZW50QmxvY2suaGFzVmFsaWR0cmFuc2FjdGlvbnMpe1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoY3VycmVudEJsb2NrLmhhc2ggIT09IGN1cnJlbnRCbG9jay5jYWxjdWxhdGVIYXNoKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7IFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihjdXJyZW50QmxvY2sucHJldmlvdXNIYXNoICE9PSBwcmV2aW91c0Jsb2NrLmhhc2gpe1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMuQmxvY2tjaGFpbiA9IEJsb2NrY2hhaW47XG5tb2R1bGUuZXhwb3J0cy5UcmFuc2FjdGlvbiA9IFRyYW5zYWN0aW9uOyJdfQ==