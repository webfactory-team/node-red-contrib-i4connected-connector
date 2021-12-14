import { injectable, inject } from "inversify";
import axios from "axios";
import { TokenInfo } from "../models/token-info";
import { i4Logger } from "../logger/logger";

@injectable()
export class Oauth2Service {

    constructor(
        @inject("identity") private readonly identity: string,
        @inject("username") private readonly username: string,
        @inject("password") private readonly password: string,
        @inject("clientId") private readonly clientId: string,
        @inject("clientSecret") private readonly clientSecret: string,
        @inject("scope") private readonly scope: string,
        @inject(i4Logger) private readonly logger: i4Logger
    ) {

    }

    public async getToken() {
        const tokenRequest = {
            client_id:  this.clientId,
            client_secret: this.clientSecret,
            grant_type: "password",
            scope: this.scope,
            username: this.username,
            password: this.password
        };
        this.logger.logger.debug(`Request token from: ${this.identity}/connect/token as client ${tokenRequest.client_id}`);
        const result = await axios.post<TokenInfo>(`${this.identity}/connect/token`, new URLSearchParams(tokenRequest).toString(), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
        );
        return result.data;
    }

}