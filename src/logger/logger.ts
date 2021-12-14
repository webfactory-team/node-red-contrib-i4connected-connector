import { createLogger, format } from "winston";
import Transport from 'winston-transport';
import { injectable } from "inversify";

export class NodeRedTransport extends Transport {

    constructor(private readonly node: any) {
        super();
    }

    public log(info: any, next: () => void) {
        setImmediate(() => {
            switch (info["level"]) {
                case "error":
                    this.node.error(info["message"]);
                    break;
                case "warn":
                    this.node.warn(info["message"]);
                    break;
                case "debug":
                    this.node.debug(info["message"]);
                    break;
                case "trace":
                    this.node.trace(info["message"]);
                    break;
                default:
                    this.node.log(info["message"]);
                    break;
            }
        });
        next();
    }
}

@injectable()
export class i4Logger {
    public readonly logger = createLogger({
        level: 'debug',
        format: format.simple(),
        transports: [
        ]
    });
}
