import React from "react";
import { ethers } from "ethers";
import { Button, Row, Col, Typography, Divider } from "antd";
import { ConvertingForm } from "./ConvertingForm";
import {
  AaveAddress,
  AaveProxyABI,
  PriceOracleABI,
  PriceOracleAddress,
  ProtocolDataProviderABI,
  ProtocolDataProviderAddress,
  USDTAddress,
  TARGET_HF,
  MATIC_LT,
} from "./consts";

// TODO add link for Explorer
// TODO добавить прослушку Event чтобы обновлять фронт
export function SafeFarmer({ address, signer }) {
  const [userAave, setUserAave] = React.useState();
  const aaveProxyContract = React.useMemo(() => {
    return new ethers.Contract(AaveAddress, AaveProxyABI, signer);
  }, [signer]);
  const aaveOracleContract = React.useMemo(() => {
    return new ethers.Contract(PriceOracleAddress, PriceOracleABI, signer);
  }, [signer]);
  const ProtocolDataProviderContract = React.useMemo(() => {
    return new ethers.Contract(ProtocolDataProviderAddress, ProtocolDataProviderABI, signer);
  }, [signer]);
  // console.log("logs aaveOracleContract: ", aaveOracleContract);
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
    if (aaveProxyContract && signer && address) {
      getUserAccountData();
    }
  }, [aaveProxyContract, signer, address]);
  const rebalanceModule = React.useMemo(() => {
    async function rebalance(targetBorrowAmount) {
      // https://docs.aave.com/developers/the-core-protocol/lendingpool#borrow
      // function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)
      // const asset = wMaticAddress; // [address] address of the underlying asset
      const asset = USDTAddress; // vUSDTAddress; // [address] address of the underlying asset
      // const forBigNumber = ethers.utils.formatUnits(targetBorrowAmount);
      // console.log("forBigNumber: ", forBigNumber);

      console.log("logs ProtocolDataProviderContract: ", ProtocolDataProviderContract);
      const allTokens = await ProtocolDataProviderContract.getAllReservesTokens(); // getAllATokens();
      console.log("logs reserves allTokens: ", allTokens);

      let usdtEth = 0;
      const asd = await aaveOracleContract.getAssetPrice(asset);
      console.log("logs asd: ", asd);
      try {
        usdtEth = await aaveOracleContract.getAssetPrice(asset);
      } catch (err) {
        console.log("logs aaveOracleContract.getAssetPrice(asset): ", err);
      }

      console.log("logs usdtEth: ", usdtEth, ethers.utils.formatUnits(usdtEth));
      // const amount = ethers.BigNumber.from(ethers.utils.formatUnits(targetBorrowAmount)); // [uint256]
      const amount = ethers.BigNumber.from(targetBorrowAmount); // [uint256]
      console.log("logs targetBorrowAmount: ", targetBorrowAmount);
      console.log("logs targetBorrowAmount / 1,000,000: ", targetBorrowAmount / 1000000);
      console.log("logs amount: ", amount);
      console.log("logs tba: ", targetBorrowAmount);
      console.log(
        "logs amount from.format32",
        ethers.BigNumber.from(ethers.utils.formatBytes32String(String(targetBorrowAmount))),
      );
      console.log(
        "logs formatBytes32String(targetBorrowAmount): ",
        ethers.utils.formatBytes32String(String(targetBorrowAmount)),
      );
      // console.log(
      //   "logs ethers.BigNumber.from(ethers.utils.formatUnits(targetBorrowAmount)): ",
      //   ethers.BigNumber.from(ethers.utils.formatUnits(targetBorrowAmount)),
      // );
      const toNumberAmount = amount.toNumber();
      console.log("logs toNumberAmount: ", toNumberAmount);
      // console.log("logs ethers.utils.formatUnits(targetBorrowAmount): ",
      // ethers.utils.formatUnits(targetBorrowAmount));
      // console.log(
      //   "logs ethers.utils.formatUnits(targetBorrowAmount): ",
      //   ethers.BigNumber.from(ethers.utils.formatUnits(targetBorrowAmount)),
      // );
      // amount to be borrowed, expressed in wei
      // units
      const interestRateMode = ethers.BigNumber.from(2); // [uint256] the type of borrow debt. Stable: 1, Variable: 2
      const referralCode = ethers.BigNumber.from(0); // [uint16] referral code for our referral program. Use 0 for
      // no referral code.
      console.log("logs onBehalfOf: ", address);
      const onBehalfOf = address; // [address] address of user who will incur the debt
      // string public constant VL_RESERVE_FROZEN = '3'; // 'Action cannot be performed because the reserve is frozen'
      // 3 Currency not borrowed
      // в комментах примеры транзакции которую я запустил через сайт Aave
      // https://polygonscan.com/tx/0xd3692972d480a60aa4e321d852ebbcce8de498f978138ee204e6cc7a4896dbbc
      const borrowData = {
        asset, // 000000000000000000000000c2132d05d31c914a87c6611c10748aeb04b58e8f
        // targetBorrowAmount,
        amount, // 00000000000000000000000000000000000000000000000000000000000f4240
        interestRateMode, // 0000000000000000000000000000000000000000000000000000000000000002
        referralCode, // 0000000000000000000000000000000000000000000000000000000000000000
        onBehalfOf, // 0000000000000000000000004b7e32a9f6e98da4d3194199f5a18d960c12ce63
      };
      console.log("logs borrow data: ", borrowData);

      try {
        const res = await aaveProxyContract.borrow(asset, amount, interestRateMode, referralCode, onBehalfOf);
        console.log("logs rebalance res: ", res);
      } catch (err) {
        console.log("logs rebalance err: ", err);
      }
    }

    if (userAave) {
      const currentHF = ethers.utils.formatUnits(userAave.healthFactor);
      console.log("logs HFS: ", {
        currentHF,
        TARGET_HF,
        numberCHF: Number(currentHF),
      });
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
      const targetBorrowAmount = Math.ceil((totalCollateral * MATIC_LT) / TARGET_HF - totalDebtETH);
      const isRise = currentHF > TARGET_HF + 0.5;

      return {
        rebalance,
        rise: isRise,
        targetBorrowAmount,
        currentHF,
      };
    }
  }, [userAave, address]);

  return (
    <Row justify="center">
      <Col>
        <Divider />

        <Row>
          <ConvertingForm />
        </Row>

        <Divider />

        <Row gutter={4}>
          <Typography level={3}>SafeCDPFarmer</Typography>
        </Row>
        <Row gutter={4}>
          <Typography strong>User Address: {address}</Typography>
        </Row>

        <Divider />

        <Row gutter={4}>
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
        </Row>

        <Divider />

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
                ? ethers.utils.formatUnits(rebalanceModule.targetBorrowAmount)
                : rebalanceModule.targetBorrowAmount
              : "loading..."}
          </Typography>
        </Row>

        <Divider />

        {userAave && (
          <Row gutter={4}>
            <Button onClick={() => rebalanceModule.rebalance(rebalanceModule.targetBorrowAmount)}>Rebalance</Button>
          </Row>
        )}
      </Col>
    </Row>
  );
}
