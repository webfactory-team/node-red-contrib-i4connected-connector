import { ComputationMode, INamedItemWithType } from "./api";

export interface ISignalFilterParameters extends IObjectFilterParameters {
    excludedIds: string[];
    adapterSignals: TriStateOption;
    excludedModes?: ComputationMode[];
}

export interface IObjectFilterParameters extends IObjectFilter {
    types: string[];
    selectedTypes: string[];
    minPatternLength?: number;
    autoFilter?: boolean;
    minItems?: number;
    maxItems?: number;
    singleSelectionMode?: boolean;
    title?: string;
    subtitle?: string;
    notificationName?: string;
}

export interface IObjectFilter {
    adapterId: string;
    adapterTypeId: number;
    areaScope: INamedItemWithType<string>[];
    deviceManufacturerIds: number[];
    deviceModelIds: number[];
    deviceScope: INamedItemWithType<string>[];
    deviceTypeIds: number[];
    entityVariables: TriStateOption;
    excludedIds?: string[];
    filterOptions: AdvancedObjectFilterOptions;
    hardwareVersionIds: number[];
    hidden: TriStateOption;
    inactive: TriStateOption;
    languageId: number;
    metadataFilter?: any[];
    pattern: string;
    selectedItems?: INamedItemWithType<string>[];
    signalTypes: number[];
    siteTypeId: number;
    softwareVersionIds: number[];
}

export enum TriStateOption {
    No = 0,
    Yes = 1,
    YesExclusively = 2
}

export enum AdvancedObjectFilterOptions {
    None = 0,
    DeviceCategories = 1,
    Versions = 2,
    Adapters = 4,
    EntityVariables = 8,
    HiddenDevices = 16,
    InactiveDevices = 32,
    SiteType = 64,
    DeviceScope = 128,
    AreaScope = 256
}