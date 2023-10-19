const Airtable = require('airtable');
const axios = require('axios');
const base = new Airtable({apiKey: process.env.AIRTABLE_APIKEY}).base('appTDzZIAs6Mp5rKR');
const { readFileSync } = require('fs')
// converting the file Buffer to a UTF-8 string for CREPO query
const query = readFileSync(require.resolve('../queries/liveBibleSync.graphql')).toString('utf-8')

const airsync = async () => {
    console.log("Airsync started")
    let functionStart = Date.now()

    // FETCH ASSETS FROM CREPO VIA CONTENT DELIVERY API
    // production endpoint
    const productionEndpoint = 'https://api.redbull.com';
    // staging endpoint //
    //const stagingEndpoint = 'https://edge-graphql.crepo-staging.redbullaws.com/'
    const crepoHeaders = {
        "apiKey": process.env.CREPO_APIKEY
    }

    const graphQLClient = axios.create({
        baseURL: productionEndpoint,
        timeout: 5000,
        headers: crepoHeaders
    })

    let airtableConfirmation = await new Promise((resolve, reject) => {
        base('tblcBcHOX50iZfF2J').select({
            view: 'viwfkM7Pi48Jc7cPl',
            returnFieldsByFieldId: true,
            fields: ['fldFGXTtyqyDaQlpf', 'fldHfuW45YILgxoeQ', 'fld1WI79mBCW6nPSe', 'fldi86dbQxPrKxFxG', 'fldLLIl82LeeSjtX3', 'fldkXpnvqRHAyCQ3k', 'flddKwg8N7VJRCVm6', 'fldeKGG0oUcqX0rEk', 'fldeKGG0oUcqX0rEk', 'fldJXG5pIWTVsDhOn']
        }).eachPage(async function page(records, fetchNextPage) {
            // This function (`page`) will get called for each page of records.

            if (records.length === 0)
                resolve("no Events selected for Sync")

            for (const record of records) {
                console.log('Retrieved', record.get('fld1WI79mBCW6nPSe') + " | " + record.get('fldi86dbQxPrKxFxG') + " | " + record.get('fldLLIl82LeeSjtX3'));

                console.log(record.get("fldHfuW45YILgxoeQ"))
                const crepoQuery = {
                    query: query,
                    variables: {
                        CRID: record.get("fldHfuW45YILgxoeQ")
                    }
                }

                let now = new Date().toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric", minute:"numeric", hour:"numeric"})

                let updateFields = {
                    "fldJXG5pIWTVsDhOn": false,
                    "fldFGXTtyqyDaQlpf": "Last Sync: " + now
                }

                await graphQLClient.post('/v1/graphql', crepoQuery).catch(err => {console.error(err)}).then(res => {
                    if(res){
                        let data = res.data.data.resource
                        console.log("Data: ", data)
                        if(data.events)
                            if(data.events.length !== 0)
                                updateFields.fld1WI79mBCW6nPSe = data.events[0].season ? data.events[0].season.title.text : data.events[0].series ? data.events[0].series.title.text : undefined
                        if(data.locations)
                            if(data.locations.length !== 0)
                                if(data.locations[0].location)
                                    updateFields.fldi86dbQxPrKxFxG = data.locations[0].location.countryName + ", " + data.locations[0].location.city || data.locations[0].location.city || data.locations[0].location.countryName || undefined
                        if(data.title)
                            updateFields.fldLLIl82LeeSjtX3 = data.title.text || undefined
                        if(data.startDate)
                            updateFields.fldkXpnvqRHAyCQ3k = data.startDate.dateTimeUTC
                        if(data.endDate)
                            updateFields.flddKwg8N7VJRCVm6 = data.endDate.dateTimeUTC
                        if(data.videoEssence)
                            updateFields.fldeKGG0oUcqX0rEk = data.videoEssence.VIN || undefined
                    }
                });

                console.log(updateFields)
                record.updateFields(updateFields).catch(err => {console.error(err)})

            }

            fetchNextPage();

        }, function done(err) {
            if (err) { console.error(err); reject(err); }
            resolve("done")
            });
        })

    let functionEnd = Date.now()

    return airtableConfirmation === 'done' ? "Time: " + (functionEnd-functionStart) + " ms" : airtableConfirmation
}

module.exports = airsync