pragma solidity >=0.6.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
//import "@openzeppelin/contracts/access/Ownable.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol

abstract contract AaveLendingPoolInterface {
  function getUserAccountData(address user) public virtual view returns (
    uint256 totalCollateralETH,
    uint256 totalDebtETH,
    uint256 availableBorrowsETH,
    uint256 currentLiquidationThreshold,
    uint256 ltv,
    uint256 healthFactor
  );
}

contract YourContract {

  event SetPurpose(address sender, string purpose);

  string public purpose = "milkyweb.net";

  address aaveLendingPoolAddress = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf;
  AaveLendingPoolInterface aaveLendingPoolContract = AaveLendingPoolInterface(aaveLendingPoolAddress);

  constructor() {
    // what should we do on deploy?
  }

  function getMsgSender() public view returns (address) {
    return msg.sender;
  }

  function testIt(uint256 _number) public pure returns (uint256) {
    uint256 myHL = _number;
    return myHL * 2;
  }

  function getUserAccountData(address _someAddress) public view returns (
      uint256, uint256, uint256, uint256, uint256, uint256) {
    return aaveLendingPoolContract.getUserAccountData(_someAddress);
  }

  function getHL(address _someAddress) public view returns (uint256) {
    uint256 myHL;
    (,,,,,myHL) = aaveLendingPoolContract.getUserAccountData(_someAddress);
    return myHL;
  }

  function getMyHL() public view returns (uint256) {
    uint256 myHL;
    (,,,,,myHL) = aaveLendingPoolContract.getUserAccountData(msg.sender);
    return myHL;
  }

  function setPurpose(string memory newPurpose) public payable {
	  //require(msg.sender == owner, "FAILEDDDD!!!");

    purpose = newPurpose;
    console.log(msg.sender,"set purpose to",purpose);
    emit SetPurpose(msg.sender, purpose);
  }
}
