import "reflect-metadata";
import { SignalsService } from "../services/signals.service";
import { NodeBase } from "../models/node.base";
import { Message } from "../models/meassage";

export = function (RED) {
    "use strict";

    function WriteNode(config) {
        RED.nodes.createNode(this, config);
        let node = this;
        this.server = RED.nodes.getNode(config.server);
        if (!this.server)
            return;

        const signals = new Write(node, this.server, RED.nodes.getCredentials(config.server), config);
        signals.initialize();

    }

    RED.nodes.registerType("write", WriteNode);
};

class Write extends NodeBase {
    private client: SignalsService;

    public onClose = async (done: () => void) => {
        done();
    }

    public onInput = async (msg: Message, send: (msg: any) => void, done: (err?: any) => void) => {
        this.node.status({ fill: "green", shape: "ring", text: "writing" });
        try {
            if (msg.topic) {
                if (msg.payload) {
                    const write = {
                        signalId: msg.topic || msg.payload.signalId,
                        value: msg.payload.value,
                        timestamp: msg.payload.timestamp || new Date().toISOString()
                    }
                    const result = await this.client.writeSignal(write);

                    if (!result.successful) {
                        this.node.status({ fill: "red", shape: "ring", text: "failed" });
                        done(result.errorMessage);
                    } else {
                        this.node.status({ fill: "green", shape: "dot", text: "written" });
                        done();
                    }
                }
            }
        } catch (err) {
            this.node.status({ fill: "red", shape: "ring", text: "failed" });
            done(err);
        } finally {
            send(msg);
        }
    }

    public initializeInternal() {
        this.client = this.createClient();
    }

    private createClient() {
        this.logger.info(`Creating SignalR api: ${this.server.api}`);
        const client = this.container.get<SignalsService>(SignalsService);
        return client;
    }
}

