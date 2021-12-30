import { injectable, inject } from "inversify";
import { TokenInfo } from "../models/token-info";

@injectable()
export class TokenStore {

    constructor(
        @inject("context") private readonly context: any,
    ) {

    }

    public getTokenInfo() {
        if (!this.context) return null;
        const tokenInfo: TokenInfo = this.context.get("tokenInfo") || null
        return tokenInfo;
    }

    public setTokenInfo(tokenInfo: TokenInfo): void {
        if (!this.context) return;
        this.context.set("tokenInfo", tokenInfo);
    }
}