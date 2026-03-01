export interface IFNode {
    splitFeature?: number;
    splitValue?: number;
    left?: IFNode;
    right?: IFNode;
    size?: number; // External node size
    isExternal: boolean;
}

export interface TrainingDataPoint {
    vector: number[]; // [src_bytes, dst_bytes, duration, num_connections, error_rate]
}
