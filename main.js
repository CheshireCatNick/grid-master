'use strict';
const config = require('./config');
const KLine = require('./objects/k-line');
const moment = require('moment');

const isProvided = s => s !== undefined && s !== '';
const round = n => Math.round(n * 100) / 100;
function createOrders(gridQuant, currentPrice) {
    const delta = (config.upperLimit - config.lowerLimit) / (gridQuant - 1);
    const orders = [];
    // sell order
    for (let p = config.upperLimit; p >= currentPrice; p -= delta) {
        orders.push({ price: round(p), type: 's', activate: true, init: true });
    }
    for (let p = config.lowerLimit; p <= currentPrice; p += delta) {
        orders.push({ price: round(p), type: 'b', activate: true, init: false });
    }
    orders[orders.length - 1].activate = false;
    orders.sort((a, b) => b.price - a.price);
    return orders;
}
// get time from config
let start = undefined, end = undefined;
if (isProvided(config.start) && isProvided(config.end)) {
    start = moment(config.start);
    end = moment(config.end);
}
else if (isProvided(config.start && !isProvided(config.end))) {
    start = moment(config.start);
    end = moment(config.start).add(config.duration);
}
else if (isProvided(config.end && !isProvided(config.start))) {
    end = moment(config.end);
    start = moment(config.end).subtract(config.duration);
}
else {
    end = moment();
    start = moment().subtract(config.duration);
}
console.log('start:', start.toString());
console.log('end:', end.toString());
// get k-line
const kl = new KLine();
kl.init(start, end, config.pair, config.interval).then(() => {
    let maxProfit = -Infinity, bestGridQuant = config.gridQuantRange[0];
    for (let gridQuant = config.gridQuantRange[0]; gridQuant <= config.gridQuantRange[1]; gridQuant++) {
        console.log('testing grid quantity =', gridQuant);
        const orders = createOrders(gridQuant, kl.candles[0].open);
        const profit = kl.backtest(orders);
        if (profit > maxProfit) {
            maxProfit = profit;
            bestGridQuant = gridQuant;
        }
    }
    const days = (end - start) / 86400000;
    const annualReturn = round(maxProfit * 365 / days * 100);
    console.log('Best grid quantity:', bestGridQuant);
    console.log(`Estimated annual return: ${annualReturn}%`);
});



