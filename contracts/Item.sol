// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "./ItemManager.sol";

contract Item {
    uint public priceInWei;
    uint public paidWei;
    address public paidFrom;

    uint public index;

    ItemManager parentContract;
    
    constructor(ItemManager _parentContract, uint _priceInWei, uint _index) public { 
        priceInWei = _priceInWei;
        index = _index;
        parentContract = _parentContract;
    }

    function pay() public payable {
        require(msg.value == priceInWei, "We don't support partial payments"); 
        require(paidWei == 0, "Item is already paid!");
        paidWei += msg.value;
        paidFrom = msg.sender;
        (bool success, ) = address(parentContract).call{value:msg.value}(abi.encodeWithSignature("triggerPayment(uint256)", index));
        require(success, "Delivery did not work"); 
    }

    receive() external payable {
        pay();
    }

    fallback () external {
    }
}