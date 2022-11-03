const { parse } = require('csv-parse');
const fs = require('fs');
const path = require('path')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const sha256 = require('sha256');
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");


const argv = yargs(hideBin(process.argv))
    .option("file", {
        alias: "file",
        demandOption: true,
        describe: "Path to CSV file",
        type: "string",
    })
    .usage(
        "Usage: $0 --file [csv file path]"
    ).argv;

let teamName = "";
const dataArray = [];
const nfts = [];
const filePath = argv.file;
const filename = path.basename(filePath, ".csv");


fs.createReadStream(filePath)
    .pipe(parse({
        columns: true,
        delimiter: ",",
        from_line: 1
    }))

    .on("data", async (row) => {

        const temp = row["Series Number"] ?? "";
        if (temp.toLowerCase().startsWith("team")) {
            teamName = temp;
        }

        if (row["Filename"]) {
            nfts.push({ ...row, Team: teamName });
            dataArray.push(row);
        } else {
            dataArray.push(row);
        }
    })
    .on("end", function () {
        nfts.forEach((row) => {
            const format = {
                format: "CHIP-0007",
                name: row["Name"],
                description: row["Description"],
                minting_tool: row["Team"],
                sensitive_content: false,
                series_number: parseInt(row["Series Number"]),
                series_total: nfts.length,
                attributes: [
                    {
                        trait_type: "gender",
                        value: row["Gender"],
                    },
                    {
                        trait_type: "UUID",
                        value: row["UUID"],
                    },
                ],
                collection: {
                    name: "Zuri NFT Tickets for Free Lunch",
                    id: "b774f676-c1d5-422e-beed-00ef5510c64d",
                    attributes: [
                        {
                            type: "description",
                            value: "Rewards for accomplishments during HNGi9.",
                        },
                    ],
                },
            };

            if (row["Attributes"]) {
                row["Attributes"].split(",").forEach((attribute) => {
                    if (attribute) {
                        try {
                            const values = attribute.split(":");
                            const traitType = values[0].trim();
                            const value = values[1].trim();

                            format["attributes"].push({
                                trait_type: traitType,
                                value: value,
                            });
                        } catch (err) {

                            console.log("Something's wrong on line", row["Series Number"]);

                        }
                    }
                });
            }

            const dataString = JSON.stringify(format)

            const dataHash = sha256(JSON.stringify(row))
            row.Hash = dataHash;

            fs.writeFileSync(`CHIPS/nft${row.Filename}.json`, dataString);

            const csvWriter = createCsvWriter({
                path: `${filename}.output.csv`,
                header: [{ id: 'Series_Number', title: 'Series_Number' },
                { id: 'Filename', title: 'Filename' },
                { id: 'Name', title: 'Name' },
                { id: 'Description', title: 'Description' },
                { id: 'Gender', title: 'Gender' },
                { id: 'Attributes', title: 'Attributes' },
                { id: 'UUID', title: 'UUID' },
                { id: 'HASH', title: 'HASH' }],
            });

            csvWriter
                .writeRecords(dataArray)
            // .then(() => console.log("...Done!"))

        });
    })
    .on("error", (err) => {
        console.log("error occured", err);
    });
