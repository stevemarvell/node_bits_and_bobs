const express = require('express');
const fs = require('fs');
const { parse } = require('csv-parse');

const app = express();
const port = 3000;

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
    const formattedResults = results.map(medicine => {
        return {
            name: medicine['Medicine Name'],
            composition: medicine['Composition'],
            uses: medicine['Uses'].trim(),
            side_effects: splitOnCapitals(medicine['Side_effects']),
            excellent_review_percent: medicine['Excellent Review %'],
            poor_review_percent: medicine['Poor Review %']
        };
    });
    return {
        condition: condition,
        results: formattedResults
    };
}

app.get('/medicines', (req, res) => {
    const condition = req.query.condition ? req.query.condition.toLowerCase() : '';
    const filename = 'Medicine_Details.csv';

    if (!condition) {
        res.status(400).json({ error: 'Usage: /medicines?condition=<condition>' });
        return;
    }

    chooseMedicines(condition, filename, (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (results.length === 0) {
            res.json({ message: `No results for condition: ${condition}` });
        } else {
            const formattedResults = formatResults(results, condition);
            res.json(formattedResults);
        }
    });
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
