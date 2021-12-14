export interface Message {
    topic: string;
    payload: any;
    [x: string]: any;
}