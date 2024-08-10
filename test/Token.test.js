import { tokens, EVM_REVERT } from "./helpers";

const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();

contract("Token", ([deployer, receiver, exchange]) => {
  const name = "DApp Token";
  const symbol = "DAPP";
  const decimals = "18";
  const totalSupply = tokens(1000000).toString(); // 1mil x 10^18 or 18 additional 0s
  let token; // declare variable

  beforeEach(async () => {
    token = await Token.new(); // Fetch token from blockchain
  });

  describe("Deployment: ", () => {
    it("Tracks the name", async () => {
      const result = await token.name(); // Read token name here...
      result.should.equal(name); // Check the token name is Token Test
    });

    it("Tracks the symbol", async () => {
      const result = await token.symbol();
      result.should.equal(symbol);
    });

    it("Tracks the decimals", async () => {
      const result = await token.decimals();
      result.toString().should.equal(decimals);
    });

    it("Tracks the total supply", async () => {
      const result = await token.totalSupply();
      result.toString().should.equal(totalSupply.toString());
    });

    it("Assigns the total supply to the deployer", async () => {
      const result = await token.balanceOf(deployer);
      result.toString().should.equal(totalSupply.toString());
    });
  });

  describe("Sending tokens: ", () => {
    let result;
    let amount;

    describe("Success", async () => {
      beforeEach(async () => {
        amount = tokens(100);
        result = await token.transfer(receiver, amount, { from: deployer });
      });

      it("Transfers token balances", async () => {
        let balanceOf;
        // Before transfer...
        //balanceOf = await token.balanceOf(deployer);
        //console.log("Deployer balance before transfer: ", balanceOf.toString());
        //balanceOf = await token.balanceOf(receiver);
        //console.log("Receiver balance before transfer: ", balanceOf.toString());

        // After transfer...
        balanceOf = await token.balanceOf(deployer);
        balanceOf.toString().should.equal(tokens(999900).toString());
        //console.log("Deployer balance after transfer: ", balanceOf.toString());
        balanceOf = await token.balanceOf(receiver);
        balanceOf.toString().should.equal(tokens(100).toString());
        //console.log("Receiver balance after transfer: ", balanceOf.toString());
      });

      it("Emits a transfer event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Transfer");
        const event = log.args;
        event.from.toString().should.equal(deployer, "From is correct");
        event.to.should.equal(receiver, "To is correct");
        event.value
          .toString()
          .should.equal(amount.toString(), "Value is correct");
      });
    });

    describe("Failure", async () => {
      it("Rejects insufficient balances", async () => {
        let invalidAmount;
        invalidAmount = tokens(100000000); // 100 million... greater than total supply
        await token
          .transfer(receiver, invalidAmount, { from: deployer })
          .should.be.rejectedWith(EVM_REVERT);

        // Attempt transfer tokens when you have none
        invalidAmount = tokens(10); // Recipient has no tokens
        await token
          .transfer(deployer, invalidAmount, { from: receiver })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("Rejects invalid recipients", async () => {
        await token.transfer(0x0, amount, { from: deployer }).should.be
          .rejected;
      });
    });
  });

  describe("Approving tokens: ", () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = tokens(100);
      result = await token.approve(exchange, amount, { from: deployer });
    });

    describe("Success", () => {
      it("Allocates an allowance for delegated token spending on an exchange", async () => {
        const allowance = await token.allowance(deployer, exchange);
        allowance.toString().should.equal(amount.toString());
      });

      it("Emits an Approval event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Approval");
        const event = log.args;
        event.owner.toString().should.equal(deployer, "Owner is correct");
        event.spender.should.equal(exchange, "Spender is correct");
        event.value
          .toString()
          .should.equal(amount.toString(), "Value is correct");
      });
    });

    describe("failure", () => {
      it("Rejects invalid spenders", async () => {
        await token.approve(0x0, amount, { from: deployer }).should.be.rejected;
      });
    });
  });

  describe("Delegated token transfers: ", () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = tokens(100);
      await token.approve(exchange, amount, { from: deployer });
    });

    describe("Success", async () => {
      beforeEach(async () => {
        result = await token.transferFrom(deployer, receiver, amount, {
          from: exchange,
        });
      });

      it("Transfers token balances", async () => {
        let balanceOf;
        // Before transfer...
        balanceOf = await token.balanceOf(deployer);
        balanceOf.toString().should.equal(tokens(999900).toString());
        // console.log("Deployer balance before transfer: ", balanceOf.toString());
        balanceOf = await token.balanceOf(receiver);
        balanceOf.toString().should.equal(tokens(100).toString());
        // console.log("Receiver balance before transfer: ", balanceOf.toString());
      });

      //     // After transfer...
      //     balanceOf = await token.balanceOf(deployer);
      //     balanceOf.toString().should.equal(tokens(999900).toString());
      //     //console.log("Deployer balance after transfer: ", balanceOf.toString());
      //     balanceOf = await token.balanceOf(receiver);
      //     balanceOf.toString().should.equal(tokens(100).toString());
      //     //console.log("Receiver balance after transfer: ", balanceOf.toString());
      //   });

      it("Resets the allowance", async () => {
        const allowance = await token.allowance(deployer, exchange);
        allowance.toString().should.equal("0");
      });

      it("Emits a transfer event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Transfer");
        const event = log.args;
        event.from.toString().should.equal(deployer, "From is correct");
        event.to.should.equal(receiver, "To is correct");
        event.value
          .toString()
          .should.equal(amount.toString(), "Value is correct");
      });
    });

    describe("Failure", async () => {
      it("Rejects insufficient amounts", async () => {
        // Attempt to transfer too many tokens
        const invalidAmount = tokens(100000000); // 100 million... greater than total supply
        await token
          .transferFrom(deployer, receiver, invalidAmount, {
            from: exchange,
          })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("Rejects invalid recipients", async () => {
        await token.transferFrom(deployer, 0x0, amount, { from: exchange })
          .should.be.rejected;
      });
    });
  });
});
