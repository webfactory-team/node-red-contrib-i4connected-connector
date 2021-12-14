import { ComputationMode, INamedItem } from "./api";

export interface Signal extends INamedItem<string> {
    active: boolean;
    adapterTypeId?: number;
    adapterTypeName?: string;
    alias: string;
    counter: number;
    description: string;
    deviceAlias?: string;
    deviceName?: string;
    isCounter: boolean;
    mode?: ComputationMode;
    signalTypeId: number;
    signalTypeName?: string;
    sourceId: string;
    unit?: string;
    useAbsoluteValue: boolean;
    icon: string;
}
