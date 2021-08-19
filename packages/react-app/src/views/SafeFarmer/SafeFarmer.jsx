import React from "react";
import { ethers } from "ethers";
import { Button, Row, Col, Typography, Divider } from "antd";
import {
  AaveAddress,
  AaveProxyABI,
  PriceOracleABI,
  PriceOracleAddress,
  USDTAddress,
  TARGET_HF,
  MATIC_LT,
  CurveAddress,
  CurveAbi,
  am3CrvContractAddress,
  am3CrvContractAbi,
  CurveDepositAddress,
  CurveDepositAbi,
} from "./consts";

const RATE_MODE = ethers.BigNumber.from(2);
const UNDERLYING = ethers.BigNumber.from(1);

/* TODO Делать deposit matic перед borrow:
 *   0) Если borrow еще нет, то нужно получить апрув на его создание (или на хуйню с ERC20 tokens)
 *   Транза с апрувом: 0xd05500fc454f551685c303e7f1b027b9f2d3b4fc316ef3427959089d7cf24724
 *   1) если депозит в матик пуст, то закинуть матик
 *   2) если депозит в матик пуст, а мы withdraw-нули usdt/usdc/dai, то обменять их на matic
 *   или закинуть usdt/usdc/dai в deposit (этот вариант проще)
 *   Пока сделать с рассчетом на то, что депозит уже есть
 * */
// TODO show steps and their states + tx links
// TODO update front after each success functions
// TODO handle all errors and scenarios
// TODO [optional] getData before tx? (If user use aave or curve just right now and want tested out interface)
// TODO награды забирать отдельно
// TODO научить сервис определять какая транза отвалилась, чтобы начать с этого места
export function SafeFarmer({ address, signer }) {
  const [userAave, setUserAave] = React.useState();
  const [usdtEth, setUsdtEth] = React.useState(); //
  const aaveProxyContract = React.useMemo(() => {
    return new ethers.Contract(AaveAddress, AaveProxyABI, signer);
  }, [signer]);
  const aaveOracleContract = React.useMemo(() => {
    return new ethers.Contract(PriceOracleAddress, PriceOracleABI, signer);
  }, [signer]);
  const curveContract = React.useMemo(() => {
    return new ethers.Contract(CurveAddress, CurveAbi, signer);
  }, [signer]);
  const curveDepositContract = React.useMemo(() => {
    return new ethers.Contract(CurveDepositAddress, CurveDepositAbi, signer);
  }, [signer]);
  const am3CrvContract = React.useMemo(() => {
    return new ethers.Contract(am3CrvContractAddress, am3CrvContractAbi, signer);
  });
  React.useEffect(() => {
    async function getUserAccountData() {
      console.log("[MYLOGS] address: ", address);
      // хуй знает откуда берется этот адрес... (разобраться в scaffold-eth)
      if (address !== "0xAF786303cf83E3C1b3df965817b64768D6ed4D31") {
        try {
          const res = await aaveProxyContract.getUserAccountData(address);
          console.log("aaveProxyContract.getUserAccountData(address): ", JSON.stringify(res));
          setUserAave(res);
        } catch (err) {
          console.error(`aaveProxyContract.getUserAccountData(address): ${err}`);
        }
      }
    }
    async function getUsdtEthPair() {
      try {
        const usdtEthPair = await aaveOracleContract.getAssetPrice(USDTAddress);
        setUsdtEth(usdtEthPair.toNumber());
      } catch (err) {
        console.log("logs aaveOracleContract.getAssetPrice(asset): ", err);
      }
    }
    if (aaveProxyContract && signer && address) {
      getUserAccountData();
    }
    if (aaveOracleContract) {
      getUsdtEthPair();
    }
  }, [aaveProxyContract, aaveOracleContract, signer, address]);
  const rebalanceModule = React.useMemo(() => {
    if (userAave) {
      const currentHF = ethers.utils.formatUnits(userAave.healthFactor);
      const isRange = Number(currentHF) >= TARGET_HF - 0.05 && Number(currentHF) <= TARGET_HF + 0.05;

      if (isRange)
        return {
          rebalance: () => {},
          rise: null,
          targetBorrowAmount: "nothing to do",
          currentHF: `${currentHF} in range [1.75, 1.85]`,
        };

      const totalCollateral = userAave.totalCollateralETH;
      const totalDebtETH = userAave.totalDebtETH;
      const targetBorrowAmount = Math.floor((totalCollateral * MATIC_LT) / TARGET_HF - totalDebtETH);
      const isRise = currentHF > TARGET_HF + 0.05;
      const isFall = currentHF < TARGET_HF - 0.05;

      const rebalance = async () => {
        if (!aaveProxyContract) return;

        const asset = USDTAddress;
        const amount = ethers.BigNumber.from(Math.floor((Math.abs(targetBorrowAmount) / usdtEth) * 1000000));
        const rateMode = RATE_MODE;
        const referralCode = ethers.BigNumber.from(0);
        const onBehalfOf = address;

        if (isRise) {
          try {
            // !!!!! Step 1: borrow money !!!!!
            // https://docs.aave.com/developers/the-core-protocol/lendingpool#borrow
            // Example Borrow: 0xd3692972d480a60aa4e321d852ebbcce8de498f978138ee204e6cc7a4896dbbc
            const txBorrow = await aaveProxyContract.borrow(asset, amount, rateMode, referralCode, onBehalfOf);
            const receipt1 = await txBorrow.wait();
            console.log("logs receipt1: ", receipt1);
            if (!receipt1) return;

            // !!!!! Step 2: deposits coins into to the pool and mints new LP tokens !!!!!
            const amounts = [ethers.BigNumber.from(0), ethers.BigNumber.from(0), amount];
            const cta = await curveContract.calc_token_amount(amounts, true);
            const minMintAmount = cta.mul(99).div(100); // ethers.BigNumber.from(Math.floor(amount.toNumber() * 0.99));
            const useUnderlying = UNDERLYING;
            // Note that if you wish to add or remove liqudity using the underlying assets within the base pool, you must use a depositor contract.
            // Returns the amount of LP tokens that were minted in the deposit.
            // BUT FUCKING ETHERS DOESN'T RETURN RESPONSE OF TRANSACTION
            // mb trying events
            // Example Add_liquidity: 0x1745e4e14970cff6b84c240a5aa8258bbe7e6c58c5237c44cd318861054c72ec
            const txAddLiq = await curveContract["add_liquidity(uint256[3],uint256,bool)"](
              amounts,
              minMintAmount,
              useUnderlying,
            );
            const receipt2 = await txAddLiq.wait();
            console.log("receipt2: ", receipt2);

            // !!!!! Step 3.1: approve for am3CRV spending 2**256-1 // Number.MAX_SAFE_INTEGER 9007199254740991 !!!!!
            // Example Approve am3CRV spend limit: 0xb104512d92e089868522495bb151aab0483bd32b6d4db8477208d145ae5628ba
            const txApprove = await am3CrvContract.approve(address, "0xffffffffffffffffffffff");
            const receipt3 = await txApprove.wait();
            console.log("receipt3: ", receipt3);
            // !!!!! Step 3.2: get am3CRV balance of user !!!!!
            const userBalance = await am3CrvContract.balanceOf(address);
            console.log("userBalance: ", userBalance);
            // !!!!! Step 3.3: deposit ALL am3CRV user's tokens !!!!!
            if (receipt3) {
              // Example Deposit: 0xedce5ab556e3c8d0c934789f27db337720ec3fd4a2d2e066bebb363ac25416fa
              const depositRes = await curveDepositContract["deposit(uint256)"](userBalance);
              console.log("rise curveContract.deposit res: ", depositRes);
            }
          } catch (err) {
            console.log("logs rebalance err: ", err);
          }
        }

        if (isFall) {
          try {
            // Withdraw from CurveDepositContract: https://polygonscan.com/tx/0xa35ccdb98eb4c25bc467b4f8d401665f309b958d54351e4435e0c09b34313fae
            // TODO иногда withdraw (step 2) пропускается и сразу дергается removeLiq (step 3) на сайте курвы
            // Remove_liquidity_imbalance from CurveContract: https://polygonscan.com/tx/0x4b7b687f1a0e52edac38b91639949005603ede586c208307b5208399be3c3817
            // Check user balance on curve before withdraw???

            // !!!!! Step 1 !!!!!
            const normAmount = amount.mul(1000000000000).mul(99).div(100);
            // Example 0x67595b3157c05b70666e77340ebe27b8f08ea9335b42f8be60d8bb42f3ff4fe3
            const tx1 = await curveDepositContract["withdraw(uint256)"](normAmount);
            const receipt1 = await tx1.wait();
            console.log("receipt1: ", receipt1);

            // !!!!! Step 2 !!!!!
            const amounts = [ethers.BigNumber.from(0), ethers.BigNumber.from(0), amount];
            const useUnderlying = UNDERLYING;
            const userBalance = await am3CrvContract.balanceOf(address);
            console.log("userBalance: ", userBalance);
            console.log("removeLiq DATA: ", {
              amounts,
              userBalance,
              useUnderlying,
            });
            // Example 0x384f0b8026c5fce0372ffd9fb8d6eaf51d3f5373344b2db49f6cefd6c1eddc48
            const tx2 = await curveContract["remove_liquidity_imbalance(uint256[3],uint256,bool)"](
              amounts,
              userBalance,
              useUnderlying,
            );
            const receipt2 = await tx2.wait();
            console.log("receipt2: ", receipt2);

            const res = await aaveProxyContract.repay(asset, amount, rateMode, onBehalfOf);
            console.log("logs repay res: ", res);
          } catch (err) {
            console.log("logs repay err: ", err);
          }
        }
      };

      return {
        rebalance,
        rise: isRise,
        targetBorrowAmount,
        currentHF,
      };
    }
  }, [userAave, address, aaveOracleContract, aaveProxyContract, curveContract, curveDepositContract, usdtEth]);

  return (
    <Row justify="center">
      <Col>
        <Divider />

        <Row gutter={4}>
          <Typography level={3}>SafeCDPFarmer</Typography>
        </Row>
        <Row gutter={4}>
          <Typography strong>User Address: {address}</Typography>
        </Row>

        <Divider />

        {/* <Row gutter={4}>
          <Typography strong>
            totalCollateralETH: {userAave ? ethers.utils.formatUnits(userAave.totalCollateralETH) : "loading..."}
            <i> total collateral in ETH of the user</i>
          </Typography>
        </Row>
        <Row gutter={4}>
          <Typography strong>
            totalDebtETH: {userAave ? ethers.utils.formatUnits(userAave.totalDebtETH) : "loading..."}
            <i> total debt in ETH of the user</i>
          </Typography>
        </Row>
        <Row gutter={4}>
          <Typography strong>
            availableBorrowsETH: {userAave ? ethers.utils.formatUnits(userAave.availableBorrowsETH) : "loading..."}
            <i> borrowing power left of the user</i>
          </Typography>
        </Row>
        <Row gutter={4}>
          <Typography strong>
            currentLiquidationThreshold:{" "}
            {userAave ? ethers.utils.formatUnits(userAave.currentLiquidationThreshold) : "loading..."}
            <i> liquidation threshold of the user</i>
          </Typography>
        </Row>
        <Row gutter={4}>
          <Typography strong>
            ltv: {userAave ? ethers.utils.formatUnits(userAave.ltv) : "loading..."}
            <i> Loan To Value of the user</i>
          </Typography>
        </Row>
        <Row gutter={4}>
          <Typography strong>
            healthFactor: {userAave ? ethers.utils.formatUnits(userAave.healthFactor) : "loading..."}
            <i> current health factor of the user. Also see liquidationCall()</i>
          </Typography>
        </Row> */}

        {/* <Divider /> */}

        <Row gutter={4}>
          <Typography strong>Target Health Factor: 1.8</Typography>
        </Row>
        <Row gutter={4}>
          <Typography strong>Current Health Factor: {userAave ? rebalanceModule.currentHF : "loading..."}</Typography>
        </Row>

        <Row gutter={4}>
          <Typography strong>
            {userAave && rebalanceModule.rise
              ? "Need to borrow money on Aave and deposit on Curve: "
              : "Need withdraw money on Curve and repay on Aave: "}
            {userAave
              ? typeof rebalanceModule.targetBorrowAmount !== "string"
                ? ethers.utils.formatUnits(rebalanceModule.targetBorrowAmount) + " eth"
                : rebalanceModule.targetBorrowAmount
              : "loading..."}
          </Typography>
        </Row>

        <Divider />

        {userAave && (
          <Row gutter={4}>
            <Button onClick={rebalanceModule.rebalance}>Rebalance</Button>
          </Row>
        )}

        <Divider />
      </Col>
    </Row>
  );
}
