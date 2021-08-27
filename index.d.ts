export class ArrayBufferPool {
    constructor();
    allocate(parent: object, size: number): ArrayBuffer;
    release(buf: ArrayBuffer): void;
}

export type ScaledFreq = number;

export type Bit = 0 | 1;

export interface AnsOptions {
    outBits: number;
    precision: number;
}

export interface AnsOutput {
    state: number;
    buf: number[];
}

export class AnsEncoder {
    constructor(options: AnsOptions);
    writeBit(bit: Bit, predictedFreq: ScaledFreq): void;
    finish(): AnsOutput;
}

export class AnsDecoder {
    constructor(output: AnsOutput, options: AnsOptions);
    readBit(predictedFreq: ScaledFreq): Bit;
}

export interface Model {
    predict(context?: number): ScaledFreq;
    update(actualBit: Bit, context?: number): void;
    flushByte(currentByte: number, inBits: number): void;
    release?(): void;
}

export interface DirectContextModelOptions {
    inBits: number;
    contextBits: number;
    precision: number;
    modelMaxCount: number;
    modelRecipBaseCount: number;
    arrayBufferPool?: ArrayBufferPool;
}

export class DirectContextModel implements Model {
    constructor(options: DirectContextModelOptions);
    predict(context?: number): ScaledFreq;
    update(actualBit: Bit, context?: number): void;
    flushByte(currentByte: number, inBits: number): void;
    release(): void;
}

export interface SparseContextModelOptions extends DirectContextModelOptions {
    sparseSelector: number;
}

export class SparseContextModel implements DirectContextModel {
    constructor(options: SparseContextModelOptions);
    predict(context?: number): ScaledFreq;
    update(actualBit: Bit, context?: number): void;
    flushByte(currentByte: number, inBits: number): void;
    release(): void;
}

export interface LogisticMixModelOptions {
    recipLearningRate: number;
    precision: number;
}

export class LogisticMixModel implements Model {
    constructor(models: Model[], options: LogisticMixModelOptions);
    predict(context?: number): ScaledFreq;
    update(actualBit: Bit, context?: number): void;
    flushByte(currentByte: number, inBits: number): void;
    release(): void;
}

export interface DefaultModelOptions extends DirectContextModelOptions, LogisticMixModelOptions {
    sparseSelectors: number[];
    modelQuotes: boolean;
}

export class DefaultModel implements LogisticMixModel {
    constructor(options: DefaultModelOptions);
    predict(context?: number): ScaledFreq;
    update(actualBit: Bit, context?: number): void;
    flushByte(currentByte: number, inBits: number): void;
    release(): void;

    readonly quitesSeen: Set<number>;
}

export interface CompressOptions extends AnsOptions {
    inBits: number;
    preset?: number[];
    inputEndsWithByte?: number;
    calculateByteEntropy?: boolean;
}

export interface Output {
    inputLength: number;
    state: number;
    buf: number[];
}

export interface OutputExtra extends Output {
    bufLengthInBytes: number;
    byteEntropy?: number[];
}

export function compressWithModel(input: ArrayLike<number>, model: Model, options: CompressOptions): OutputExtra;
export function decompressWithModel(output: Output, model: Model, options: CompressOptions): number[];

export interface OptimizerProgressInfo<Params = number[]> {
    pass: string;
    passRatio?: number;
    current: Params;
    currentSize: number;
    currentRejected: boolean;
    best: Params;
    bestSize: number[];
    bestUpdated: boolean;
}

export interface OptimizerResult<Params = number[]> {
    elapsedMsecs: number;
    best: Params;
    bestSize: number[];
}

export function defaultSparseSelectors(numContexts?: number): number[];

export const enum InputType {
    JS = 'js',
    GLSL = 'glsl',
    HTML = 'html',
    Text = 'text',
    Binary = 'binary',
}

export const enum InputAction {
    Eval = 'eval',
    JSON = 'json',
    String = 'string',
    Write = 'write',
    Array = 'array',
    Uint8Array = 'u8array',
    Base64 = 'base64',
}

export interface Input {
    data: string | ArrayLike<number>;
    type: InputType;
    action: InputAction;
}

export interface PackerOptions {
    sparseSelectors?: number[];
    maxMemoryMB?: number;
    contextBits?: number;
    precision?: number;
    modelMaxCount?: number;
    modelRecipBaseCount?: number;
    arrayBufferPool?: ArrayBufferPool;
    recipLearningRate?: number;
    numAbbreviations?: number;
    allowFreeVars?: boolean;
}

export interface OptimizedPackerOptions {
    sparseSelectors: number[];
    precision?: number;
    modelMaxCount?: number;
    modelRecipBaseCount?: number;
    recipLearningRate?: number;
    numAbbreviations?: number;
    preferTextOverJS?: boolean;
}

export class Packer {
    constructor(inputs: Input[], options: PackerOptions);
    readonly memoryUsageMB: number;
    makeDecoder(): Packed;

    optimize(
        progress?: (info: OptimizerProgressInfo<OptimizedPackerOptions>) => undefined | boolean | Promise<undefined | boolean>,
    ): Promise<OptimizerResult<OptimizedPackerOptions>>;
    optimize(
        level: number,
        progress?: (info: OptimizerProgressInfo<OptimizedPackerOptions>) => undefined | boolean | Promise<undefined | boolean>,
    ): Promise<OptimizerResult<OptimizedPackerOptions>>;
}

export interface Packed {
    readonly firstLine: string;
    readonly firstLineLengthInBytes: number;
    readonly secondLine: string;
    readonly freeVars: string[];
    estimateLength(): number;
}

