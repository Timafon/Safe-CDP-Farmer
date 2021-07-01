import React from 'react';
import { Button, Row, Col, Typography, Card, DatePicker, Divider, Input, List, Progress, Slider, Spin, Switch } from "antd";


export function SafeFarmer() {
    const [deposit, setDeposit] = React.useState('');

    return (
        <Row justify="center">
            <Col>
                <Row gutter={4}>
                    <Typography level={3}>SafeCDPFarmer</Typography>
                </Row>
                <Row gutter={4}>
                    <Typography strong>Target Health Factor:</Typography>
                </Row>
                <Row gutter={4}>
                    <Button>Deposit</Button>
                    <Input
                        value={deposit}
                        onChange={e => setDeposit(e.target.value)}
                    />
                </Row>
                <Row gutter={4}>
                    <Button>Withdraw</Button>
                </Row>
                <Row gutter={4}>
                    <Button>Rebalance</Button>
                </Row>
            </Col>
        </Row>
    )
}
