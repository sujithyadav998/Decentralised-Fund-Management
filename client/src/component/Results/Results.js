// Node modules
import React, { Component } from "react";
import { Link } from "react-router-dom";

// Components
import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

// Contract
import getWeb3 from "../../getWeb3";
import Election from "../../contracts/Election.json";

// CSS
import "./Results.css";

export default class Result extends Component {
  constructor(props) {
    super(props);
    this.state = {
      FundInstance: undefined,
      account: null,
      web3: null,
      isAdmin: false,
      candidateCount: undefined,
      isElStarted: false,
      isElEnded: false,
      voters: [],
      voterDetails: {},
      isLoading: true
    };
  }

  componentDidMount = async () => {
    // refreshing once
    if (!window.location.hash) {
      window.location = window.location + "#loaded";
      window.location.reload();
    }
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];
      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork && deployedNetwork.address
      );

      this.setState({ web3, FundInstance: instance, account: accounts[0] });

      // Get total number of candidates
      const candidateCount = await instance.methods.getTotalCandidate().call();
      
      // Get start and end values
      const start = await instance.methods.getStart().call();
      const end = await instance.methods.getEnd().call();

      // Admin account and verification
      const admin = await instance.methods.getAdmin().call();
      
      // Get approved voters
      const approvedVoters = await instance.methods.getApprovedVoters().call();
      
      // Get details for each approved voter
      const voterDetails = {};
      for (const voterAddress of approvedVoters) {
        const details = await instance.methods.voterDetails(voterAddress).call();
        voterDetails[voterAddress] = details;
      }

      this.setState({
        candidateCount,
        isElStarted: start,
        isElEnded: end,
        isAdmin: accounts[0] === admin,
        voters: approvedVoters,
        voterDetails,
        isLoading: false
      });

    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
      this.setState({ isLoading: false });
    }
  };

  render() {
    if (!this.state.web3 || this.state.isLoading) {
      return (
        <>
          {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );
    }

    return (
      <>
        {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
        
        <br />
        <div>
          {!this.state.isElStarted && !this.state.isElEnded ? (
            <NotInit />
          ) : this.state.isElStarted && !this.state.isElEnded ? (
            <div className="container-item attention">
              <center>
                <h3>The Fund campaign is being conducted at the moment.</h3>
                <p>Results will be displayed once the campaign has ended.</p>
              </center>
            </div>
          ) : !this.state.isElStarted && this.state.isElEnded ? (
            <div className="container-main">
              <h2>Approved Fund Applications</h2>
              <div className="container-item">
                {this.state.voters.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Business Name</th>
                        <th>Owner</th>
                        <th>Phone</th>
                        <th>Funding Amount (ETH)</th>
                        <th>Purpose</th>
                        <th>Documents</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.voters.map((voterAddress) => {
                        const voter = this.state.voterDetails[voterAddress];
                        return voter ? (
                          <tr key={voterAddress}>
                            <td>{voter.businessName}</td>
                            <td>{voter.name}</td>
                            <td>{voter.phone}</td>
                            <td>{voter.fundingAmount}</td>
                            <td>{voter.fundingPurpose}</td>
                            <td>
                              <a 
                                href={voter.registrationDocLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                View Documents
                              </a>
                            </td>
                          </tr>
                        ) : null;
                      })}
                    </tbody>
                  </table>
                ) : (
                  <center>No approved applications found.</center>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </>
    );
  }
}
