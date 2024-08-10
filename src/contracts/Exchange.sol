// Deposit & Withdraw Funds
// Make & Cancel Orders
// Handle Trades - Charge fees

// TO DO:
// [x] Set the fee account
// [x] Deposit Ether
// [x] Withdraw Ether
// [x] Deposit tokens
// [x] Withdraw tokens
// [x] Check balances
// [x] Make order
// [x] Cancel order
// [ ] Fill order
// [ ] Charge fees
// [x] Refunds (fallback)


pragma solidity ^0.5.0;

import "./Token.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract Exchange {
    using SafeMath for uint256;
    // Variables
    address public feeAccount; // the account that receives exchange fees
    uint256 public feePercent; // the fee percentage
    address constant ETHER = address(0); // Store Ether in tokens mapping with blank address. Saves storge space.
    mapping(address => mapping(address => uint256)) public tokens; // 
    mapping(uint256 => _Order) public orders; // Stores the order struct
    uint256 public orderCount; // Keeps track of orders
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;

    // Events
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Cancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Trade(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address userFill,
        uint256 timestamp
    );

    // Struct
    // A way to model the order
    struct _Order {
        uint256 id;            // Order ID
        address user;          // User address
        address tokenGet;      // Token address
        uint256 amountGet;     // amount of tokens they wil get
        address tokenGive;     // Token they will give
        uint256 amountGive;    // Amount they will give
        uint256 timestamp;     // Time the order was created
    }


    constructor (address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    function() external {
        revert();
    }
    
    function depositEther() payable public {
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);   // Manage ETHER deposit - update balance
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);  // Emit event
    }

    function withdrawEther(uint256 _amount) public {
        require(tokens[ETHER][msg.sender] >= _amount); // Must have >= ether in exchange than is being withdrawn
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
        msg.sender.transfer(_amount);
        emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);  // Emit event

    }

    function depositToken(address _token, uint256 _amount) public {   // Which token? How much?
        require(_token != ETHER);    // Don't allow Ether deposits
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));  // Send tokens to this contract
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);        // Manage deposit - update balance
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);  // Emit event
    }

    function withdrawToken(address _token, uint256 _amount) public {
        require(_token != address(0));    // Don't allow Ether deposits
        require(tokens[_token][msg.sender] >= _amount); // Must have >= ether in exchange than is being withdrawn
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        require(Token(_token).transfer(msg.sender, _amount));
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user) public view returns (uint256) {
        return tokens[_token][_user];
    }

    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
        orderCount = orderCount.add(1); // Gives order ID
        orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);  // Add new order in order mapping
        emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
    }

    function cancelOrder(uint256 _id) public {
        _Order storage _order = orders[_id]; // Fetch order from storage on blockchain and assigning to local variable
        require(address(_order.user) == msg.sender); // Must be "my" order
        require(_order.id == _id); // Order must exist
        orderCancelled[_id] = true; // Order is cancelled
        emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, now);
    }

    function fillOrder(uint256 _id) public {
        require(_id > 0 && _id <= orderCount);  // Order ID is vallid
        require(!orderFilled[_id]);    // Order hasn't been filled
        require(!orderCancelled[_id]); // Order hasn't been cancelled 
        _Order storage _order = orders[_id]; // Fetch order from storage on blockchain and assigning to local variable
        _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);  // Fill the order by calling _trade()
        orderFilled[_order.id] = true;  // Mark order as filled
    }

    function _trade(uint256 _orderId, address _user, address _tokenGet, uint _amountGet, address _tokenGive, uint256 _amountGive) internal {
        // Fee paid by the user that fills the order, a.k.a. msg.sender
        uint256 _feeAmount = _amountGive.mul(feePercent).div(100); // Creates fee percentage

        // Execute the trade
        tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount)); // User calling order gives token1 and fee
        tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet); // User who created the order gets that token1
        tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount); // Fee account gets the fee
        tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive); // User who created the order gives their token2
        tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGet);   // User calling the order gets token2
        
        // Emit trade event
        emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, now);
    }
}