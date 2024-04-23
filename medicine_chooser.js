const fs = require('fs');
const { parse } = require('csv-parse');

function qualifier(medicine, condition) {
    return (
        medicine['Uses'].toLowerCase().includes(condition)
        && medicine['Excellent Review %'] > 60
        && medicine['Poor Review %'] < 20
    );
}

function chooseMedicines(condition, filename, callback) {
    const results = [];
    const parser = parse({ columns: true });

    fs.createReadStream(filename)
        .pipe(parser)
        .on('data', medicine => {
            if (qualifier(medicine, condition)) {
                results.push(medicine);
            }
        })
        .on('error', err => {
            console.error('Error reading CSV file:', err);
            callback(err, null);
        })
        .on('end', () => {
            callback(null, results);
        });
}

function splitOnCapitals(str) {
    return str.match(/[A-Z][^A-Z]*/g).map(substring => substring.trim());
}

function formatResults(results, condition) {
    console.log('Filtered results for condition:', condition);
    results.forEach(medicine => {
        console.log(`Name: ${medicine['Medicine Name']} (${medicine['Composition']})\nUses: ${medicine['Uses'].trim()}\nSide effects:\n${splitOnCapitals(medicine['Side_effects']).map((s, index) => (index === 0 ? '\t' + s : '\n\t' + s)).join('')}\nExcellent Review %: ${medicine['Excellent Review %']}, Poor Review %: ${medicine['Poor Review %']}\n`);
    });
}

const condition = process.argv.slice(2).join(' ').toLowerCase(); // Get the condition from command line arguments
const filename = 'Medicine_Details.csv';

if (!condition) {
    console.log('Usage: node medicine_chooser.js <condition>');
} else {
    chooseMedicines(condition, filename, (err, results) => {
        if (err) {
            // Handle error nicely
            return;
        }
        if (results.length === 0) {
            console.log(`no results for condition: ${condition}`);
        } else {
            formatResults(results, condition);
        }
    });
}
