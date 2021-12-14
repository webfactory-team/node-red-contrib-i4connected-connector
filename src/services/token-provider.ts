import { injectable, inject } from "inversify";
import { Subject } from "rxjs";
import { i4Logger } from "../logger/logger";
import { TokenInfo } from "../models/token-info";

import { Oauth2Service } from "./oauth2.service";
import { TokenStore } from "./token-store";


@injectable()
export class TokenProvider {
    public readonly tokens = new Subject<TokenInfo>();
    private tokenChecker: NodeJS.Timer;

    constructor(
        @inject(Oauth2Service) private readonly oauth2Service: Oauth2Service,
        @inject(TokenStore) private readonly tokenStore: TokenStore,
        @inject(i4Logger) private readonly logger: i4Logger) {
    }

    public start() {
        this.logger.logger.debug(`Start token checker`);
        this.tokenChecker = setInterval(async () => {
            try {
                this.logger.logger.debug(`Check token`);
                await this.getTokenInfo();
            } catch (err) {
                this.logger.logger.error(err);
            }
        }, 10000);
    }

    public stop() {
        this.logger.logger.debug(`Stop token checker`);
        if (this.tokenChecker) {
            clearInterval(this.tokenChecker);
            this.tokenChecker = null;
        }
        this.tokens.unsubscribe();
    }

    public async getAccessToken() {
        const tokenInfo = await this.getTokenInfo();
        return tokenInfo.access_token;
    }

    public async getTokenInfo() {
        let tokenInfo = this.tokenStore.getTokenInfo();
        if (!tokenInfo || (tokenInfo.expires_at != null && ((tokenInfo.expires_at.getTime()) < Date.now()))) {
            this.logger.logger.debug("Token expired, getting new one");
            tokenInfo = await this.oauth2Service.getToken();
            var now = Date.now()
            tokenInfo.expires_at = new Date(now + ((tokenInfo.expires_in * 1000) / 2));
            this.tokenStore.setTokenInfo(tokenInfo);
            this.tokens.next(tokenInfo);
        }
        return tokenInfo;
    }
}