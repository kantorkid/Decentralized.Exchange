import React, { Component } from 'react';
import './App.css';
import Web3 from 'web3';
import { connect } from 'react-redux'
import Token from '../abis/Token.json'
import { 
  loadWeb3,
} from '../store/interactions'


class App extends Component {
  // loads blockchain data - reactjs.org/docs/react-component.html
  componentWillMount() {  // is componentWillMount outdated?
    this.loadBlockchainData(this.props.distpatch)
  }

// CHANGE THIS?
  async loadBlockchainData(dispatch) {
    const web3 = loadWeb3(dispatch)  // new Web3(Web3.givenProvider || 'http://localhost:7545')
    const network = await web3.eth.net.getNetworkType() // web3js.redthedocs.io/en/1.0/web3-eth-net.html
    const networkId = await web3.eth.net.getId() // web3js.redthedocs.io/en/1.0/web3-eth-net.html
    const accounts = await web3.eth.getAccounts(); // web3js.redthedocs.io/en/1.0/web3-eth-net.html#getaccounts
    const abi = Token.abi
    const tokenAddress = Token.networks [networkId].address
    const token = new web3.eth.Contract(Token.abi, Token.networks[networkId].address)
    const totalSupply = await token.methods.totalSupply().call()
    console.log("Web3: ", web3)
    console.log("Network: ", network)
    console.log("NetworkId: ", networkId)
    console.log("Accounts: ", accounts)
    console.log("Abi: ", abi)
    console.log("Token: ", Token)
    console.log("Token Address: ", tokenAddress)
    console.log("Token: ", token)
    console.log("Total Supply: ", totalSupply)
  }


render() {
    return (
      <div>
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
          <a className="navbar-brand" href="/#">Navbar</a>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNavDropdown">
            <ul className="navbar-nav">
              <li className="nav-item">
                <a className="nav-link" href="/#">Link 1</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/#">Link 2</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/#">Link 3</a>
              </li>
            </ul>
          </div>
        </nav>
        <div className="content">
          <div className="vertical-split">
            <div className="card bg-dark text-white">
              <div className="card-header">
                Card Title
              </div>
              <div className="card-body">
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="/#" className="card-link">Card link</a>
              </div>
            </div>
            <div className="card bg-dark text-white">
              <div className="card-header">
                Card Title
              </div>
              <div className="card-body">
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="/#" className="card-link">Card link</a>
              </div>
            </div>
          </div>
          <div className="vertical">
            <div className="card bg-dark text-white">
              <div className="card-header">
                Card Title
              </div>
              <div className="card-body">
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="/#" className="card-link">Card link</a>
              </div>
            </div>
          </div>
          <div className="vertical-split">
            <div className="card bg-dark text-white">
              <div className="card-header">
                Card Title
              </div>
              <div className="card-body">
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="/#" className="card-link">Card link</a>
              </div>
            </div>
            <div className="card bg-dark text-white">
              <div className="card-header">
                Card Title
              </div>
              <div className="card-body">
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="/#" className="card-link">Card link</a>
              </div>
            </div>
          </div>
          <div className="vertical">
            <div className="card bg-dark text-white">
              <div className="card-header">
                Card Title
              </div>
              <div className="card-body">
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="/#" className="card-link">Card link</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    // TODO
  }
}

export default connect(mapStateToProps)(App);




