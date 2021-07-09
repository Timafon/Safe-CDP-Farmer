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
  function withdraw(address asset, uint256 amount, address to) public virtual;
}

abstract contract IERC20 {
    //function totalSupply() public view returns (uint);
    function balanceOf(address tokenOwner) public virtual view returns (uint balance);
    function allowance(address tokenOwner, address spender) public virtual view returns (uint remaining);
    //function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public virtual returns (bool success);
    function transferFrom(address from, address to, uint tokens) public virtual returns (bool success);
    //event Transfer(address indexed from, address indexed to, uint tokens);
    //event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}

abstract contract ETHGateway {
    function depositETH(address lendingPool, address onBehalfOf, uint16 referralCode) public virtual payable;
    function withdrawETH(address lendingPool, uint256 amount, address to) public virtual payable;
}

// #example of transaction https://polygonscan.com/tx/0xffb56160b4555c7949f1f94242f9236d4d348fde2fd276f72106d42e4553a80c#eventlog
// #code of AddLiquidity https://polygonscan.com/address/0x445fe580ef8d70ff569ab36e80c647af338db351#code
// event AddLiquidity:
// provider: indexed(address)
// token_amounts: uint256[N_COINS]
// fees: uint256[N_COINS]
// invariant: uint256
// token_supply: uint256
abstract contract CurveAavePoolInterface {
  function add_liquidity(uint256[3] memory _amounts, uint256 _min_mint_amount, bool _use_underlying) public virtual returns
(uint256);
  function AddLiquidity(
    address provider,
    uint256[3] memory _token_amounts,
    uint256[3] memory fees,
    uint256 invariant,
    uint256 token_supply
  ) public virtual returns (uint256);
}

contract YourContract {

  event SetPurpose(address sender, string purpose);

  mapping (address => uint256) balanceOf;

  address aaveLendingPoolAddress = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf; //matic mainnet
  AaveLendingPoolInterface aaveLendingPoolContract = AaveLendingPoolInterface(aaveLendingPoolAddress);

  address wMatic = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;
  address aToken = 0x8dF3aad3a84da6b69A4DA8aeC3eA40d9091B2Ac4;
  address ethGateway = 0xbEadf48d62aCC944a06EEaE0A9054A90E5A7dc97;
  address USDT = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F;

  constructor() {
    // what should we do on deploy?
  }
  
  function sendUSDT(address _from, address _to, uint256 _tokens) external {
    // This is the mainnet USDT contract address
    // Using on other networks (rinkeby, local, ...) would fail
    //  - there's no contract on this address on other networks
    // transfers USDT that belong to your contract to the specified address
    IERC20(address(USDT)).transferFrom(_from, _to, _tokens);
  }

  function depositToVault() public payable {
    console.log(msg.sender, "depositToVault()", msg.value);
    require(balanceOf[msg.sender] == 0, "Already deposited");
    balanceOf[msg.sender] += msg.value;

    //emit SetPurpose(msg.sender, purpose);
  }

  function depositAndStakeInGaugeUSDT() public payable {
    console.log(msg.sender, "depositAndStakeInGaugeUSDT()", msg.value);
    require(balanceOf[msg.sender] == 0, "Already deposited");
    balanceOf[msg.sender] += msg.value;

    //emit SetPurpose(msg.sender, purpose);
  }

  /*function depositFromVaultToAave() public {
    require(balanceOf[msg.sender] > 0, "No funds deposited");
    aaveLendingPoolContract.deposit(wMatic, balanceOf[msg.sender], msg.sender, 0);
  }*/
  function depositFromVaultToAave(address _address) public {
    //require(balanceOf[_address] > 0, "No funds deposited");
    ETHGateway(ethGateway).depositETH{value:balanceOf[_address]}(aaveLendingPoolAddress, _address, 0);
  }

  function withdrawFromAave(address _address) public {
    //IERC20(aToken).allowance(_address, address(this));
    //IERC20(aToken).allowance(aaveLendingPoolAddress, address(this));
    IERC20(wMatic).approve(aaveLendingPoolAddress, type(uint).max);

    ETHGateway(ethGateway).withdrawETH(aaveLendingPoolAddress, type(uint).max, _address);
  }
  
  //onlyOwner
  //move to constructor
  function approve(address _tokenAddress, address _address) public returns (bool) {
    //IERC20(aToken).approve(address(this), type(uint).max);
    //IERC20(aToken).approve(aaveLendingPoolAddress, type(uint).max);

    return IERC20(_tokenAddress).approve(_address, type(uint).max);
  }

  function approve() public returns (bool) {
    return IERC20(aToken).approve(aaveLendingPoolAddress, type(uint).max);
  }
  
  function withdrawFromAaveToValut() public {
    ETHGateway(ethGateway).withdrawETH(aaveLendingPoolAddress, type(uint).max, address(this));
  }

  function withdrawATokenFromAave() public {
    aaveLendingPoolContract.withdraw(aToken, type(uint).max, msg.sender);
  }

  function getATokenBalanceOf(address _tokenAddress, address _ownerAddress) public view returns (uint) {
    IERC20 iaToken = IERC20(_tokenAddress);
    return iaToken.balanceOf(_ownerAddress);
  }

  function getATokenAllowanceOf(address _tokenAddress, address _address1, address _address2) public view returns (uint) {
    IERC20 iaToken = IERC20(_tokenAddress);
    return iaToken.allowance(_address1, _address2);
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
    (,,,,,uint256 myHL) = aaveLendingPoolContract.getUserAccountData(_someAddress);
    return myHL;
  }

  function getTotalCollateralETH(address _someAddress) public view returns (uint256) {
    (uint256 totalCollateralETH,,,,,) = getUserAccountData(_someAddress);
    return totalCollateralETH;
  }

  function getCurrentLiquidationThreshold(address _someAddress) public view returns (uint256) {
    (,,,uint256 currentLiquidationThreshold,,) = getUserAccountData(_someAddress);
    return currentLiquidationThreshold;
  }

  function getAvailableBorrowsETH(address _someAddress) public view returns (uint256) {
    (,,uint256 availableBorrowsETH,,,) = getUserAccountData(_someAddress);
    return availableBorrowsETH;
  }

  function getTotalDebtETH(address _someAddress) public view returns (uint256) {
    (,uint256 totalDebtETH,,,,) = getUserAccountData(_someAddress);
    return totalDebtETH;
  }

  // ---------------- CURVE ---------------------
  address curveAavePoolAddress = 0x445FE580eF8d70FF569aB36e80c647af338db351;
  CurveAavePoolInterface curveAavePoolContract = CurveAavePoolInterface(curveAavePoolAddress);

  function depositFromVaultToCurveAavePool(address _address, uint256 _usdtCount) public {
    IERC20(USDT).approve(curveAavePoolAddress, balanceOf[_address]);
    curveAavePoolContract.add_liquidity([uint(0), uint(0), uint(_usdtCount * 1000000)], 0, false);
  }
}
