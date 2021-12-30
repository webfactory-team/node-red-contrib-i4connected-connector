import "reflect-metadata";
import { SignalRService } from "../services/signalr.service";
import { Message } from "../models/meassage";
import { NodeBase } from "../models/node.base";
import { Subscription } from "rxjs";

export = function (RED) {
    "use strict";
    function SignalNode(config) {
        RED.nodes.createNode(this, config);
        let node = this;
        this.server = RED.nodes.getNode(config.server);
        if (!this.server)
            return;

        const signals = new Signals(node, this.server, RED.nodes.getCredentials(config.server), config);
        signals.initialize();
    }
    RED.nodes.registerType("signals", SignalNode);
};

class Signals extends NodeBase {
    private client: SignalRService;

    private proxyStateSubscription: Subscription;
    private serverStateSubscription: Subscription;
    private measurementsSubscription: Subscription;

    private retryWaitTime = 50;

    public onClose = async (done: () => void) => {
        this.proxyStateSubscription.unsubscribe();
        this.serverStateSubscription.unsubscribe();
        this.measurementsSubscription.unsubscribe();
        await this.client.stop();
        done();
    }

    public onInput = async (msg: Message, send: (msg: any) => void, done: (err?: any) => void) => {
        if (msg.topic) {
            try {
                switch (msg.payload) {
                    case "unsubscribe":
                        await this.client.unsubscribe(msg.topic);
                        break;
                    default:
                        await this.client.subscribe(msg.topic);
                        break;
                }
            } catch (err) {
                done(err);
            }
        }
        done();
    }

    public initializeInternal() {
        this.node.status({ fill: "yellow", shape: "ring", text: "node-red:common.status.not-connected" });
        this.client = this.createClient();
        this.subscribeClientEvents();

        this.client.start().catch(e => {
            this.logger.error(e);
            this.node.status({ fill: "red", shape: "dot", text: "Could not start" });
        });
        this.node.status({ fill: "green", shape: "ring", text: "node-red:common.status.connecting" });
    }

    private subscribeClientEvents() {
        this.proxyStateSubscription = this.client.proxyState.subscribe(x => {

        });

        this.serverStateSubscription = this.client.serverState.subscribe(async x => {
            switch (x) {
                case "reconnecting":
                    this.node.status({ fill: "blue ", shape: "ring", text: x });
                    break;
                case "disconnected":
                    this.node.status({ fill: "red", shape: "ring", text: "node-red:common.status.disconnected" });
                    break;
                case "connectionSlow":
                    this.node.status({ fill: "yellow", shape: "ring", text: x });
                    break;
                case "error":
                    this.node.status({ fill: "red", shape: "ring", text: "node-red:common.status.error" });
                    await this.reconnect();
                    break;
                case "starting":
                    this.node.status({ fill: "green", shape: "ring", text: "node-red:common.status.connecting" });
                    break;
                case "connected":
                case "reconnected":
                    this.node.status({ fill: "green", shape: "dot", text: "node-red:common.status.connected" });
                    break;
            }
        });

        this.measurementsSubscription = this.client.measurements.subscribe(measurement => {
            this.logger.debug(JSON.stringify(measurement))
            var msg = {
                topic: measurement.signalId,
                payload: measurement
            } as Message;
            this.node.send(msg);
        });
    }

    private async reconnect() {
        try {
            await this.wait(this.retryWaitTime);
            this.logger.info(`reconnect`);
            await this.client.stop();
            await this.client.start();
            this.retryWaitTime = 50;
        } catch (err) {
            this.retryWaitTime = this.retryWaitTime * 2;
            this.retryWaitTime = Math.min(this.retryWaitTime, 30000);
            this.logger.error(err);
            this.reconnect();
        }
    }

    private wait(ms: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    private createClient() {
        this.logger.info(`Creating SignalR api: ${this.server.api}`);
        const client = this.container.get<SignalRService>(SignalRService);
        return client;
    }
}
