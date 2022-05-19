// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "./Ownable.sol";
import "./Item.sol";

contract ItemManager is Ownable { 
    
    enum SupplyChainSteps{Created, Paid, Delivered}

    struct S_Item {
        Item _item;
        address _paidFrom;
        string _identifier;
        uint _priceInWei;
        ItemManager.SupplyChainSteps _step; 
    }

    mapping(uint => S_Item) public items; 
    uint index;
    event SupplyChainStep(uint _itemIndex, uint _step, address _address);
    
    function createItem(string memory _identifier, uint _priceInWei) public onlyOwner {
        Item item = new Item(this, _priceInWei, index);
        items[index]._item = item;
        items[index]._priceInWei = _priceInWei; 
        items[index]._step = SupplyChainSteps.Created; 
        items[index]._identifier = _identifier;
        emit SupplyChainStep(index, uint(items[index]._step), address(item));
        index++; 
    }
    
    function triggerPayment(uint _index) public payable {
        Item item = items[_index]._item;
        require(address(item) == msg.sender, "Only items are allowed to update themselves");
        require(item.priceInWei() == msg.value, "Not fully paid yet");
        require(items[index]._step == SupplyChainSteps.Created, "Item is further in the supply chain");
        items[_index]._step = SupplyChainSteps.Paid;
        items[_index]._paidFrom = items[_index]._item.paidFrom();
        emit SupplyChainStep(_index, uint(items[_index]._step), address(item));
    }

    function triggerDelivery(uint _index) public onlyOwner {
        require(items[_index]._step == SupplyChainSteps.Paid, "Item is further in the supply chain");
        items[_index]._step = SupplyChainSteps.Delivered;
        emit SupplyChainStep(_index, uint(items[_index]._step), address(items[_index]._item));
    }

    function getItems() public view returns(S_Item[] memory) {
        S_Item[] memory filteredItems = new S_Item[](index);
        uint count;
        for (uint i = 0; i < index; i++) {
            if (isOwner() || items[i]._paidFrom == msg.sender || items[i]._step == SupplyChainSteps.Created) {
                filteredItems[count] = items[i];
                count++;
            }
        }

        S_Item[] memory result = new S_Item[](count);
        for(uint i = 0; i<count; i++){
            result[i] = filteredItems[i];
        }

        return result;
    }
}