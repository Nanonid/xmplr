import * as test from "tape"

import { range, findFirst, xList, xIndex, xObject, xFirstNames, xLastNames, xDates, xFullNames, xAdultAges, IModel, xRateModel, xRateRand, xZipCodes } from "../lib"


test("range", (t: test.Test) => {
    t.plan(7)
    var a = range(3)
    t.assert(a.length == 3, "range 3")
    t.deepEqual(a, [0, 1, 2], "range 3")
    a = range(1, 5)
    t.deepEqual(a, [1, 2, 3, 4])
    a = range(2, 12, 2)
    t.deepEqual(a, [2, 4, 6, 8, 10])
    a = range(-3, 8, 2)
    t.deepEqual(a, [-3, -1, 1, 3, 5, 7])
    a = range(-3, 13, 3)
    t.deepEqual(a, [-3, 0, 3, 6, 9, 12])
    a = range(1, 5)
    t.deepEqual(a, [1, 2, 3, 4])
    t.end()
})


test("findFirst", (t: test.Test) => {
    var len = 100
    var weights = range(1, len)
    var total = weights.reduce((total, val) => total + val)
    var norms = weights.map((v) => v / total)
    t.equals(findFirst(norms, 0), 0, "first value")
    t.equals(findFirst(norms, norms[norms.length - 1]), norms.length - 1)
    t.equals(findFirst(norms, norms[norms.length - 1] + 1), norms.length, "last + 1")
    let e = norms[0] / 2
    let e2 = e / 2
    for (let i = 0; i < norms.length; i++) {
        let r = norms[i]
        let rni = i
        let rpi = i + 1
        let rne = r - e
        let rne2 = r - e2
        let rpe = r + e
        let rpe2 = r + e2
        t.equals(findFirst(norms, r), i, `ith findFirst(norms,norms[${i}] (${r})) == ${i}`)
        t.equals(findFirst(norms, rne), rni, `ith - e findFirst(norms,${rne}) == ${rni}`)
        t.equals(findFirst(norms, rpe), rpi, `ith + e findFirst(norms,${rpe}) == ${rpi}`)
        t.equals(findFirst(norms, rne2), rni, `ith - e2 findFirst(norms,${rne2}) == ${rni}`)
        t.equals(findFirst(norms, rpe2), rpi, `ith + e2 findFirst(norms,${rpe2}) == ${rpi}`)
    }
    var a = range(0, 13, 2)
    var first = a[0]
    var end = a.length - 1
    var last = a[end]
    t.equal(findFirst(a, 0), 0)
    t.equal(findFirst(a, 2), 1)
    t.equal(findFirst(a, 10), 5)
    t.equal(findFirst(a, -1), 0, "0, -1<0<2, 0th index")
    t.equal(findFirst(a, 0), 0, "0, 0=0<2, 0th index")
    t.equal(findFirst(a, 1), 1, "1, 0<1<2, 1st index")
    t.equal(findFirst(a, 3), 2, "3, 2<3<4, 2nd index")
    t.equal(findFirst(a, first), 0, `first value ${first} == ${first} == 0th index`)
    t.equal(findFirst(a, first - 1), 0, `first value -1 ${first - 1} < ${first} == 0th index`)
    t.equal(findFirst(a, first - 10), 0, `first value -10 ${first - 10} < ${first}, 0th index`)
    t.equal(findFirst(a, last - 1), end, `a[${end}]-1, ${a[end - 1]} < ${a[end] - 1} < ${a[end]} result is end-1 ${end}`)
    t.equal(findFirst(a, last), end, `a[${end}], ${last} = ${last} result is end ${end}`)
    t.equal(findFirst(a, last + 1), end + 1, `a[${end}]+1, ${a[end] + 1} > ${a[end]} result is beyond end ${end + 1}`)
    t.equal(findFirst(a, last + 10), end + 1, `a[${end}]+10, ${a[end] + 10} > ${a[end]} result is beyond end ${end + 1}`)
    t.end()
})


test("xList", (t: test.Test) => {
    var states = ["a", "b", "c", "d", "e"]
    var weights = [1, 2, 3, 4, 5]
    var l = new xList(states, weights)
    t.deepEqual(l.states, states)
    t.deepEqual(l.weights, weights)
    t.equal(l.total, 15)
    var norms = weights.map((v) => v / l.total)
    t.deepEqual(l.normWeights, norms)
    t.end()
})



test("xIndex", (t: test.Test) => {
    var states = ["a", "b", "c", "d", "e"]
    var weights = [1, 2, 3, 4, 5]
    var l = new xList(states, weights)
    var xi = new xIndex(l)
    var r = 0
    for (let i = 0; i < 100; i++) { r += xi.dist!.next() }
    r /= 100
    t.assert(r < 1, "100 dist.next() / 100 < 1")
    t.assert(r >= 0, " 100 dist.next() / 100 >= 0")
    t.deepEqual(l.states, states, "states equal")
    t.deepEqual(l.weights, weights, "weights equal")
    console.log("weights", l.weights)
    console.log("norweights", l.normWeights)
    console.log("states", l.states)
    var cu = xi.cumulativeWeights
    console.log("cumulative", cu)
    var sw = xi.sortedWeights
    console.log("sorted indices", sw)
    t.equals(sw[0], 4, "largest weight first")
    t.equals(sw[4], 0, "smallest weight last")
    t.equals(cu[sw[0]], cu[4], "cumulative weight 4 same")
    t.equals(l.states[sw[0]], "e")
    t.equals(xi.cumulativeForState("e"), cu[0])
    t.equals(xi.cumulativeForState("a"), cu[4])
    t.equals(xi.cumulativeForState("none"), -1)
    t.equals(findFirst(cu, .801), 3, "0.0801 3rd")
    t.equals(findFirst(cu, 0), 0, "cu 0 0th")
    t.equals(findFirst(cu, 1), 4, "cu 1 4th")
    t.equals(findFirst(cu, 1.01), 5, "cu 1.01 length")
    t.equals(xi.firstInterval(1), 4, "firstInterval(1)== length")
    t.equals(xi.intervalFor(1), 0, "intervalFor(1)== 0")
    t.equals(xi.firstInterval(cu[sw[0]]), 4, `firstInterval(cu[sw[0]]) == 4, ${cu[sw[0]]} ==4`)
    t.equals(xi.firstInterval(cu[sw[0]] + 1.0), 5, `firstInterval(cu[sw[0]]+1.0) ${cu[sw[0]] + 1} == 5`)
    t.equals(xi.firstInterval(cu[sw[4]]), 0)
    t.equals(xi.firstInterval(cu[sw[4]] - 0.001), 0)
    t.equals(xi.firstInterval(cu[sw[2]]), 2)
    t.equals(xi.firstInterval(cu[sw[2]] - 0.001), 2, "cu[sw[2]]-0.001 == 2")
    t.equals(xi.firstInterval(cu[sw[2]] + 0.001), 3, "cu[sw[2]]+0.001 == 3")
    t.equals(xi.firstInterval(0), -1, "0 prob -1")
    t.equals(xi.firstInterval(2), sw.length, "2 prob length")
    for (let i = 0; i < sw.length; i++) {
        t.equals(xi.intervalFor(cu[sw[i]]), i, `intervalFor[cum[stateWeight[${i}]] == intervalFor(${cu[sw[i]]}) == ${i}`)
    }
    t.equals(xi.stateFor(0), null, "0 probability null")
    t.equals(xi.stateFor(2), null, "probability > 1 null")
    t.equals(xi.stateFor(1), "a", "prob(1) == a")
    t.equals(xi.stateFor(cu[4]), "a", `prob(a,${cu[4]}) == a`)
    t.equals(xi.stateFor(cu[4] - 0.001), "a", `prob(a)-0.001 still == a`)
    t.equals(xi.stateFor(cu[3]), "b", `prob(b) == b`)
    t.equals(xi.stateFor(cu[3] - 0.001), "b", `prob(b) - 0.001 still == b`)
    r = cu[sw[2]]
    t.equals(xi.firstInterval(r), 2, "cu[sw[2]] == 2")
    t.equals(l.states[2], "c")
    t.equals(xi.stateFor(r), "c", `${r} prob == c`)
    r = cu[sw[2]] + 0.001 // chance for 'c' + 0.001 == 'b'
    t.equals(xi.stateFor(r), "b", `${r} cu[state[2]]+0.001 prob(${r}) == b`)
    r = cu[sw[3]] - 0.001 // chance for 'd' - 0.001 == 'd'
    t.equals(xi.stateFor(r), "d", `${r} cu[state[3]]-0.001 prob(${r}) == d`)
    r = cu[sw[3]] + 0.001 // chance for 'd' + 0.001 == 'e'
    t.equals(xi.stateFor(r), "c", `${r} cu[state[3]]+0.001 prob(${r}) == c`)
    r = cu[sw[4]] - 0.001 // chance for 'e' - 0.001 == 'e'
    t.equals(xi.stateFor(r), "e", `${r} cu[sw[4]]-0.001 prob(${r}) == e`)
    r = 1 // chance for least probable (1) == 'a'
    t.equals(xi.stateFor(r), "a", `${r} prob(${r}) == a`)
    var stats: { [val: string]: number } = {}
    xi.list.states.forEach(val => stats[val] = 0)
    let total = 200000
    for (let i = 0; i < total; i++) {
        let n = xi.next()
        stats[n!] += 1
    }
    let tolerance = 0.01
    xi.list.states.forEach((val, idx) => {
        stats[val] /= total
        let norm = xi.list.normWeights[idx]
        let resid = stats[val] - norm
        t.assert(resid < tolerance, `${val} avg ${stats[val]} - ${norm} = ${resid} < ${tolerance}`)
    })
    t.end()
})

test("xFirstNames", (t) => {
    var first = new xFirstNames()
    var firstNames = new Set(first.list.states)
    for (let i = 0; i < 100; i++) {
        let name: string = first.next()
        t.assert(firstNames.has(name), `Assert firstname ${name} exists`)
    }
    t.end()
})

test("xZipCodes", (t) => {
    var zips = new xZipCodes()
    for (let i = 0; i < 10; i++) {
        let zip = zips.next()
        t.assert(zip.Zip, `Assert zipcode ${zip.Zip} exists`)
        t.assert(zip.Lat != undefined && zip.Lon != undefined, `Assert zip latitude ${zip.Lat}, ${zip.Lon} exists`)
    }
    t.end()
})

test("xLastNames", (t) => {
    var last = new xLastNames()
    var lastNames = new Set(last.list.states)
    for (let i = 0; i < 100; i++) {
        let name: string = last.next()
        t.assert(lastNames.has(name), `Assert lastname ${name} exists`)
    }
    t.end()
})

test("xFullNames", (t) => {
    var names = new xFullNames()
    var lastNames = new Set(names.last.list.states)
    var firstNames = new Set(names.first.list.states)
    for (let i = 0; i < 100; i++) {
        let name = names.next().split(" ")
        t.assert(firstNames.has(name[0]) && lastNames.has(name[1]), `Assert full ${name} exists`)
    }
    t.end()
})

test("xDates", (t) => {
    var startD = new Date("June 1, 2000")
    var dates = new xDates(startD)
    t.equals(dates.fromDate, startD, "start date same")
    for (let i = 0; i < 100; i++) {
        var d = dates.next()
        t.assert((d.getTime() >= startD.getTime()) && d.getFullYear() >= 2000, `Valid year range ${d}`)
    }
    t.end()
})

test("xDates", (t) => {
    var adultAges = new xAdultAges()
    var young = adultAges.young
    var old = adultAges.old
    for (let i = 0; i < 100; i++) {
        let age = adultAges.next()
        t.assert((age >= young) && (age <= old), `Adult age ${age} in range ${young} to ${old}`)
    }
    t.end()
})

let wait = (delay: number, ...args: any[]) => new Promise(resolve => setTimeout(resolve, delay, ...args));
let log = (x: any) => console.log(JSON.stringify(x, null, 2))

test("Example Single Customer", (t) => {
    let personModel = {
        first: new xFirstNames(),
        last: new xLastNames(),
        age: new xAdultAges(),
        location: new xZipCodes()
    }

    let xPerson = new xObject(personModel)
    let person = xPerson.next()
    console.log(person)

    t.assert( typeof person.first === "string", "has first" )
    t.assert( typeof person.last === "string", "has last" )
    t.assert( typeof person.age === "number", "has age" )
    t.assert( typeof person.location === "object", "has location" )
    t.end()
})

async function arrivals(t:test.Test){
    let personModel = {
        first: new xFirstNames(),
        last: new xLastNames(),
        age: new xAdultAges(),
        location: new xZipCodes()
    }

    let xPerson = new xObject(personModel)
    let rate = 10/1000
    let xReceipts = new xRateModel(xPerson, new xRateRand(rate), 1)
    let delays = [100,400,1000,200]
    for( let i = 0; i < delays.length; i++ ){
        let delay = delays[i]
        await wait(delay)
        let receipts = xReceipts.next()
        t.assert( receipts.length > 0, `Receipts Has ${receipts.length} > 0` )
        let person:any = receipts[0]
        t.assert( typeof person.first === "string", `person has first name ${person.first}`)
    }
    t.end()
}

test("Example Rate of Customers", arrivals)

async function Example1(t: test.Test) {

    let models = ["Model 1000", "SUX2000", "FizGig 3.2", "DoA 1.0"]
    let sold = [200, 600, 100, 10]

    let personModel = {
        first: new xFirstNames(),
        last: new xLastNames(),
        purchased: new xDates(new Date("June 1, 2000")),
        age: new xAdultAges(),
        model: new xIndex(new xList(models, sold)),
        location: new xZipCodes()
    }

    let xPerson = new xObject(personModel)
    let rate = 10 / 1000 // 10 per second == 10 / 1000 milliseconds 
    let xPersonSource = new xRateModel(xPerson, new xRateRand(rate), 1)
    let arrivals = xPersonSource.next()
    let delta = 1500
    t.assert(arrivals != null, "arrivals not null")
    t.assert(arrivals.length > 0, "minimum rate of 1")
    t.assert(xPersonSource.lastCount > 0, "minimum last count of 1")
    console.log(`waiting msec ${delta} arrival rate of ${rate} per msec using internal clock`)
    await wait(delta)
    arrivals = xPersonSource.next()
    t.assert(arrivals != null, "arrivals not null")
    console.log(`${arrivals.length} Arrived after ${delta / 1000} seconds`)
    var empty = false
    arrivals.forEach(val => empty = empty && !(val == null || val == undefined))
    t.assert(!empty, "No empty elements in array")
    console.log("example person")
    log(arrivals[0])
    t.assert(arrivals.length > 1, "should have at least 1 arrival")
    delta = 5000
    console.log(`faster than real time msec ${delta} arrival rate of ${rate} per msec using supplied delta`)
    arrivals = xPersonSource.nextPeriod(delta)
    t.assert(arrivals != null, "arrivals not null")
    console.log(`${arrivals.length} Arrived after ${delta / 1000} seconds`)
    empty = false
    arrivals.forEach(val => empty = empty && !(val == null || val == undefined))
    t.assert(!empty, "No empty elements in array")
    console.log("example person")
    log(arrivals[0])
    t.assert(arrivals.length > 1, "should have at least 1 arrival")

    t.end()
}

test("xObject example 1", Example1)
