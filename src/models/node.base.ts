import { Container } from "inversify";
import { Logger } from "winston";
import { IoCContainer } from "../inversify.config";
import { i4Logger, NodeRedTransport } from "../logger/logger";
import { Message } from "./meassage";

export interface INodeBase {
    initialize(): void;
}

export abstract class NodeBase implements INodeBase {

    protected readonly logger: Logger;
    protected readonly container: Container = IoCContainer.getContainer();

    public onClose?: (done: () => void) => Promise<void>;
    public onInput?: (msg: Message, send: (msg: any) => void, done: (err?: any) => void) => Promise<void>;

    constructor(
        protected readonly node: any,
        protected readonly server: any,
        protected readonly credentials: any,
        protected readonly config: any,
    ) {
        this.logger = this.createLogger(node);
    }

    public initialize() {
        this.container.bind("api").toConstantValue(this.server.api);
        this.container.bind("identity").toConstantValue(this.server.identity);
        this.container.bind("username").toConstantValue(this.credentials.username);
        this.container.bind("password").toConstantValue(this.credentials.password);
        this.container.bind("clientId").toConstantValue(this.credentials.clientId);
        this.container.bind("clientSecret").toConstantValue(this.credentials.clientSecret);
        this.container.bind("scope").toConstantValue(this.credentials.scope);
        this.container.bind("context").toConstantValue(this.node.context());

        this.initializeInternal();
        if (this.onClose)
            this.node.on("close", this.onClose);
        if (this.onInput)
            this.node.on('input', this.onInput);
    }

    protected abstract initializeInternal(): void;

    protected createLogger(node: any) {
        let logger = this.container.get<i4Logger>(i4Logger);
        let customLogger = new NodeRedTransport(node);
        logger.logger.add(customLogger);
        return logger.logger;
    }
}
