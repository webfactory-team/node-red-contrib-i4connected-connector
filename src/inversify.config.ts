import { Container, decorate, injectable } from "inversify";
import { i4Logger } from "./logger/logger";
import { Oauth2Service } from "./services/oauth2.service";
import { SignalRService } from "./services/signalr.service";
//import { SignalRNodeService } from "./services/signalr-node.service";
import { SignalsService } from "./services/signals.service";
import { TokenProvider } from "./services/token-provider";
import { TokenStore } from "./services/token-store";

export class IoCContainer {
    static getContainer() {
        const container = new Container();

        container.bind(SignalRService).to(SignalRService).inSingletonScope();
        //  container.bind(SignalRNodeService).to(SignalRNodeService).inSingletonScope();
        container.bind(SignalsService).to(SignalsService).inSingletonScope();

        container.bind(TokenProvider).to(TokenProvider).inSingletonScope();
        container.bind(Oauth2Service).to(Oauth2Service).inRequestScope();
        container.bind(TokenStore).to(TokenStore).inRequestScope();

        container.bind(i4Logger).to(i4Logger).inSingletonScope();

        return container;
    }
}