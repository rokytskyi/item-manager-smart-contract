import React, { Component } from "react";
import ItemManagerContract from "./contracts/ItemManager.json";
import ItemContract from "./contracts/Item.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = { loaded: false, cost: 0, itmeName: '', items: [], isOwner: false};

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();
      
      // Get the contract instance.
      this.networkId = await this.web3.eth.net.getId();

      this.itemManager = new this.web3.eth.Contract(
        ItemManagerContract.abi,
        ItemManagerContract.networks[this.networkId] && ItemManagerContract.networks[this.networkId].address,
      ); 
      this.item = new this.web3.eth.Contract(
        ItemContract.abi,
        ItemContract.networks[this.networkId] && ItemContract.networks[this.networkId].address,
      ); 

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.listenToPaymentEvent();
      this.loadItems();
      this.setState({ loaded: true});
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  handleSubmit = async () => {
    const { cost, itemName } = this.state;
    console.log(itemName, cost, this.itemManager);
    let result = await this.itemManager.methods.createItem(itemName, cost).send({ from: this.accounts[0] });
    console.log(result);
    alert("Send "+cost+" Wei to "+result.events.SupplyChainStep.returnValues._address);
  };

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value; 
    const name = target.name;
    this.setState({
      [name]: value
    });
  }

  listenToPaymentEvent = () => {
    let self = this;
    this.itemManager.events.SupplyChainStep().on("data", async function(evt) {
      if(evt.returnValues._step == 1) {
        let item = await self.itemManager.methods.items(evt.returnValues._itemIndex).call();
        console.log(item);
        alert("Item " + item._identifier + " was paid, deliver it now!");
      }
      console.log(evt);
    });
  }

  loadItems = async () => {
    let isOwner = await this.itemManager.methods.isOwner().call({ from: this.accounts[0] });
    console.log(isOwner);
    this.setState({ isOwner: isOwner });

    let result = await this.itemManager.methods.getItems().call({ from: this.accounts[0] });
    console.log(result);
    this.setState({ items: result });
  }

  onBuy = async (address, price) => {
    let result = await this.web3.eth.sendTransaction({ to: address, from: this.accounts[0], value: price, gas: 300000});
    console.log(result);
  }

  onDeliver = async (index) => {
    let result = await this.itemManager.methods.triggerDelivery(index).send({ from: this.accounts[0] });
    console.log(result);
  }


  render() {
    if (!this.state.loaded) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Supply chain</h1>
        <h2>Account</h2>
        <h2>Items</h2>
        <ul>
        {this.state.items.map((item, index) => 
          <li key={item._identifier}><b>id:</b> {item._identifier}, <b>price:</b> {item._priceInWei}, <b>item address:</b> {item._item}, <b>step:</b> {item._step} 
            {item._step == 0 ? <button type="button" onClick={() => this.onBuy(item._item, item._priceInWei)}>Buy</button> : <><b>paid from:</b> {item._paidFrom}</>}
            {this.state.isOwner && item._step == 1 && <button type="button" onClick={() => this.onDeliver(index)}>Deliver</button>}
          </li>
        )}
        </ul>
        { this.state.isOwner && <>
          <h2>Add Items</h2>
        Cost in Wei: <input type="text" name="cost" value={this.state.cost} onChange={this.handleInputChange}/>
        Item Id: <input type="text" name="itemName" value={this.state.itemName} onChange={this.handleInputChange}/>
        <button type="button" onClick={this.handleSubmit}>Create new Item</button>
        </>
        }
      </div>
    );
  }
}

export default App;
