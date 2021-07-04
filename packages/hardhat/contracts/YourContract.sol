pragma solidity >=0.6.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
//import "@openzeppelin/contracts/access/Ownable.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
//import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract AaveLendingPoolInterface {
  function getUserAccountData(address user) public virtual view returns (
    uint256 totalCollateralETH,
    uint256 totalDebtETH,
    uint256 availableBorrowsETH,
    uint256 currentLiquidationThreshold,
    uint256 ltv,
    uint256 healthFactor
  );
  function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) public virtual;
}

abstract contract IERC20 {
    //function totalSupply() public view returns (uint);
    //function balanceOf(address tokenOwner) public view returns (uint balance);
    //function allowance(address tokenOwner, address spender) public view returns (uint remaining);
    //function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public virtual returns (bool success);
    //function transferFrom(address from, address to, uint tokens) public returns (bool success);
    //event Transfer(address indexed from, address indexed to, uint tokens);
    //event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}

contract YourContract {

  event SetPurpose(address sender, string purpose);

  mapping (address => uint256) balanceOf;

  address aaveLendingPoolAddress = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf;//matic mainnet
  AaveLendingPoolInterface aaveLendingPoolContract = AaveLendingPoolInterface(aaveLendingPoolAddress);

  address wMatic = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;

  constructor() {
    // what should we do on deploy?
  }






  /*function testView() public view returns (address) {
    console.log(msg.sender, "testView()", "");
    return msg.sender;
  }*/

  /*function testView(address _address) public returns (address) {
    console.log(msg.sender, "testNotView()", "");
    return msg.sender;
  }

  function testPayable() public payable returns (address) {
    console.log(msg.sender, "testPayable()", msg.value);
    return msg.sender;
  }
  
  function testPure(uint256 _number) public pure returns (uint256) {
    uint256 myHL = _number;
    return myHL * 2;
  }

  */





  function depositAndStakeInGauge() public payable {
    console.log(msg.sender, "depositAndStakeInGauge()", msg.value);
    require(balanceOf[msg.sender] == 0, "Already deposited");
    balanceOf[msg.sender] += msg.value;

    //emit SetPurpose(msg.sender, purpose);
  }

  /*function depositFromVaultToAave() public {
    require(balanceOf[msg.sender] > 0, "No funds deposited");
    aaveLendingPoolContract.deposit(wMatic, balanceOf[msg.sender], msg.sender, 0);
  }*/
  function depositFromVaultToAave(address _address) public {
    require(balanceOf[_address] > 0, "No funds deposited");

    //IERC20(apeAsset).approve(ADDRESSES_PROVIDER.getLendingPool(), outputAmount);
    //IERC20(wMatic).approve(address(this), balanceOf[_address]);
    IERC20(wMatic).approve(aaveLendingPoolAddress, balanceOf[_address]);

    aaveLendingPoolContract.deposit(wMatic, balanceOf[_address], address(this), 0);
  }
 
  /*function getMyDeposit() public view returns (uint256) {
    console.log(msg.sender, "getMyDeposit()", balanceOf[msg.sender]);
    return balanceOf[msg.sender];
  }*/

  function getDepositOf(address _address) public view returns (uint256) {
    console.log(msg.sender, "getDepositOf()", balanceOf[_address]);
    return balanceOf[_address];
  }

  function withdrawTo(address _address) public {
    payable(_address).transfer(getDepositOf(_address));
    balanceOf[_address] = 0;
  }

  ///////////////////////////
  ///////////////////////////TESTS
  ///////////////////////////

  function addFunds() public payable {
  }

  function payToSender() public {
    payable(msg.sender).transfer(address(this).balance);
    balanceOf[msg.sender] = 0;
  }

  /*function getMsgSender(uint _a) public payable returns (address) {

    console.log(msg.sender,"!!","??");
    //console.log(msg.data,"!!","??");
    //console.log(msg.gas,"!!","??");
    //console.log(msg.sig,"!!","??");
    console.log(msg.value,"!!","??");
    //console.log(msg.sender.from,"!!","??");
    console.log(address(msg.sender).balance,"!!","??");
    console.log(msg.sender.balance,"!!","??");
    
    return msg.sender;
  }

  function getTxOrigin() public view returns (address) {
    return tx.origin;
  }

  function sender() public view returns (address) {
    return msg.sender;
  }*/

  /*function getBalanceOf(address _address) public view returns (uint) {
    return _address.balance;
  }*/

  /*function contractBalance() public view returns (uint) {
    return address(this).balance;
  }*/

  function getUserAccountData(address _someAddress) public view returns (
      uint256, uint256, uint256, uint256, uint256, uint256) {
    return aaveLendingPoolContract.getUserAccountData(_someAddress);
  }

  //function getUserAccountDataByIndex(address _someAddress, uint8 _index) public view returns (uint256) {
    //return aaveLendingPoolContract.getUserAccountData(_someAddress)[_index];
  //}

  function getHL(address _someAddress) public view returns (uint256) {
    uint256 myHL = 666;
    (,,,,,myHL) = aaveLendingPoolContract.getUserAccountData(_someAddress);
    return myHL;
  }

  function getTotalCollateralETH(address _someAddress) public view returns (uint256) {
    (uint256 totalCollateralETH,,,,,) = getUserAccountData(_someAddress);
    return totalCollateralETH;
  }

  function getAvailableBorrowsETH(address _someAddress) public view returns (uint256) {
    ( ,,uint256 availableBorrowsETH,,,) = getUserAccountData(_someAddress);
    return availableBorrowsETH;
  }
}
