import { injectable, inject } from 'inversify';
import { async, Subject, Subscription } from 'rxjs';
import { i4Logger } from '../logger/logger';
import { Measurement } from '../models/measurement';
import { TokenProvider } from './token-provider';

// Ugly polyfill
var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM('<html></html>');
var $ = require('jquery')(window);
window.jQuery = $;
global.window = window;
global.WebSocket = global.WebSocket || require("ws");
require('signalr');

@injectable()
export class SignalRService {
    private connection: any;
    private measurementhub: any;

    public readonly measurements = new Subject<Measurement>();
    public readonly serverState = new Subject<string>();
    public readonly proxyState = new Subject<number>();

    private subscriptions = new Set<string>();
    private tokensSubscription: Subscription;

    constructor(
        @inject("api") private readonly api: string,
        @inject(TokenProvider) private readonly tokenProvider: TokenProvider,
        @inject(i4Logger) private readonly logger: i4Logger
    ) {

    }

    public async start() {
        this.tokenProvider.start();
        this.connection = $.hubConnection(`${this.api}/signalr`);
        this.connection.qs = { "access_token": await this.tokenProvider.getAccessToken() };

        this.tokensSubscription = this.tokenProvider.tokens.subscribe(tokenInfo => {
            if (tokenInfo && tokenInfo.access_token)
                this.connection.qs = { "access_token": tokenInfo.access_token };
        });

        this.measurementhub = this.connection.createHubProxy('measurementhub');
        this.connection.stateChanged((connectionState) => {
            if (connectionState.newState === 1)
                this.serverState.next("connected")
        });

        this.connection.starting(() => this.serverState.next("starting"));
        this.connection.connectionSlow(() => this.serverState.next("connectionSlow"));
        this.connection.reconnecting(() => this.serverState.next("reconnecting"));
        this.connection.reconnected(() => this.serverState.next("reconnected"));
        this.connection.disconnected(() => this.serverState.next("disconnected"));

        this.connection.error(() => this.serverState.next("error"));

        this.measurementhub.on('onServerStateChanged', (state: number) => {
            this.proxyState.next(state);
        });

        this.measurementhub.on('onMeasurement', (measurement: Measurement) => {
            this.measurements.next(measurement);
        });

        await this.connection.start();
        await this.subscribeSubscriptions();
    }

    public async stop() {
        this.logger.logger.debug(`Stopping signalR communication`);
        this.tokensSubscription.unsubscribe();
        this.tokenProvider.stop();
        this.connection.stop();
    }

    public async subscribe(id: string): Promise<Measurement> {
        this.logger.logger.debug(`Subscribe ${id}`);
        if (this.connection && this.measurementhub) {
            const measurement: Measurement = await this.measurementhub.invoke('subscribe', id);
            this.subscriptions.add(measurement.signalId);
            this.measurements.next(measurement);
            return measurement;
        }
        return null;
    }

    public async unsubscribe(id: string) {
        this.logger.logger.debug(`Unubscribe ${id}`);
        if (this.connection && this.measurementhub) {
            await this.measurementhub.invoke('unsubscribe', id);
        }
        this.subscriptions.delete(id);
    }

    private async subscribeSubscriptions() {
        this.logger.logger.debug(`Subscribe subscriptions`);
        for (const subscription of this.subscriptions) {
            await this.subscribe(subscription);
        }
    }
}