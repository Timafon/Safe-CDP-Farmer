import React from "react";
import { Col, Input, Row } from "antd";
import { BigNumber, ethers } from "ethers";

export function ConvertingForm() {
  // ethers.utils.parseBytes32String
  // Returns the decoded string represented by the Bytes32 encoded data.
  const [fbsp, setFbsp] = React.useState({
    init: "",
    cur: "",
  });
  // ethers.utils.formatBytes32String
  // Returns a bytes32 string representation of text. If the length of text exceeds 31 bytes, it will throw an error.
  const [fbs, setFbs] = React.useState({
    init: "",
    cur: "",
  });
  // BigNumber.from
  // Returns an instance of a BigNumber for aBigNumberish.
  const [bnf, setBnf] = React.useState({
    init: "",
    cur: "",
  });
  //   const oneGwei = BigNumber.from("1000000000");
  //   const oneEther = BigNumber.from("1000000000000000000");
  //
  //   formatUnits(oneGwei, 0);
  // // '1000000000'
  //
  //   formatUnits(oneGwei, "gwei");
  // // '1.0'
  //
  //   formatUnits(oneGwei, 9);
  // // '1.0'
  //
  //   formatUnits(oneEther);
  // // '1.0'
  //
  //   formatUnits(oneEther, 18);
  // // '1.0'
  const [fu, setFu] = React.useState({
    init: "",
    cur: "",
  });
  const [isHex, setIsHex] = React.useState({
    init: "",
    cur: "",
  });

  return (
    <Col>
      <Row>
        <div>Returns an instance of a BigNumber for aBigNumberish.</div>
        <Input
          placeholder="BigNumber.from"
          value={bnf.init}
          onChange={e => {
            setBnf({
              init: e.target.value,
              cur: BigNumber.from(e.target.value),
            });
          }}
        />
        <div>{bnf.cur._hex}</div>
      </Row>
      <Row>
        <div>
          Returns a bytes32 string representation of text. If the length of text exceeds 31 bytes, it will throw an
          error.
        </div>
        <Input
          placeholder="ethers.utils.formatBytes32String"
          value={fbs.init}
          onChange={e => {
            setFbs({
              init: e.target.value,
              cur: ethers.utils.formatBytes32String(e.target.value),
            });
          }}
        />
        <div>{fbs.cur}</div>
      </Row>
      <Row>
        <div>Returns the decoded string represented by the Bytes32 encoded data.</div>
        <Input
          placeholder="ethers.utils.parseBytes32String"
          value={fbsp.init}
          onChange={e => {
            setFbsp({
              init: e.target.value,
              cur: ethers.utils.parseBytes32String(e.target.value),
            });
          }}
        />
        <div>{fbsp.cur}</div>
      </Row>
      <Row>
        <div>
          Returns a string representation of value formatted with unit digits (if it is a number) or to the unit
          specified (if a string).
        </div>
        <Input
          placeholder="ethers.utils.formatUnits"
          value={fu.init}
          onChange={e => {
            setFu({
              init: e.target.value,
              cur: ethers.utils.formatUnits(e.target.value),
            });
          }}
        />
        <div>{fu.cur}</div>
      </Row>

      <Row>
        <div>https://docs.ethers.io/v5/api/utils/bytes/#utils-isHexString</div>
        <Input
          placeholder="ethers.utils.isHexString"
          value={isHex.init}
          onChange={e => {
            setIsHex({
              init: e.target.value,
              cur: ethers.utils.formatUnits(e.target.value),
            });
          }}
        />
        <div>{isHex.cur}</div>
      </Row>
    </Col>
  );
}
