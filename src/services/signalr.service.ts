import { injectable, inject } from 'inversify';
import { Subject } from 'rxjs';
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

    constructor(
        @inject("api") private readonly api: string,
        @inject(TokenProvider) private readonly tokenProvider: TokenProvider,
        @inject(i4Logger) private readonly logger: i4Logger
    ) {

    }

    public async start() {
        this.tokenProvider.start();
        this.connection = $.hubConnection(`${this.api}/signalr`);
        // todo set new once if refreshed, may implement a timer for refreshing in token provider.
        this.connection.qs = { "access_token": await this.tokenProvider.getAccessToken() };

        this.tokenProvider.tokens.subscribe(tokenInfo => {
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

        this.connection.error((error) => {
            this.logger.logger.error(error);
            this.serverState.next("error");
        });

        this.measurementhub.on('onServerStateChanged', (state: number) => {
            this.proxyState.next(state);
        });

        this.measurementhub.on('onMeasurement', (measurement: Measurement) => {
            this.measurements.next(measurement);
        });

        await this.connection.start();
    }

    public async stop() {
        this.logger.logger.debug(`Stopping signalR communication`);
        this.subscriptions.forEach(async subscription => {
            await this.unsubscribeInternal(subscription);
        });
        this.subscriptions.clear();
        this.connection.stop();
        this.tokenProvider.stop();
    }

    public async subscribe(id: string): Promise<Measurement> {
        if (this.subscriptions.has(id)) {
            this.logger.logger.warn(`Subscription for ${id} already exsist, skipping subscription`);
            return null;
        }

        this.logger.logger.debug(`Subscribe ${id}`);
        const measurement: Measurement = await this.measurementhub.invoke('subscribe', id);
        this.subscriptions.add(measurement.signalId);
        this.measurements.next(measurement);
        return measurement;
    }

    public async unsubscribe(id: string) {
        await this.unsubscribeInternal(id);
        this.subscriptions.delete(id);
    }

    private async unsubscribeInternal(id: string) {
        this.logger.logger.debug(`Unubscribe ${id}`);
        await this.measurementhub.invoke('unsubscribe', id);
    }
}