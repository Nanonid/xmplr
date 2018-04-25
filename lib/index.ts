import * as fs from "fs"
import * as path from "path"
import { Beta } from "lib-r-math.js"

export let { rbeta } = Beta()
export type fRBeta = (n: number, shape1: number, shape2: number, ncp?: number) => number | number[]

export function readArray(path: string, skipN: number = 0): string[] {
    var data = fs.readFileSync(path)
    var array = data.toString().split(/[\r\n]+/);
    if (skipN > 0) {
        array = array.slice(skipN)
    }
    return array
}

export interface IModel {
    next(): any
}

export interface IRandom {
    next(): number
}

/**
 * Normal distribution, using Math.random()
 */
export class xNormRand implements IRandom {
    next() {
        return Math.random()
    }
}

/**
 * Beta distribution, default is libRmath.js rbeta
 * Default (1,3) heavily weighted in first 40% good default for
 * infrequent spiky traffic.
 * [beta wiki entry]{@link https://en.wikipedia.org/wiki/Beta_distribution}
 */
export class xBetaRand implements IRandom {
    constructor(public alpha: number = 1, public beta: number = 5, public fbeta: fRBeta = rbeta) {
    }
    next() {
        return this.fbeta(1, this.alpha, this.beta) as number
    }
}


/**
 * xRateRand poisson distribution of arrival with "rate" per time unit.
 * Use to simulate arrival of events per time period, like packets per second.
 * [see]{@link http://preshing.com/20111007/how-to-generate-random-timings-for-a-poisson-process/}
 * Default distribution is normal (xNormRand)
 * Use default xBetaRand for normally low rate traffic with occasional spikes.
 */
export class xRateRand implements IRandom {
    constructor(public rate: number, public dist: IRandom = new xNormRand()) {
    }

    next() {
        const rand = this.dist.next()
        return this.rate * -Math.log(1.0 - rand)
    }

    /**
     * Cumulative rate after N multiple of periods
     * Guarantees dist.next() will be called at least once in each period.
     * @param period positive number of periods
     */
    nextPeriod(period: number) {
        let result = 0
        while (period > 1.0) {
            result += this.next()
            period -= 1.0
        }
        result = result + period * this.next()
        return result
    }
}

export class xList {
    constructor(public states: string[], public weights?: number[]) {
        this.normWeights = []
        if (weights === undefined) {
            this.weights = weights = []
            for (let i = 0; i < states.length; i++) {
                weights.push(1)
            }
        }
        if (states.length != weights.length) {
            throw new Error("States and weights must match length")
        }
        states.forEach((state, index) => this.stateIndex.set(state, index))
        this.update()
    }

    stateIndex = new Map<string, number>()
    total: number = 0
    normWeights: number[]

    update(): number {
        this.updateTotal()
        this.updateNorms()
        return this.total
    }

    updateTotal(): number {
        const total = this.total = this.weights!.reduce((total, weight) => total + weight)
        if (total <= 0) {
            throw new Error("Invalid weights")
        }
        return total
    }

    updateNorms(): number[] {
        return this.normWeights = this.weights!.map((weight) => weight / this.total)
    }

    /**
     * NB Does Not Update Norms! After updating any number of weights, updateNorms.
     * @param state 
     * @param plusWeight 
     */
    addState(state: string, plusWeight: number): number {
        const idx = this.states.indexOf(state)
        if (idx < 0) {
            throw new Error(`Unknown state ${state}`)
        }
        this.total += plusWeight
        const newWeight = this.weights![idx] = this.weights![idx] + plusWeight
        return newWeight
    }
}

export function range(startOrStop: number, stop?: number, step?: number): number[] {
    let result: number[] = []
    let idx = 0
    if (stop) {
        idx = startOrStop
    } else {
        stop = startOrStop
    }
    if (!step) {
        step = 1
    }
    while (idx < stop) {
        result.push(idx)
        idx += step
    }
    return result
}

/**
 * Find first interval that contains val in (-inf,ar[0],...,ar[n-1],+inf)
 * such that ar[i-1] < val <= ar[i]
 * If val in (-inf,ar[0]] first interval (0)
 * if val in (ar[0],ar[1]] second interval (1)
 * if val > ar[n-1] return n
 * @param ar 
 * @param val 
 */
export function findFirst(ar: number[], val: number): number {
    var start = 1
    var end = ar.length - 1
    var cmp = val - ar[0]
    var cur = start
    cmp = val - ar[0]
    // in interval -inf < val <= ar[0]
    if (cmp <= 0) {
        return 0
    }
    // in interval ar[end] < val < inf
    if (val > ar[end]) {
        return ar.length
    }
    while (start < end) {
        cur = (start + end) >> 1
        cmp = val - ar[cur]
        if (cmp > 0) {
            start = cur + 1
        } else if (cmp < 0) {
            end = cur - 1
        } else {
            return cur
        }
    }
    cur = (start + end) >> 1
    if (val <= ar[cur - 1]) {
        return cur - 1
    }
    if (val <= ar[cur]) {
        return cur
    }
    return cur + 1
}

export class xIndex implements IModel {
    constructor(public list: xList, public dist?: IRandom) {
        if (dist === undefined || dist === null) {
            this.dist = new xNormRand()
        }
        this.sort()
    }

    sortedWeights: number[] = []
    cumulativeWeights: number[] = []

    sort() {
        this.sortedWeights = range(this.list.weights!.length)
        const weights = this.list.normWeights
        let cum = 0
        this.sortedWeights.sort((lhsIdx, rhsIdx) => weights[rhsIdx] - weights[lhsIdx])
        this.cumulativeWeights = this.sortedWeights.map(idx => cum += weights[idx])
    }

    /**
     * First cumulative interval for probability
     * @param prob
     */
    firstInterval(prob: number): number {
        if (prob <= 0) {
            return -1
        }
        return findFirst(this.cumulativeWeights, prob)
    }

    intervalFor(p: number): number | null {
        const idx = this.firstInterval(p)
        if (idx >= this.sortedWeights.length || idx < 0) {
            return null
        }
        return this.sortedWeights[idx]
    }

    stateFor(prob: number): string | null {
        const idx = this.intervalFor(prob)
        if (idx !== undefined && idx !== null) {
            return this.list.states[idx]
        }
        return null
    }

    cumulativeForState(state: string): number {
        let idx = this.list.stateIndex.get(state)
        if (idx === undefined) {
            return -1
        }
        let cidx = this.sortedWeights.indexOf(idx)
        if (cidx < 0) {
            return -1
        }
        return this.cumulativeWeights[cidx]
    }

    next(): string {
        let state = this.stateFor(this.dist!.next())
        return state!
    }
}

export class xObject implements IModel {
    constructor(public model: { [id: string]: IModel }) {
    }

    next() {
        let result: any = {}
        Object.keys(this.model).forEach((key) => result[key] = this.model[key].next())
        return result
    }
}

/**
 * index contains states that are comma seperated assigned to **fields**.
 */
export class xCSVObject extends xIndex {
    constructor(public list:xList, public fields:string[], public dist:IRandom = new xNormRand() ){
        super(list,dist)
    }
    next() {
        let result: any = {}
        let states: string[] = super.next().split(",")
        let cnt = Math.min(states.length,this.fields.length)
        for( let i = 0; i < cnt; i++ ){
            result[this.fields[i]] = states[i].trim()
        }
        return result
    }
}

export class xInterval implements IModel {
    interval: number
    constructor(public start: number, public end: number, public dist: IRandom = new xNormRand()) {
        this.interval = end - start
    }
    next(): any {
        return this.start + this.dist.next() * this.interval
    }
}

export const FIRST_NAMES_CSV = "data/First_Names.csv"
export const LAST_NAMES_CSV = "data/Last_Names.csv"
export const STREET_NAMES_CSV = "data/Street_Names.csv"
export const ZIP_CODES_CSV = "data/US_Zip_Codes.csv"

export class xFirstNames extends xIndex {
    constructor(public f: any = path.resolve(__dirname + "/../" + FIRST_NAMES_CSV) as string) {
        super(new xList(readArray(f, 1)))
    }
}

export class xLastNames extends xIndex {
    constructor(public f: any = path.resolve(__dirname + "/../" + LAST_NAMES_CSV) as string) {
        super(new xList(readArray(f, 1)))
    }
}

export class xFullNames implements IModel {
    constructor(public first: xIndex = new xFirstNames(), public last: xIndex = new xLastNames()) {
    }
    next() {
        return this.first.next() + " " + this.last.next()
    }
}

export class xZipCodes extends xCSVObject {
    constructor(public f: any = path.resolve(__dirname + "/../" + ZIP_CODES_CSV) as string, public fields:string[] = ["Zip","Lat","Lon"]) {
        super(new xList(readArray(f, 1)),fields)
    }    
}

export class xDates extends xInterval {
    constructor(public fromDate: Date, public toDate: Date = new Date(), public dist: IRandom = new xNormRand()) {
        super(fromDate.getTime(), toDate.getTime(), dist)
    }
    next() {
        return new Date(super.next())
    }
}

export function daysInPast(days: number): Date {
    var today = new Date()
    today.setDate(days)
    return today
}

/**
 * Common dates for recent technology acquisition.
 * Dates skewing to last few years up to 10 years ago.
 */
export class xTendRecentDates extends xDates {
    constructor(public fromDate: Date = daysInPast(365 * -10), public toDate: Date = new Date(), public dist: IRandom = new xBetaRand(3, 1)) {
        super(fromDate, toDate, dist)
    }
    next() {
        return new Date(super.next())
    }
}

/**
 * Generate **model** arrivals per **ratePerMsec** {@see xRateRand} with an **optional minimum arrivals**
 * Contains internal millisecond clock that will be used as period if not provided.
 */
export class xRateModel implements IModel {
    lastTime :number = new Date().getTime()
    lastDeltaMSec: number = 0
    lastCount: number = 0
    constructor(public model:IModel, public ratePerMSec:xRateRand, public minimum:number = 0 ){
    }
    start(){
        this.lastTime = new Date().getTime()
    }
    next() : any[] {
        return this.nextPeriod(new Date().getTime() - this.lastTime)
    }
    nextPeriod(deltaMSec:number) : any[] {
        this.lastDeltaMSec = deltaMSec
        this.lastTime += deltaMSec
        const arrivals = Math.trunc(this.ratePerMSec.nextPeriod(deltaMSec)) + this.minimum
        let result = []
        for( let cnt = 0; cnt < arrivals; cnt++ ){
            result.push( this.model.next() )
        }
        this.lastCount = result.length
        return result    
    }
}
/**
 * Technology use skews younger, use default xBetaRand(1,3)
 */
export class xAdultAges extends xInterval {
    constructor(public young: number = 18, public old: number = 81, public dist: IRandom = new xBetaRand()) {
        super(young, old, dist)
    }
    next() {
        return Math.trunc(super.next())
    }
}