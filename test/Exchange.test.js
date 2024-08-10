import { tokens, ether, EVM_REVERT, ETHER_ADDRESS } from "./helpers";

const Exchange = artifacts.require("./Exchange");
const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();

contract("Exchange", ([deployer, feeAccount, user1, user2]) => {
  let token;
  let exchange; // declare variable
  const feePercent = 10;

  beforeEach(async () => {
    token = await Token.new(); // Deploy token
    token.transfer(user1, tokens(100), { from: deployer }); // Transfer tokens to user1
    exchange = await Exchange.new(feeAccount, feePercent); // Fetch token from blockchain
  });

  describe("Deployment: ", () => {
    it("Tracks the fee account", async () => {
      const result = await exchange.feeAccount(); // Read fee account name here...
      result.should.equal(feeAccount); // Check the fee account name is feeAccount
    });

    it("Tracks the fee percent", async () => {
      const result = await exchange.feePercent(); // Read fee account name here...
      result.toString().should.equal(feePercent.toString()); // Check the fee account name is feeAccount
    });
  });

  describe("Fallback: ", () => {
    it("Reverts when Ether is sent", async () => {
      await exchange
        .sendTransaction({ value: 1, from: user1 })
        .should.be.rejectedWith(EVM_REVERT);
    });
  });

  describe("Depositing Ether: ", async () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = ether(1);
      result = await exchange.depositEther({
        from: user1,
        value: amount,
      });
    });

    it("Tracks the Ether deposit", async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1);
      balance.toString().should.equal(amount.toString());
    });

    it("Emits a Deposit event", async () => {
      const log = result.logs[0];
      log.event.should.equal("Deposit");
      const event = log.args;
      event.token.should.equal(ETHER_ADDRESS, "Token address is correct");
      event.user.should.equal(user1, "User address is correct");
      event.amount
        .toString()
        .should.equal(amount.toString(), "Amount is correct");
      event.balance
        .toString()
        .should.equal(amount.toString(), "Balance is correct");
    });
  });

  describe("Withdrawing Ether: ", async () => {
    let result;
    let amount;

    beforeEach(async () => {
      // Deposit Ether first
      amount = ether(1);
      await exchange.depositEther({ from: user1, value: amount });
    });

    beforeEach(async () => {
      // Withdraw Ether
      result = await exchange.withdrawEther(amount, { from: user1 });
    });

    it("Withdraws Ether funds", async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1);
      balance.toString().should.equal("0");
    });

    it("Emits a Withdraw event", async () => {
      const log = result.logs[0];
      log.event.should.equal("Withdraw");
      const event = log.args;
      event.token.should.equal(ETHER_ADDRESS, "Token address is correct");
      event.user.should.equal(user1, "User address is correct");
      event.amount
        .toString()
        .should.equal(amount.toString(), "Amount is correct");
      event.balance.toString().should.equal("0", "Balance is correct");
    });
  });

  describe("Failure", async () => {
    it("Rejects withdraws for insufficient balances", async () => {
      await exchange
        .withdrawEther(ether(100), { from: user1 })
        .should.be.rejectedWith(EVM_REVERT);
    });
  });

  describe("Depositing Tokens: ", () => {
    let result;
    let amount;

    describe("Success", () => {
      beforeEach(async () => {
        amount = tokens(10);
        await token.approve(exchange.address, amount, { from: user1 }); // Approve exchange to move tokens for us
        result = await exchange.depositToken(token.address, tokens(10), {
          from: user1,
        });
      });
      it("Tracks the token deposit", async () => {
        // Check exchange token balance
        let balance;
        balance = await token.balanceOf(exchange.address);
        balance.toString().should.equal(amount.toString());
        // Check tokens on exchange
        balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal(amount.toString());
      });

      it("Emits a Deposit event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Deposit");
        const event = log.args;
        event.token.should.equal(token.address, "Token address is correct");
        event.user.should.equal(user1, "User address is correct");
        event.amount
          .toString()
          .should.equal(amount.toString(), "Amount is correct");
        event.balance
          .toString()
          .should.equal(amount.toString(), "Balance is correct");
      });
    });

    describe("Failure", () => {
      it("Rejects Ether deposits", () => {
        // TODO: Fill me in...
        exchange
          .depositToken(ETHER_ADDRESS, tokens(amount), {
            from: user1,
          })
          .should.be.rejectedWith(EVM_REVERT);
      });
      it("Fails when no tokens are approved", () => {
        // Don't approve any tokens before depositing
        exchange
          .depositToken(token.address, tokens(amount), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("Withdrawing Tokens: ", () => {
    let result;
    let amount;

    describe("Success", async () => {
      beforeEach(async () => {
        // Deposit tokens first
        amount = tokens(10);
        await token.approve(exchange.address, amount, { from: user1 }); // Approve exchange to move tokens for us
        result = await exchange.depositToken(token.address, amount, {
          from: user1,
        });

        // Withdrawing tokens
        result = await exchange.withdrawToken(token.address, amount, {
          from: user1,
        });
      });

      it("Withdraws token funds", async () => {
        const balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal("0");
      });

      it("Emits a Withdraw event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Withdraw");
        const event = log.args;
        event.token.should.equal(token.address, "Token address is correct");
        event.user.should.equal(user1, "User address is correct");
        event.amount
          .toString()
          .should.equal(amount.toString(), "Amount is correct");
        event.balance.toString().should.equal("0", "Balance is correct");
      });
    });

    describe("Failure", async () => {
      it("Rejects Ether withdraws", async () => {
        await exchange
          .withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("Fails for insufficient balances", async () => {
        // Attempt to withdraw tokens without depositing any first
        await exchange
          .withdrawToken(token.address, tokens(10), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("Checking Balances: ", async () => {
    beforeEach(async () => {
      await exchange.depositEther({ from: user1, value: ether(1) });
    });

    it("Returns user balance", async () => {
      const result = await exchange.balanceOf(ETHER_ADDRESS, user1);
      result.toString().should.equal(ether(1).toString());
    });
  });

  describe("Making orders: ", async () => {
    let result;

    beforeEach(async () => {
      result = await exchange.makeOrder(
        token.address,
        tokens(1),
        ETHER_ADDRESS,
        ether(1),
        { from: user1 }
      );
    });

    it("Tracks the newly created order", async () => {
      const orderCount = await exchange.orderCount(); // Get the orderCount Variable
      orderCount.toString().should.equal("1"); // Read the orderCount variable
      const order = await exchange.orders("1"); // Get the orders mapping of orderCount order
      // Check the _Order struct
      order.id.toString().should.equal("1", "ID is correct");
      order.user.should.equal(user1, "User is correct");
      order.tokenGet.should.equal(token.address, "tokenGet is correct");
      order.amountGet
        .toString()
        .should.equal(tokens(1).toString(), "amountGet is correct");
      order.tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is correct");
      order.amountGive
        .toString()
        .should.equal(ether(1).toString(), "amountGive is correct");
      order.timestamp
        .toString()
        .length.should.be.at.least(1, "Timestamp is present");
    });

    it('Emits an "Order" event', async () => {
      const log = result.logs[0];
      log.event.should.equal("Order");
      const event = log.args;
      event.id.toString().should.equal("1", "ID is correct");
      event.user.should.equal(user1, "User is correct");
      event.tokenGet.should.equal(token.address, "tokenGet is correct");
      event.amountGet
        .toString()
        .should.equal(tokens(1).toString(), "amountGet is correct");
      event.tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is correct");
      event.amountGive
        .toString()
        .should.equal(ether(1).toString(), "amountGive is correct");
      event.timestamp
        .toString()
        .length.should.be.at.least(1, "timestamp is correct");
    });
  });

  describe("Order actions: ", async () => {
    beforeEach(async () => {
      // User1 deposits Ether only
      await exchange.depositEther({ from: user1, value: ether(1) });
      // Give tokens to user2 so they can participate in the trade
      await token.transfer(user2, tokens(100), { from: deployer });
      // User2 deposits tokens only
      await token.approve(exchange.address, tokens(2), { from: user2 });
      await exchange.depositToken(token.address, tokens(2), { from: user2 });
      // User1 makes an order to buy tokens with Ether
      await exchange.makeOrder(
        token.address,
        tokens(1),
        ETHER_ADDRESS,
        ether(1),
        { from: user1 }
      );
    });

    describe("Filling orders", () => {
      let result;

      describe("Success", () => {
        beforeEach(async () => {
          // User2 fills order
          result = await exchange.fillOrder("1", { from: user2 });
        });

        // User2 should receive 10% less ether
        it("Executes the trade & charges fees", async () => {
          let balance;
          balance = await exchange.balanceOf(token.address, user1);
          balance
            .toString()
            .should.equal(tokens(1).toString(), "User1 received tokens");
          balance = await exchange.balanceOf(ETHER_ADDRESS, user2);
          balance
            .toString()
            .should.equal(ether(1).toString(), "User2 received Ether");
          balance = await exchange.balanceOf(ETHER_ADDRESS, user1);
          balance.toString().should.equal("0", "User1 Ether deducted");
          balance = await exchange.balanceOf(token.address, user2);
          balance
            .toString()
            .should.equal(
              tokens(0.9).toString(),
              "User2 tokens deducted with the fee applied"
            );
          const feeAccount = await exchange.feeAccount();
          balance = await exchange.balanceOf(token.address, feeAccount);
          balance
            .toString()
            .should.equal(tokens(0.1).toString(), "feeAccount received fee");
        });

        it("Updates filled orders", async () => {
          const orderFilled = await exchange.orderFilled(1);
          orderFilled.should.equal(true);
        });

        it('Emits a "Trade" event', async () => {
          const log = result.logs[0];
          log.event.should.equal("Trade");
          const event = log.args;
          event.id.toString().should.equal("1", "ID is correct");
          event.user.should.equal(user1, "User is correct");
          event.tokenGet.should.equal(token.address, "tokenGet is correct");
          event.amountGet
            .toString()
            .should.equal(tokens(1).toString(), "amountGet is correct");
          event.tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is correct");
          event.amountGive
            .toString()
            .should.equal(ether(1).toString(), "amountGive is correct");
          event.userFill.should.equal(user2, "userFill is correct");
          event.timestamp
            .toString()
            .length.should.be.at.least(1, "timestamp is present");
        });
      });

      describe("Failure", async () => {
        it("Rejects invalid order IDs", async () => {
          const invalidOrderId = 99999;
          await exchange
            .fillOrder(invalidOrderId, { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });

        it("Rejects already-filled orders", async () => {
          // Fill the order
          await exchange.fillOrder("1", { from: user2 }).should.be.fulfilled;
          // Try to fill again
          await exchange
            .fillOrder("1", { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });

        it("Rejects cancelled orders", async () => {
          // Cancel the order
          await exchange.cancelOrder("1", { from: user1 }).should.be.fulfilled;
          // Try to fill the order
          await exchange
            .fillOrder("1", { from: user1 })
            .should.be.rejectedWith(EVM_REVERT);
        });
      });
    });

    describe("Cancelling orders", async () => {
      let result;

      describe("Success", async () => {
        beforeEach(async () => {
          result = await exchange.cancelOrder("1", { from: user1 });
        });

        it("Updates cancelled orders", async () => {
          const orderCancelled = await exchange.orderCancelled(1);
          orderCancelled.should.equal(true);
        });

        it('Emits a "Cancel" event', async () => {
          const log = result.logs[0];
          log.event.should.equal("Cancel");
          const event = log.args;
          event.id.toString().should.equal("1", "ID is correct");
          event.user.should.equal(user1, "user is correct");
          event.tokenGet.should.equal(token.address, "tokenGet is correct");
          event.amountGet
            .toString()
            .should.equal(tokens(1).toString(), "amountGet is correct");
          event.tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is correct");
          event.amountGive
            .toString()
            .should.equal(ether(1).toString(), "amountGive is correct");
          event.timestamp
            .toString()
            .length.should.be.at.least(1, "timestamp is correct");
        });
      });

      describe("Failure", async () => {
        it("Rejects invalid order IDs", async () => {
          // Try to cancel an invalid Order ID
          const invalidOrderID = 99999;
          await exchange
            .cancelOrder(invalidOrderID, { from: user1 })
            .should.be.rejectedWith(EVM_REVERT);
        });

        it("Rejects unauthorized cancellations", async () => {
          // Try to cancel the order from another user
          await exchange
            .cancelOrder("1", { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });
      });
    });
  });
});
