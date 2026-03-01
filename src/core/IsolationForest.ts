import { IFNode, TrainingDataPoint } from "./IFTypes";
import { Packet } from "./types";

// Standard Euler's constant approximation
const EULER_MASCHERONI = 0.5772156649;

export class IsolationForest {
  private trees: IFNode[] = [];
  private subSampleSize: number;
  private numberOfTrees: number;
  private isTrained: boolean = false;

  constructor(numberOfTrees: number = 100, subSampleSize: number = 256) {
    this.numberOfTrees = numberOfTrees;
    this.subSampleSize = subSampleSize;
  }

  // Precompute average path length of unsuccessful search in BST
  // c(n) = 2H(n-1) - (2(n-1)/n)
  private c(n: number): number {
    if (n <= 1) return 0; // Base case for small N
    const H = Math.log(n - 1) + EULER_MASCHERONI;
    return 2 * H - (2 * (n - 1) / n);
  }

  public train(packets: Packet[]) {
    const data: TrainingDataPoint[] = packets.map(p => ({
      vector: [p.src_bytes, p.dst_bytes, p.duration, p.num_connections, p.error_rate]
    }));

    this.trees = [];
    
    // Limit subsample size to actual data size if smaller
    const actualSubSample = Math.min(this.subSampleSize, data.length);
    const heightLimit = Math.ceil(Math.log2(actualSubSample));

    for (let i = 0; i < this.numberOfTrees; i++) {
        const sample = this.getSubSample(data, actualSubSample);
        const tree = this.buildTree(sample, 0, heightLimit);
        this.trees.push(tree);
    }
    
    this.isTrained = true;
    console.log(`[IsolationForest] Trained ${this.numberOfTrees} trees with subsample size ${actualSubSample}`);
  }

  private getSubSample(data: TrainingDataPoint[], size: number): TrainingDataPoint[] {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  }

  private buildTree(data: TrainingDataPoint[], currentHeight: number, heightLimit: number): IFNode {
    if (currentHeight >= heightLimit || data.length <= 1) {
        return { isExternal: true, size: data.length };
    }

    // Randomly select a feature (0 to 4)
    const numFeatures = data[0].vector.length;
    const splitFeature = Math.floor(Math.random() * numFeatures);

    // Get min/max for this feature
    let min = data[0].vector[splitFeature];
    let max = data[0].vector[splitFeature];
    for (const p of data) {
        const val = p.vector[splitFeature];
        if (val < min) min = val;
        if (val > max) max = val;
    }

    if (min === max) {
        return { isExternal: true, size: data.length };
    }

    // Random split value between min and max
    const splitValue = min + Math.random() * (max - min);

    const leftData = data.filter(p => p.vector[splitFeature] < splitValue);
    const rightData = data.filter(p => p.vector[splitFeature] >= splitValue);

    return {
        isExternal: false,
        splitFeature,
        splitValue,
        left: this.buildTree(leftData, currentHeight + 1, heightLimit),
        right: this.buildTree(rightData, currentHeight + 1, heightLimit)
    };
  }

  public score(packet: Packet): number {
    if (!this.isTrained) return 0.5;

    const vector = [packet.src_bytes, packet.dst_bytes, packet.duration, packet.num_connections, packet.error_rate];
    let totalPathLength = 0;

    for (const tree of this.trees) {
        totalPathLength += this.pathLength(vector, tree, 0);
    }

    const avgPathLength = totalPathLength / this.numberOfTrees;
    const cn = this.c(this.subSampleSize);
    
    // Anomaly Score s(x, n) = 2^(-E(h(x)) / c(n))
    if (cn === 0) return 0.5; // Avoid division by zero
    const score = Math.pow(2, -(avgPathLength / cn));
    
    return score;
  }

  private pathLength(vector: number[], node: IFNode, currentHeight: number): number {
    if (node.isExternal) {
        // Adjustment for unbuilt tree below limit
        // c(size) adds the average path length of the remaining unbuilt tree
        // If size <= 1, c(size) is 0, so just return currentHeight
        return currentHeight + this.c(node.size!); 
    }

    if (vector[node.splitFeature!] < node.splitValue!) {
        return this.pathLength(vector, node.left!, currentHeight + 1);
    } else {
        return this.pathLength(vector, node.right!, currentHeight + 1);
    }
  }
}
