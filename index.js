const { parse } = require('csv-parse');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const sha256 = require('sha256');
const dataArray = [];

const csvWriter = createCsvWriter({
    path: 'hashing.output.csv',
    header: [{ id: 'Series_Number', title: 'Series_Number' },
    { id: 'Filename', title: 'Filename' },
    { id: 'Name', title: 'Name' },
    { id: 'Description', title: 'Description' },
    { id: 'Gender', title: 'Gender' },
    { id: 'Attributes', title: 'Attributes' },
    { id: 'UUID', title: 'UUID' },
    { id: 'HASH', title: 'HASH' }],
});

fs.createReadStream("HNGi9 CSV FILE - Sheet1.csv")
    .pipe(parse({
        comment: '#',
        columns: true,
        delimiter: ",",
        from_line: 1
    }))

    .on("data", async (row) => {

        const dataHash = sha256(JSON.stringify(row))
        row.HASH = dataHash;
        dataArray.push(row);

        const format = {
            "format": "CHIP-0007",
            "name": row.Name,
            "description": row.Description,
            "minting_tool": "SuperMinter/2.5.2",
            "sensitive_content": false,
            "series_number": row.Series_Number,
            "series_total": 420,
            "attributes": [
                {
                    "trait_type": "gender",
                    "value": row.Gender
                },
                {
                    "trait_type": "UUID",
                    "value": row.UUID
                },
                {
                    "trait_type": "attributes",
                    "value": row.Attributes

                }

            ],
            "collection": {
                "name": row.Filename,
                "id": "e43fcfe6-1d5c-4d6e-82da-5de3aa8b3b57",
                "attributes": [
                    {
                        "type": "description",
                        "value": row.Description
                    }
                ]
            }
        }
        const dataString = JSON.stringify(format)

        fs.writeFile(`CHIP-0007/nft${row.Filename}.json`, dataString,
            {
                encoding: "utf8",
                flag: "w",
                mode: 0o666
            },
            (err) => {
                if (err)
                    console.log(err);
                else {
                }
            });
    })

    .on('end', function () {
        csvWriter.writeRecords(dataArray)
            .then(() => {
                console.log('...Done');
            });
    });