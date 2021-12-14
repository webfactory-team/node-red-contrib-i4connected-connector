import { injectable, inject } from 'inversify';
import { Subject } from 'rxjs';
import { i4Logger } from '../logger/logger';
import { Measurement } from '../models/measurement';
import { TokenProvider } from './token-provider';

const signalr = require('node-signalr')

@injectable()
export class SignalRNodeService {
    private client: any;

    public readonly measurements = new Subject<Measurement>();
    public readonly serverState = new Subject<{ topic: string, msg: any }>();
    public readonly proxyState = new Subject<number>();

    private subscriptions = new Set<string>();

    constructor(
        @inject("api") private readonly api: string,
        @inject(TokenProvider) private readonly tokenProvider: TokenProvider,
        @inject(i4Logger) private readonly logger: i4Logger
        ) {
    }

    public async start() {
        this.logger.logger.debug(`Starting signalR communication`);  
        this.client = new signalr.client(`${this.api}/signalr`, ['measurementhub'])
        this.client.qs['access_token'] = await this.tokenProvider.getAccessToken();

        this.client.connection.hub.on('measurementhub', 'OnServerStateChanged', (state: number) => {
            this.proxyState.next(state);
        });

        this.client.connection.hub.on('measurementhub', 'OnMeasurement', (measurement: Measurement) => {
            this.measurements.next(measurement);
        });

        this.client.on('reconnecting', (count) => {
            this.serverState.next({ topic: "reconnecting", msg: count });
        });
        this.client.on('disconnected', (code) => {
            this.serverState.next({ topic: "disconnected", msg: code });
        });

        await new Promise((resolve, reject) => {
            this.client.once('connected', () => {
                this.client.removeAllListeners("connected");
                this.client.removeAllListeners("error");
                this.serverState.next({ topic: "connected", msg: null });
                resolve(null);
            });
            this.client.once('error', (code, ex) => {
                this.client.removeAllListeners("connected");
                this.client.removeAllListeners("error");
                this.serverState.next({ topic: "error", msg: ex });
                reject(ex);
            });
            this.client.start();
        });

        this.client.on('connected', () => {
            this.serverState.next({ topic: "connected", msg: null });
        });
        this.client.on('error', (code, ex) => {
            this.serverState.next({ topic: "error", msg: ex });
        });
    }

    public async stop() {
        this.logger.logger.debug(`Stopping signalR communication`);  
        this.subscriptions.forEach(async subscription => {
            await this.unsubscribeInternal(subscription);
        });
        this.subscriptions.clear();

        this.client.end();
    }

    public async subscribe(id: string): Promise<Measurement> {
        if (this.subscriptions.has(id)) {
            this.logger.logger.warn(`Subscription for ${id} already exsist, skipping subscription`);            
            return null;
        }

        this.logger.logger.debug(`Subscribe ${id}`);  
        const measurement: Measurement = await this.client.connection.hub.call('measurementhub', 'Subscribe', id);
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
        await this.client.connection.hub.invoke('measurementhub', 'Unsubscribe', id);
    }
}