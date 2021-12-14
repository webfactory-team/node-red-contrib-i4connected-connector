
export interface TokenInfo {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    expires_at?: Date;
}