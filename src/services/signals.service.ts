import axios from 'axios';
import { injectable, inject } from 'inversify';
import { WriteSignalInfo } from '../models/write-signal-info';
import { Signal } from '../models/signal';
import { TokenProvider } from './token-provider';
import { ISignalFilterParameters, TriStateOption, AdvancedObjectFilterOptions } from '../models/signal-filter';

@injectable()
export class SignalsService {
    constructor(
        @inject("api") private readonly api: string,
        @inject(TokenProvider) private readonly tokenProvider: TokenProvider) {
    }

    private getDefaultFilterOptions(): ISignalFilterParameters {
        return {
            languageId: 9,
            types: ["OrganizationalUnit", "Site", "Area", "Device"],
            selectedTypes: ["Device"],
            minPatternLength: 0,
            minItems: 0,
            maxItems: 5,
            autoFilter: true,
            pattern: "",
            selectedItems: [],
            singleSelectionMode: false,
            filterOptions: AdvancedObjectFilterOptions.DeviceCategories
                | AdvancedObjectFilterOptions.HiddenDevices
                | AdvancedObjectFilterOptions.EntityVariables
                | AdvancedObjectFilterOptions.InactiveDevices
                | AdvancedObjectFilterOptions.Adapters
                | AdvancedObjectFilterOptions.DeviceScope,
            deviceTypeIds: null,
            deviceManufacturerIds: null,
            deviceModelIds: null,
            hardwareVersionIds: null,
            softwareVersionIds: null,
            hidden: TriStateOption.No,
            inactive: TriStateOption.No,
            entityVariables: TriStateOption.No,
            adapterTypeId: null,
            adapterId: null,
            signalTypes: null,
            siteTypeId: null,
            deviceScope: [],
            title: null,
            subtitle: null,
            adapterSignals: TriStateOption.No,
            excludedIds: [],
            areaScope: []
        } as ISignalFilterParameters;
    };

    public async getSignals(pattern: string = "", pageSize: number = 100, pageNumber: number = 1) {
        const url = `${this.api}/api/signals/list?pageSize=${pageSize}&pageNumber=${pageNumber}`;
        const token = await this.tokenProvider.getTokenInfo();

        const filter = this.getDefaultFilterOptions();
        filter.pattern = pattern;

        const result = await axios.post<Signal[]>(url, filter, {
            headers: {
                Authorization: `${token.token_type} ${token.access_token}`
            }
        });
        return result.data;
    }

    public async writeSignal(data: WriteSignalInfo) {
        const url = `${this.api}/api/signals/${data.signalId}/write`;
        const token = await this.tokenProvider.getTokenInfo();
        const result = await axios.post<ActionResult>(url, data, {
            headers: {
                Authorization: `${token.token_type} ${token.access_token}`
            }
        });
        return result.data;
    }
}