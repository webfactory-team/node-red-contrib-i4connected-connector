import { injectable, inject } from "inversify";
import { i4Logger } from "../logger/logger";
import { TokenInfo } from "../models/token-info";

@injectable()
export class TokenStore {

    constructor(
        @inject("context") private readonly context: any,
        @inject(i4Logger) private readonly logger: i4Logger
    ) {

    }

    public getTokenInfo() {
        if (!this.context) return null;
        this.logger.logger.debug("Get tokenInfo");
        const tokenInfo: TokenInfo = this.context.get("tokenInfo") || null
        return tokenInfo;
    }

    public setTokenInfo(tokenInfo: TokenInfo): void {
        if (!this.context) return;
        this.logger.logger.debug("Set tokenInfo");
        this.context.set("tokenInfo", tokenInfo);
    }
}