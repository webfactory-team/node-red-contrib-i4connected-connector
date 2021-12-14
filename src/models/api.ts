
export interface INamedItemWithType<TId> extends INamedItem<TId>, ITypedItem<TId> {
}

export interface ITypedItem<TId> extends IId<TId> {
    type: EntityType;
}

export interface INamedItem<TId> extends IId<TId> {
    name: string;
}

export interface IId<TId> {
    id: TId;
}

export enum EntityType {
    OrganizationalUnit = 0,
    Area = 1,
    Site = 2,
    Device = 3,
    Report = 4,
    ReportSchedule = 5,
    Event = 6,
    EventPriorities = 7,
    EventType = 8,
    EventGroup = 9,
    Part = 10,
    Order = 11,
    Article = 12,
    DetailsPage = 13,
    HierarchyRoot = 14,
    Signal = 15,
    Adapter = 16,
    Application = 17,
    User = 18,
    ResponseTeam = 19,
    NotificationProfile = 20
}


export enum ComputationMode {
    None = 0,
    EntityVariable = 1,
    OnlineScript = 2,
    HistoricalScript = 3,
    Compression = 4,
    Deleting = 5,
    Gps = 6
}