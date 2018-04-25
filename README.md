# xmplr -- Exemplar -- Statistical object generator

This library creates "Exemplars" or statistical object generator for defining and creating an arbitrary object where each attribute conforms to a statistical distribution.


## Example - generate a single customer at a time (typescript)

Generate customers as an xmplr Object model that will have a random but reasonable: first name, last name, adult age, date of purchase, and model from a list.


```typescript
    let personModel = {
        first: new xFirstNames(),
        last: new xLastNames(),
        age: new xAdultAges(),
        location: new xZipCodes()
    }

    let xPerson = new xObject(personModel)
    let person = xPerson.next()
    console.log(person)
```

## Example - an arrival rate of customers at a time

Return a list of models as "arrivals" satisfying a poisson distribution of number of arrivals per moment.

Wait for **delayMsec** milliseconds and return **rate** (10) per second.
xRateRand/xRateModel work on millisecond rates, so divide you per second rate by 1000.

xRateModel takes a minimum arrival rate (1 in this case) to add to the randomly generated rate to
act as a floor. This guarantees **minimum** number of arrivals per **next()** call.

```typescript
async function arrivals(){
    let rate = 10/1000
    let xReceipts = new xRateModel(xPerson, new xRateRand(rate), 1)
    let delays = [100,400,1000,200]
    for( let i = 0; i < delays.length; i++ ){
        let delay = delays[i]
        await wait(delay)
        let receipts = xReceipts.next()
        assert( receipts.length > 0, `Receipts Has ${receipts.length} > 0` )
        let person:any = receipts[0]
        assert( typeof person.first === "string", `person has first name ${person.first}`)
    }
}
arrivals()
```

### Simulating packet arrivals per second on a 1Gb network

1-Gb/s Ethernet interface can deliver between 80k and 1.4 million packets per second.
An average network with larger packets may deliver about 100k packets per second.
A xBetaRand shape (1,5) heavily weights in the first 40% and can approximate small office network traffic rates with spikes.

```typescript
> import {xRateRand,xBetaRand} from "xmplr"
> var avg = 100000 // average of 100,000 packets per second
> var network = new xRateRand(avg,new x.xBetaRand(1,5))
> var pkts = () => Math.trunc(network.next())
> pkts()
22779
> pkts()
290768
> pkts()
7073
> pkts()
97729
```

# Simulation Data
There are a number of US related source files in the "./data" directory.

## Simulating names using Common US First and Last Names

The default names are contained in "First_Names.csv" and "last_Names.csv" files in the "./data" directory.

The names were downloaded from [here](http://www.quietaffiliate.com/free-first-name-and-last-name-databases-csv-and-sql/)

No license information was provided.

Supply your own array to xList() to create your own list of names, with possibly distributions.

## Simulating locations using US Zip Codes

The default zip codes are contained in "US_Zip_Codes.csv" in the "./data" directory.

The data was downloaded [from github user erichurst](https://gist.github.com/erichurst/7882666)

Original source information:

    All US zip codes with their corresponding latitude and longitude coordinates. Comma delimited for your database goodness.

[Census Source](http://www.census.gov/geo/maps-data/data/gazetteer.html)

# Monty Hall Problem

An example of the **Monty Hall Problem** is test/montyhall.tape.ts.

 The test demonstrates a simple usage of xLists to simulate the [Monty Hall Problem](https://en.wikipedia.org/wiki/Monty_Hall_problem).
 
 1. Behind 3 doors, place 1 car and 2 goats
 2. Player chooses a door (in this game we "don't look" at our choice until the end)
 3. Game show host shows a goat behind one of the remaining doors.
 4. You can Stay on your first choice, or Switch to the other door.
  
 Switching improves your odds from 1/3 to 2/3!
  
 Run this test and see for yourself.